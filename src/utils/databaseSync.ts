export type SyncStatus = 'loading' | 'saved' | 'pending' | 'saving' | 'error' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  message: string | null;
  updatedAt: string | null;
}

/** Serializes writes and rejects stale revisions instead of overwriting another client. */
export class DatabaseSync<T> {
  private revision: number | null = null;
  private savedJson: string | null = null;
  private latest: T | null = null;
  private blocked = false;
  private loading = false;
  private writing: Promise<boolean> | null = null;
  state: SyncState = { status: 'loading', message: null, updatedAt: null };

  constructor(
    private request: typeof fetch,
    private parse: (value: unknown) => T,
    private changed: (state: SyncState) => void,
  ) {}

  get dirty() { return this.latest !== null && JSON.stringify(this.latest) !== this.savedJson; }
  get ready() { return this.revision !== null && !this.loading; }
  get busy() { return this.loading || this.writing !== null; }

  private publish(status: SyncStatus, message: string | null = null, updatedAt = this.state.updatedAt) {
    this.state = { status, message, updatedAt };
    this.changed(this.state);
  }

  async load(): Promise<T> {
    if (this.busy) throw new Error('A database operation is already running.');
    this.loading = true;
    this.revision = null;
    this.publish('loading');
    try {
      const response = await this.request('/api/db', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(response.status === 401 ? 'SESSION_EXPIRED' : 'LOAD_FAILED');
      const body = await response.json();
      const revision = body.meta?.revision;
      if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('INVALID_DATABASE');
      const data = this.parse(body);
      this.revision = revision;
      this.latest = data;
      this.savedJson = JSON.stringify(data);
      this.blocked = false;
      this.publish('saved', null, body.meta?.updatedAt || null);
      return data;
    } catch (error) {
      this.publish('error', error instanceof Error ? error.message : 'LOAD_FAILED');
      throw error;
    } finally {
      this.loading = false;
    }
  }

  stage(data: T) {
    try {
      // Compare the same schema-normalized representation used by load/flush.
      // React mutations can append fields in a different object property order.
      this.latest = this.parse(data);
    } catch {
      this.latest = data;
      this.publish('error', 'INVALID_DATABASE');
      return;
    }
    if (!this.ready || this.blocked || this.state.status === 'error' || this.state.status === 'saving') return;
    this.publish(this.dirty ? 'pending' : 'saved');
  }

  save(): Promise<boolean> {
    if (this.writing) return this.writing;
    if (!this.ready || this.blocked) return Promise.resolve(false);
    this.writing = this.flush().finally(() => { this.writing = null; });
    return this.writing;
  }

  private async flush(): Promise<boolean> {
    try {
      while (this.dirty && this.latest !== null) {
        let snapshot: T;
        try { snapshot = this.parse(this.latest); }
        catch { throw new Error('INVALID_DATABASE'); }
        const json = JSON.stringify(snapshot);
        this.publish('saving');
        const response = await this.request('/api/db', {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'If-Match': `"${this.revision}"` },
          body: json,
        });
        if (response.status === 409) {
          this.blocked = true;
          this.publish('conflict', 'REVISION_CONFLICT');
          return false;
        }
        if (!response.ok) throw new Error(response.status === 401 ? 'SESSION_EXPIRED' : 'SAVE_FAILED');
        const result = await response.json();
        if (!result.ok || !Number.isSafeInteger(result.revision) || result.revision <= this.revision!) {
          throw new Error('INVALID_SAVE_RESPONSE');
        }
        this.revision = result.revision;
        this.savedJson = json;
        this.state = { ...this.state, updatedAt: result.updatedAt || this.state.updatedAt };
      }
      this.publish('saved');
      return true;
    } catch (error) {
      this.publish('error', error instanceof Error ? error.message : 'SAVE_FAILED');
      return false;
    }
  }

  async reset(): Promise<boolean> {
    if (!this.ready || this.busy || this.blocked || this.dirty) return false;
    this.loading = true;
    this.publish('saving');
    try {
      const response = await this.request('/api/db/reset', {
        method: 'POST', credentials: 'include', headers: { 'If-Match': `"${this.revision}"` },
      });
      if (response.status === 409) {
        this.blocked = true;
        this.publish('conflict', 'REVISION_CONFLICT');
        return false;
      }
      if (!response.ok) throw new Error(response.status === 403 ? 'RESET_DISABLED' : response.status === 401 ? 'SESSION_EXPIRED' : 'RESET_FAILED');
      // A fresh GET is mandatory before any subsequent write.
      this.revision = null;
      return true;
    } catch (error) {
      this.publish('error', error instanceof Error ? error.message : 'RESET_FAILED');
      return false;
    } finally {
      this.loading = false;
    }
  }
}
