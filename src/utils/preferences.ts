export type ReportPeriod = '30d' | '90d' | '12m' | 'all';

export interface WorkspacePreferences {
  defaultReportRegion: string;
  defaultReportPeriod: ReportPeriod;
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  defaultReportRegion: 'All',
  defaultReportPeriod: '90d',
};

const STORAGE_KEY = 'ibd_workspace_preferences_v1';

export function getWorkspacePreferences(): WorkspacePreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_PREFERENCES;
    const saved = JSON.parse(raw) as Partial<WorkspacePreferences>;
    const validPeriods: ReportPeriod[] = ['30d', '90d', '12m', 'all'];
    return {
      defaultReportRegion: typeof saved.defaultReportRegion === 'string' ? saved.defaultReportRegion : DEFAULT_WORKSPACE_PREFERENCES.defaultReportRegion,
      defaultReportPeriod: validPeriods.includes(saved.defaultReportPeriod as ReportPeriod) ? saved.defaultReportPeriod as ReportPeriod : DEFAULT_WORKSPACE_PREFERENCES.defaultReportPeriod,
    };
  } catch {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
