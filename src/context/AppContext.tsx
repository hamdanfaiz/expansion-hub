import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type {
  Activity,
  Agreement,
  AgreementWorkflowStatus,
  IndustrySegment,
  Market,
  NavigationModule,
  Partner,
  PipelineStage,
  Training,
} from '../types/index.ts';
import { databaseWriteSchema, type DatabaseWritePayload } from '../utils/databaseSchema.ts';
import { DatabaseSync, type SyncState } from '../utils/databaseSync.ts';
import {
  downloadCsvFile,
  generateIndustrySegmentsCsv,
} from '../utils/exportDashboardCsv.ts';
import {
  type Language,
  type TranslationKey,
  getTranslation,
} from '../i18n/translations.ts';

export interface AuthenticatedUser {
  username: string;
  displayName: string;
  role: string;
}

interface AppContextType {
  // Authentication & Server Sync
  authUser: AuthenticatedUser | null;
  isAuthChecking: boolean;
  serverSynced: boolean;
  lastServerSyncAt: string | null;
  syncState: SyncState;
  reloadServerDatabase: () => Promise<boolean>;
  retryServerSave: () => Promise<boolean>;
  downloadUnsavedDraft: () => void;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  downloadServerSqlDump: () => Promise<boolean>;
  downloadServerJsonDb: () => Promise<boolean>;
  importFullDatabaseJson: (jsonData: unknown) => Promise<boolean>;

  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, defaultText?: string) => string;

  // Navigation & View State
  activeTab: NavigationModule;
  setActiveTab: (tab: NavigationModule) => void;
  partnersViewMode: 'table' | 'kanban';
  setPartnersViewMode: (mode: 'table' | 'kanban') => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Data
  markets: Market[];
  partners: Partner[];
  activities: Activity[];
  agreements: Agreement[];
  trainings: Training[];
  industrySegments: IndustrySegment[];

  // Selection / Detail Panels
  viewingMarketId: string | null;
  setViewingMarketId: (id: string | null) => void;
  viewingPartnerId: string | null;
  setViewingPartnerId: (id: string | null) => void;
  viewingAgreementId: string | null;
  setViewingAgreementId: (id: string | null) => void;

  // Modals
  isAddMarketOpen: boolean;
  setIsAddMarketOpen: (open: boolean) => void;
  editingMarket: Market | null;
  setEditingMarket: (market: Market | null) => void;

  isAddPartnerOpen: boolean;
  setIsAddPartnerOpen: (open: boolean) => void;
  editingPartner: Partner | null;
  setEditingPartner: (partner: Partner | null) => void;
  preselectedMarketIdForPartner: string | null;
  setPreselectedMarketIdForPartner: (marketId: string | null) => void;

  isAddActivityOpen: boolean;
  setIsAddActivityOpen: (open: boolean) => void;
  editingActivity: Activity | null;
  setEditingActivity: (activity: Activity | null) => void;
  preselectedPartnerIdForActivity: string | null;
  setPreselectedPartnerIdForActivity: (partnerId: string | null) => void;

  isAddAgreementOpen: boolean;
  setIsAddAgreementOpen: (open: boolean) => void;
  editingAgreement: Agreement | null;
  setEditingAgreement: (agreement: Agreement | null) => void;
  preselectedPartnerIdForAgreement: string | null;
  setPreselectedPartnerIdForAgreement: (partnerId: string | null) => void;

  isResetModalOpen: boolean;
  setIsResetModalOpen: (open: boolean) => void;

  // Actions
  addMarket: (marketData: Omit<Market, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMarket: (id: string, marketData: Partial<Market>) => void;
  deleteMarket: (id: string) => void;

  addPartner: (partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePartner: (id: string, partnerData: Partial<Partner>) => void;
  updatePartnerStage: (partnerId: string, newStage: PipelineStage) => void;
  deletePartner: (id: string) => void;

  addActivity: (activityData: Omit<Activity, 'id' | 'createdAt'>) => void;
  updateActivity: (id: string, activityData: Partial<Activity>) => void;
  toggleActivityStatus: (activityId: string) => void;
  deleteActivity: (id: string) => void;

  addAgreement: (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => void;
  updateAgreement: (
    id: string,
    agreementData: Partial<Agreement>,
    timelineAction?: string,
    timelineNote?: string
  ) => void;
  updateAgreementStatus: (
    id: string,
    newStatus: AgreementWorkflowStatus,
    note?: string
  ) => void;
  deleteAgreement: (id: string) => void;

  addTraining: (trainingData: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTraining: (id: string, trainingData: Partial<Training>) => void;
  deleteTraining: (id: string) => void;

  // Industry Segment CRUDE Actions
  addIndustrySegment: (segmentData: Omit<IndustrySegment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIndustrySegment: (id: string, segmentData: Partial<IndustrySegment>) => void;
  deleteIndustrySegment: (id: string) => { success: boolean; message?: string };
  toggleIndustrySegmentStatus: (id: string) => void;
  exportIndustrySegmentsCsv: () => void;

  resetToSeedData: () => Promise<boolean>;

  // Helper getters
  getMarketById: (id: string) => Market | undefined;
  getPartnerById: (id: string) => Partner | undefined;
  getAgreementById: (id: string) => Agreement | undefined;
  getPartnersByMarketId: (marketId: string) => Partner[];
  getActivitiesByPartnerId: (partnerId: string) => Activity[];
  getAgreementsByPartnerId: (partnerId: string) => Agreement[];
  getAgreementsByMarketId: (marketId: string) => Agreement[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_LANGUAGE = 'gpeh_language_v1';

const DATA_KEYS = ['markets', 'partners', 'activities', 'agreements', 'trainings', 'industrySegments'] as const;
const parseServerSnapshot = (value: unknown): DatabaseWritePayload => {
  const source = value as Record<string, unknown>;
  return databaseWriteSchema.parse(Object.fromEntries(DATA_KEYS.map((key) => [key, source?.[key]])));
};

const downloadText = (text: string, type: string, filename: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Server Sync State
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>({ status: 'loading', message: null, updatedAt: null });
  const [operationBusy, setOperationBusy] = useState(false);
  const hydrationSnapshotRef = React.useRef<string | null>(null);
  const syncRef = React.useRef<DatabaseSync<DatabaseWritePayload> | null>(null);
  if (!syncRef.current) syncRef.current = new DatabaseSync((input, init) => fetch(input, init), parseServerSnapshot, setSyncState);
  const sync = syncRef.current;
  const serverSynced = syncState.status === 'saved';
  const lastServerSyncAt = syncState.updatedAt;

  // Localization state (ID / EN)
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
      if (stored === 'id' || stored === 'en') return stored;
    } catch {
      // ignore
    }
    return 'id'; // default Indonesian
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey | string, defaultText?: string) => {
    return getTranslation(language, key, defaultText);
  };

  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationModule>('overview');
  const [partnersViewMode, setPartnersViewMode] = useState<'table' | 'kanban'>('kanban');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Selected Detail views
  const [viewingMarketId, setViewingMarketId] = useState<string | null>(null);
  const [viewingPartnerId, setViewingPartnerId] = useState<string | null>(null);
  const [viewingAgreementId, setViewingAgreementId] = useState<string | null>(null);

  // Modals
  const [isAddMarketOpen, setIsAddMarketOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);

  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [preselectedMarketIdForPartner, setPreselectedMarketIdForPartner] = useState<string | null>(null);

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [preselectedPartnerIdForActivity, setPreselectedPartnerIdForActivity] = useState<string | null>(null);

  const [isAddAgreementOpen, setIsAddAgreementOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [preselectedPartnerIdForAgreement, setPreselectedPartnerIdForAgreement] = useState<string | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Business data is loaded from the authenticated server, never from a shared-browser cache.
  const [markets, setMarkets] = useState<Market[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [industrySegments, setIndustrySegments] = useState<IndustrySegment[]>([]);
  const snapshot = useMemo(() => ({ markets, partners, activities, agreements, trainings, industrySegments }),
    [markets, partners, activities, agreements, trainings, industrySegments]);
  const snapshotRef = React.useRef(snapshot);
  snapshotRef.current = snapshot;

  const applySnapshot = React.useCallback((data: DatabaseWritePayload) => {
    setMarkets(data.markets);
    setPartners(data.partners);
    setActivities(data.activities);
    setAgreements(data.agreements);
    setTrainings(data.trainings);
    setIndustrySegments(data.industrySegments);
  }, []);

  const hydrateFromServerDb = React.useCallback(async () => {
    hydrationSnapshotRef.current = 'loading';
    try {
      const data = await sync.load();
      // Keep autosave gated until React has committed this exact hydrated snapshot.
      hydrationSnapshotRef.current = JSON.stringify(data);
      applySnapshot(data);
      return true;
    } catch {
      hydrationSnapshotRef.current = null;
      return false;
    }
  }, [applySnapshot, sync]);

  useEffect(() => {
    // Remove legacy tokens and business-data caches from earlier application versions.
    try {
      for (const key of ['gpeh_auth_token_v1', 'gpeh_markets_v1', 'gpeh_partners_v1',
        'gpeh_activities_v1', 'gpeh_agreements_v1', 'gpeh_trainings_v1', 'gpeh_industry_segments_v1']) {
        localStorage.removeItem(key);
      }
    } catch { /* Browser storage is optional. */ }
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (active && data.authenticated && data.user) {
            await hydrateFromServerDb();
            if (active) setAuthUser(data.user);
          }
        }
      } finally {
        if (active) setIsAuthChecking(false);
      }
    })().catch(() => {});
    return () => { active = false; };
  }, [hydrateFromServerDb]);

  const login = async (usernameInput: string, passwordInput: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ username: usernameInput, password: passwordInput, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated || !data.user) {
        return { ok: false, message: language === 'en' ? 'Unable to sign in.' : 'Tidak dapat masuk.' };
      }
      await hydrateFromServerDb();
      setAuthUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, message: language === 'en' ? 'Authentication server is unavailable.' : 'Server autentikasi tidak dapat dihubungi.' };
    }
  };

  const logout = async () => {
    if (sync.dirty && !window.confirm(language === 'en'
      ? 'Some changes are not saved. Download a draft before signing out. Discard these changes and sign out?'
      : 'Ada perubahan belum tersimpan. Unduh draf sebelum keluar. Buang perubahan ini dan keluar?')) return;
    if (sync.busy) return;
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Sign out failed');
      window.location.reload();
    } catch {
      window.alert(language === 'en' ? 'Sign out failed. Please try again.' : 'Gagal keluar. Silakan coba lagi.');
    }
  };

  // Only stage changed, hydrated snapshots. DatabaseSync serializes requests and revisions.
  useEffect(() => {
    if (!authUser) return;
    if (hydrationSnapshotRef.current !== null) {
      if (JSON.stringify(snapshot) !== hydrationSnapshotRef.current) return;
      hydrationSnapshotRef.current = null;
    }
    sync.stage(snapshot);
    if (!sync.ready) return;
    if (!sync.dirty || sync.state.status === 'error' || sync.state.status === 'conflict') return;
    const timer = setTimeout(() => { void sync.save(); }, 300);
    return () => clearTimeout(timer);
  }, [authUser, snapshot, sync]);

  useEffect(() => {
    const warnUnsaved = (event: BeforeUnloadEvent) => {
      if (sync.dirty) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warnUnsaved);
    return () => window.removeEventListener('beforeunload', warnUnsaved);
  }, [sync]);

  const downloadUnsavedDraft = () => downloadText(JSON.stringify({
    draft: true, savedToServer: false, exportedAt: new Date().toISOString(), data: snapshotRef.current,
  }, null, 2), 'application/json;charset=utf-8', `gpeh-unsaved-draft-${new Date().toISOString().slice(0, 10)}.json`);

  const reloadServerDatabase = async () => {
    if (sync.busy) return false;
    if (sync.dirty && !window.confirm(language === 'en'
      ? 'Download a draft to keep your changes first. Reloading replaces your unsaved changes with the current shared server data. Continue?'
      : 'Unduh draf untuk menyimpan perubahan Anda terlebih dahulu. Muat ulang akan mengganti perubahan belum tersimpan dengan data server bersama. Lanjutkan?')) return false;
    setOperationBusy(true);
    try { return await hydrateFromServerDb(); }
    finally { setOperationBusy(false); }
  };

  const retryServerSave = async () => {
    if (!sync.ready) return reloadServerDatabase();
    sync.stage(snapshotRef.current);
    return sync.save();
  };

  const downloadServerFile = async (format: 'json' | 'sql'): Promise<boolean> => {
    try {
      sync.stage(snapshotRef.current);
      if (!await sync.save()) return false;
      const res = await fetch(`/api/db/export.${format}`, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return false;
      const text = await res.text();
      downloadText(text, format === 'json' ? 'application/json;charset=utf-8' : 'application/sql;charset=utf-8',
        `gpeh-database-${new Date().toISOString().slice(0, 10)}.${format}`);
      return true;
    } catch { return false; }
  };
  const downloadServerSqlDump = () => downloadServerFile('sql');
  const downloadServerJsonDb = () => downloadServerFile('json');

  const importFullDatabaseJson = async (jsonData: unknown): Promise<boolean> => {
    // Server backups also contain read-only metadata/country reference data.
    // Only the six editable collections are restored, using the shared write schema.
    const source = jsonData as Record<string, unknown>;
    const validation = databaseWriteSchema.safeParse(Object.fromEntries(DATA_KEYS.map((key) => [key, source?.[key]])));
    if (!validation.success) {
      window.alert(language === 'en' ? 'Invalid backup: check required fields and linked records.' : 'Cadangan tidak valid: periksa kolom wajib dan relasi record.');
      return false;
    }
    if (!sync.ready || sync.busy || sync.state.status === 'conflict') return false;
    if (!window.confirm(language === 'en'
      ? 'This import replaces all shared server data for every user. Continue?'
      : 'Impor ini mengganti seluruh data server bersama untuk semua pengguna. Lanjutkan?')) return false;
    setOperationBusy(true);
    try {
      sync.stage(snapshotRef.current);
      if (!await sync.save()) return false;
      sync.stage(validation.data);
      if (!await sync.save()) {
        // Keep the previous visible edits; a failed import must not silently replace them.
        sync.stage(snapshotRef.current);
        return false;
      }
      applySnapshot(validation.data);
      return true;
    } finally { setOperationBusy(false); }
  };
  // Market Actions
  const addMarket = (marketData: Omit<Market, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newMarket: Market = {
      ...marketData,
      id: `mkt-${Date.now().toString(36)}`,
      createdAt: today,
      updatedAt: today,
    };
    setMarkets((prev) => [newMarket, ...prev]);
  };

  const updateMarket = (id: string, marketData: Partial<Market>) => {
    const today = new Date().toISOString().split('T')[0];
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...marketData, updatedAt: today } : m))
    );
  };

  const deleteMarket = (id: string) => {
    if (partners.some((p) => p.marketId === id) || activities.some((a) => a.relatedMarketId === id) ||
      agreements.some((a) => a.marketIds.includes(id)) || trainings.some((t) => t.marketId === id)) {
      window.alert(language === 'en'
        ? 'This market is linked to other records. Remove or reassign its partners, activities, agreements and training before deleting it.'
        : 'Pasar ini masih terhubung ke record lain. Hapus atau pindahkan relasi mitra, aktivitas, perjanjian, dan pelatihan sebelum menghapus pasar.');
      return;
    }
    setMarkets((prev) => prev.filter((m) => m.id !== id));
    if (viewingMarketId === id) setViewingMarketId(null);
  };

  // Partner Actions
  const addPartner = (partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!markets.some((market) => market.id === partnerData.marketId)) {
      window.alert(language === 'en' ? 'Create a market before adding a partner, then select that market.' : 'Buat pasar sebelum menambahkan mitra, lalu pilih pasar tersebut.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const newPartner: Partner = {
      ...partnerData,
      id: `ptr-${Date.now().toString(36)}`,
      createdAt: today,
      updatedAt: today,
    };
    setPartners((prev) => [newPartner, ...prev]);
  };

  const updatePartner = (id: string, partnerData: Partial<Partner>) => {
    const today = new Date().toISOString().split('T')[0];
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...partnerData, updatedAt: today } : p))
    );
  };

  const updatePartnerStage = (partnerId: string, newStage: PipelineStage) => {
    const today = new Date().toISOString().split('T')[0];
    setPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, pipelineStage: newStage, updatedAt: today } : p))
    );
  };

  const deletePartner = (id: string) => {
    if (activities.some((a) => a.relatedPartnerId === id) || agreements.some((a) => a.partnerId === id) ||
      trainings.some((t) => t.partnerId === id)) {
      window.alert(language === 'en'
        ? 'This partner is linked to activities, agreements or training. Remove or reassign these records before deleting the partner.'
        : 'Mitra ini masih terhubung ke aktivitas, perjanjian, atau pelatihan. Hapus atau pindahkan record terkait sebelum menghapus mitra.');
      return;
    }
    setPartners((prev) => prev.filter((p) => p.id !== id));
    if (viewingPartnerId === id) setViewingPartnerId(null);
  };

  // Activity Actions
  const addActivity = (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newActivity: Activity = {
      ...activityData,
      id: `act-${Date.now().toString(36)}`,
      createdAt: today,
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Also update partner nextActivityDate if this is upcoming and closer
    if (newActivity.relatedPartnerId && newActivity.dueDate) {
      setPartners((prev) =>
        prev.map((p) => {
          if (p.id === newActivity.relatedPartnerId) {
            return {
              ...p,
              nextActivityDate: newActivity.dueDate,
              updatedAt: today,
            };
          }
          return p;
        })
      );
    }
  };

  const updateActivity = (id: string, activityData: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...activityData } : a))
    );
  };

  const toggleActivityStatus = (activityId: string) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === activityId) {
          const nextStatus = a.status === 'Completed' ? 'Pending' : 'Completed';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // Agreement Actions
  const addAgreement = (
    agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newId = `agr-${Date.now().toString(36)}`;
    const newAgreement: Agreement = {
      ...agreementData,
      id: newId,
      timeline: [
        {
          id: `ev-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          author: agreementData.owner || 'Budi Santoso',
          action: 'Draft Perjanjian Dibuat',
          note: `Pembuatan draf perjanjian ${agreementData.agreementCode} (${agreementData.name}). Status: ${agreementData.status}.`,
          newStatus: agreementData.status,
        },
      ],
      createdAt: today,
      updatedAt: today,
    };
    setAgreements((prev) => [newAgreement, ...prev]);
  };

  const updateAgreement = (
    id: string,
    agreementData: Partial<Agreement>,
    timelineAction?: string,
    timelineNote?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];

    setAgreements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const isStatusChanged = agreementData.status && agreementData.status !== a.status;
          const updatedTimeline = [...a.timeline];

          if (isStatusChanged || timelineAction) {
            updatedTimeline.unshift({
              id: `ev-${Date.now().toString(36)}`,
              timestamp: new Date().toISOString(),
              author: agreementData.owner || a.owner || 'Budi Santoso',
              action:
                timelineAction ||
                (isStatusChanged
                  ? `Status Berubah ke ${agreementData.status}`
                  : 'Perubahan Perjanjian Disimpan'),
              note:
                timelineNote ||
                (isStatusChanged
                  ? `Status workflow diperbarui dari ${a.status} menjadi ${agreementData.status}.`
                  : undefined),
              previousStatus: isStatusChanged ? a.status : undefined,
              newStatus: agreementData.status || a.status,
            });
          }

          return {
            ...a,
            ...agreementData,
            timeline: updatedTimeline,
            updatedAt: today,
          };
        }
        return a;
      })
    );
  };

  const updateAgreementStatus = (
    id: string,
    newStatus: AgreementWorkflowStatus,
    note?: string
  ) => {
    updateAgreement(id, { status: newStatus }, `Status Diubah ke ${newStatus}`, note);
  };

  const deleteAgreement = (id: string) => {
    if (activities.some((a) => a.relatedAgreementId === id)) {
      window.alert(language === 'en'
        ? 'This agreement is linked to activities. Remove or reassign those activities before deleting it.'
        : 'Perjanjian ini masih terhubung ke aktivitas. Hapus atau pindahkan aktivitas terkait sebelum menghapus perjanjian.');
      return;
    }
    setAgreements((prev) => prev.filter((a) => a.id !== id));
    if (viewingAgreementId === id) setViewingAgreementId(null);
  };

  const addTraining = (trainingData: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newTraining: Training = {
      ...trainingData,
      id: `trn-${Date.now().toString(36)}`,
      createdAt: today,
      updatedAt: today,
    };
    setTrainings((prev) => [newTraining, ...prev]);
  };

  const updateTraining = (id: string, trainingData: Partial<Training>) => {
    const today = new Date().toISOString().split('T')[0];
    setTrainings((prev) => prev.map((training) =>
      training.id === id ? { ...training, ...trainingData, updatedAt: today } : training
    ));
  };

  const deleteTraining = (id: string) => {
    setTrainings((prev) => prev.filter((training) => training.id !== id));
  };

  // Industry Segment CRUDE Actions
  const addIndustrySegment = (segmentData: Omit<IndustrySegment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newSegment: IndustrySegment = {
      ...segmentData,
      id: `seg-${Date.now().toString(36)}`,
      createdAt: today,
      updatedAt: today,
    };
    setIndustrySegments((prev) => [newSegment, ...prev]);
  };

  const updateIndustrySegment = (id: string, segmentData: Partial<IndustrySegment>) => {
    const today = new Date().toISOString().split('T')[0];
    setIndustrySegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...segmentData, updatedAt: today } : seg))
    );
  };

  const deleteIndustrySegment = (id: string): { success: boolean; message?: string } => {
    const target = industrySegments.find((s) => s.id === id);
    if (!target) return { success: false, message: 'Segmen tidak ditemukan.' };

    const isUsedInMarkets = markets.some(
      (m) =>
        m.segment?.toLowerCase() === target.name.toLowerCase() ||
        m.segment?.toLowerCase() === target.code.toLowerCase()
    );
    const isUsedInPartners = partners.some(
      (p) =>
        p.segment?.toLowerCase() === target.name.toLowerCase() ||
        p.segment?.toLowerCase() === target.code.toLowerCase()
    );

    if (isUsedInMarkets || isUsedInPartners) {
      return {
        success: false,
        message: `Tidak dapat menghapus segmen "${target.name}" karena masih digunakan oleh ${
          isUsedInMarkets ? 'data Pasar' : ''
        }${isUsedInMarkets && isUsedInPartners ? ' dan ' : ''}${
          isUsedInPartners ? 'data Mitra' : ''
        }. Nonaktifkan status segmen sebagai gantinya.`,
      };
    }

    setIndustrySegments((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  const toggleIndustrySegmentStatus = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setIndustrySegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, isActive: !seg.isActive, updatedAt: today } : seg))
    );
  };

  const exportIndustrySegmentsCsv = () => {
    const csv = generateIndustrySegmentsCsv(industrySegments, markets, partners);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(csv, `master-segmentasi-industri-${dateStr}.csv`);
  };

  const resetToSeedData = async (): Promise<boolean> => {
    if (!sync.ready || sync.busy) return false;
    setOperationBusy(true);
    try {
      sync.stage(snapshotRef.current);
      if (!await sync.save() || !await sync.reset()) return false;
      if (!await hydrateFromServerDb()) return false;
      setViewingMarketId(null);
      setViewingPartnerId(null);
      setViewingAgreementId(null);
      setIsResetModalOpen(false);
      return true;
    } finally { setOperationBusy(false); }
  };
  // Helper getters
  const getMarketById = (id: string) => markets.find((m) => m.id === id);
  const getPartnerById = (id: string) => partners.find((p) => p.id === id);
  const getAgreementById = (id: string) => agreements.find((a) => a.id === id);

  const getPartnersByMarketId = (marketId: string) =>
    partners.filter((p) => p.marketId === marketId);

  const getActivitiesByPartnerId = (partnerId: string) =>
    activities
      .filter((a) => a.relatedPartnerId === partnerId)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const getAgreementsByPartnerId = (partnerId: string) =>
    agreements.filter((a) => a.partnerId === partnerId);

  const getAgreementsByMarketId = (marketId: string) =>
    agreements.filter((a) => a.marketIds && a.marketIds.includes(marketId));

  const contextValue = useMemo(
    () => ({
      // Authentication & Server Sync
      authUser,
      isAuthChecking,
      serverSynced,
      lastServerSyncAt,
      syncState,
      reloadServerDatabase,
      retryServerSave,
      downloadUnsavedDraft,
      login,
      logout,
      downloadServerSqlDump,
      downloadServerJsonDb,
      importFullDatabaseJson,

      // Localization
      language,
      setLanguage,
      t,

      activeTab,
      setActiveTab,
      partnersViewMode,
      setPartnersViewMode,
      globalSearchQuery,
      setGlobalSearchQuery,
      markets,
      partners,
      activities,
      agreements,
      trainings,
      viewingMarketId,
      setViewingMarketId,
      viewingPartnerId,
      setViewingPartnerId,
      viewingAgreementId,
      setViewingAgreementId,
      isAddMarketOpen,
      setIsAddMarketOpen,
      editingMarket,
      setEditingMarket,
      isAddPartnerOpen,
      setIsAddPartnerOpen,
      editingPartner,
      setEditingPartner,
      preselectedMarketIdForPartner,
      setPreselectedMarketIdForPartner,
      isAddActivityOpen,
      setIsAddActivityOpen,
      editingActivity,
      setEditingActivity,
      preselectedPartnerIdForActivity,
      setPreselectedPartnerIdForActivity,
      isAddAgreementOpen,
      setIsAddAgreementOpen,
      editingAgreement,
      setEditingAgreement,
      preselectedPartnerIdForAgreement,
      setPreselectedPartnerIdForAgreement,
      isResetModalOpen,
      setIsResetModalOpen,
      addMarket,
      updateMarket,
      deleteMarket,
      addPartner,
      updatePartner,
      updatePartnerStage,
      deletePartner,
      addActivity,
      updateActivity,
      toggleActivityStatus,
      deleteActivity,
      addAgreement,
      updateAgreement,
      updateAgreementStatus,
      deleteAgreement,
      addTraining,
      updateTraining,
      deleteTraining,
      industrySegments,
      addIndustrySegment,
      updateIndustrySegment,
      deleteIndustrySegment,
      toggleIndustrySegmentStatus,
      exportIndustrySegmentsCsv,
      resetToSeedData,
      getMarketById,
      getPartnerById,
      getAgreementById,
      getPartnersByMarketId,
      getActivitiesByPartnerId,
      getAgreementsByPartnerId,
      getAgreementsByMarketId,
    }),
    [
      authUser,
      isAuthChecking,
      serverSynced,
      lastServerSyncAt,
      syncState,
      language,
      activeTab,
      partnersViewMode,
      globalSearchQuery,
      markets,
      partners,
      activities,
      agreements,
      trainings,
      industrySegments,
      viewingMarketId,
      viewingPartnerId,
      viewingAgreementId,
      isAddMarketOpen,
      editingMarket,
      isAddPartnerOpen,
      editingPartner,
      preselectedMarketIdForPartner,
      isAddActivityOpen,
      editingActivity,
      preselectedPartnerIdForActivity,
      isAddAgreementOpen,
      editingAgreement,
      preselectedPartnerIdForAgreement,
      isResetModalOpen,
    ]
  );

  return <AppContext.Provider value={contextValue}>
    <div inert={operationBusy || undefined}>{children}</div>
    {operationBusy && <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-6">
      <div className="rounded-xl bg-white p-6 text-sm font-semibold text-slate-800 shadow-xl">
        {language === 'en' ? 'Waiting for the server to confirm this operation…' : 'Menunggu konfirmasi operasi dari server…'}
      </div>
    </div>}
  </AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
