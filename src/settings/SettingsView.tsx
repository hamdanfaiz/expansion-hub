import React, { useMemo, useRef, useState } from 'react';
import {
  ArchiveRestore,
  Check,
  Clock3,
  Database,
  Download,
  FileCode2,
  Globe2,
  LogOut,
  MapPin,
  Save,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_WORKSPACE_PREFERENCES, getWorkspacePreferences, saveWorkspacePreferences } from '../utils/preferences';
import type { WorkspacePreferences } from '../utils/preferences';
import { IndustrySegmentsManager } from '../components/segments/IndustrySegmentsManager';
import { MASTER_COUNTRIES } from '../data/countryRegionDatabase';

const FieldLabel: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-700">{title}</span>
    {children}
    {hint && <span className="mt-1.5 block text-[11px] text-slate-500">{hint}</span>}
  </label>
);

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</div>
    <div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>
  </div>
);

export const SettingsView: React.FC = () => {
  const {
    authUser,
    logout,
    downloadServerSqlDump,
    downloadServerJsonDb,
    importFullDatabaseJson,
    markets,
    partners,
    activities,
    agreements,
    trainings,
    industrySegments,
    setIsResetModalOpen,
    language,
  } = useApp();
  const [draft, setDraft] = useState<WorkspacePreferences>(() => getWorkspacePreferences());
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regions = useMemo(() => Array.from(new Set(markets.map((market) => market.region))).sort((a, b) => a.localeCompare(b)), [markets]);

  const updateDraft = (patch: Partial<WorkspacePreferences>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
    setNotice('');
  };

  const handleSave = () => {
    saveWorkspacePreferences(draft);
    setSaved(true);
    setNotice(
      language === 'en'
        ? 'Preferences saved in this browser. Selected region and period will be used when opening Reports.'
        : 'Preferensi tersimpan di browser ini. Pilihan wilayah dan periode akan digunakan saat membuka Reports berikutnya.'
    );
  };

  const handleRestoreDefaults = () => {
    setDraft(DEFAULT_WORKSPACE_PREFERENCES);
    saveWorkspacePreferences(DEFAULT_WORKSPACE_PREFERENCES);
    setSaved(true);
    setNotice(
      language === 'en'
        ? 'Default preferences restored and saved.'
        : 'Preferensi awal dipulihkan dan disimpan.'
    );
  };

  const handleExport = async () => {
    const ok = await downloadServerJsonDb();
    setSaved(ok);
    setNotice(
      !ok ? (language === 'en' ? 'Export failed. Check the server status and retry.' : 'Ekspor gagal. Periksa status server lalu coba lagi.') : language === 'en'
        ? 'Full JSON database package downloaded from server.'
        : 'Paket database JSON lengkap berhasil diunduh dari server.'
    );
  };

  const handleExportSql = async () => {
    const ok = await downloadServerSqlDump();
    setSaved(ok);
    setNotice(
      !ok ? (language === 'en' ? 'Export failed. Check the server status and retry.' : 'Ekspor gagal. Periksa status server lalu coba lagi.') : language === 'en'
        ? 'The shared server database SQL backup has been downloaded.'
        : 'Cadangan SQL database server bersama berhasil diunduh.'
    );
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const targetData = parsed.data || parsed;
      const ok = await importFullDatabaseJson(targetData);
      if (ok) {
        setSaved(true);
        setNotice(
          language === 'en'
            ? 'Database JSON successfully imported and synchronized with the Node.js server.'
            : 'Database JSON berhasil diimpor dan disinkronkan ke server Node.js.'
        );
      } else {
        setSaved(false);
        setNotice(language === 'en' ? 'Import was cancelled or was not confirmed by the server. Existing data remains visible.' : 'Impor dibatalkan atau belum dikonfirmasi server. Data sebelumnya tetap ditampilkan.');
      }
    } catch {
      setSaved(false);
      setNotice(
        language === 'en'
          ? 'Invalid JSON backup file format.'
          : 'Format file backup JSON tidak valid.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const counts = [
    { label: 'Markets', value: markets.length },
    { label: 'Partners', value: partners.length },
    { label: language === 'en' ? 'Industry Segments' : 'Segmen Industri', value: industrySegments.length },
    { label: 'Activities', value: activities.length },
    { label: 'Agreements', value: agreements.length },
    { label: 'Training', value: trainings.length },
    { label: language === 'en' ? 'Countries DB' : 'Database Negara', value: MASTER_COUNTRIES.length },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace / Settings</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'en' ? 'Workspace Settings' : 'Pengaturan Workspace'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'en'
              ? 'Manage active user session, report preferences, and workspace data.'
              : 'Kelola sesi pengguna aktif, preferensi laporan, dan data workspace.'}
          </p>
        </div>
        {authUser && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900">{authUser.displayName}</div>
              <div className="text-[11px] text-slate-500">{authUser.role}</div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              <LogOut size={13} />
              <span>{language === 'en' ? 'Sign Out' : 'Keluar'}</span>
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div role="status" className={'rounded-md border px-4 py-3 text-xs ' + (saved ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-blue-50 text-blue-800')}>
          {notice}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={<SlidersHorizontal size={17} />}
          title={language === 'en' ? 'Report preferences' : 'Preferensi laporan'}
          description={language === 'en' ? 'These values serve as the initial filters when you open the Reports module.' : 'Nilai ini menjadi filter awal saat Anda membuka modul Reports.'}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <FieldLabel
            title={language === 'en' ? 'Default region' : 'Wilayah default'}
            hint={language === 'en' ? 'You can still change the region directly in Reports.' : 'Anda tetap dapat mengganti wilayah langsung dari Reports.'}
          >
            <div className="relative">
              <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={draft.defaultReportRegion} onChange={(event) => updateDraft({ defaultReportRegion: event.target.value })} className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="All">{language === 'en' ? 'All regions' : 'Semua wilayah'}</option>
                {regions.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </div>
          </FieldLabel>
          <FieldLabel
            title={language === 'en' ? 'Default period' : 'Periode default'}
            hint={language === 'en' ? 'Period filters activities and training in reports.' : 'Periode memfilter aktivitas dan training pada laporan.'}
          >
            <div className="relative">
              <Clock3 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={draft.defaultReportPeriod} onChange={(event) => updateDraft({ defaultReportPeriod: event.target.value as WorkspacePreferences['defaultReportPeriod'] })} className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="30d">{language === 'en' ? 'Last 30 days' : '30 hari terakhir'}</option>
                <option value="90d">{language === 'en' ? 'Last 90 days' : '90 hari terakhir'}</option>
                <option value="12m">{language === 'en' ? 'Last 12 months' : '12 bulan terakhir'}</option>
                <option value="all">{language === 'en' ? 'All periods' : 'Semua periode'}</option>
              </select>
            </div>
          </FieldLabel>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700">
            <Save size={14} /> {language === 'en' ? 'Save preferences' : 'Simpan preferensi'}
          </button>
          <button type="button" onClick={handleRestoreDefaults} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            <ArchiveRestore size={14} /> {language === 'en' ? 'Restore defaults' : 'Pulihkan default'}
          </button>
          {saved && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check size={14} /> {language === 'en' ? 'Saved' : 'Tersimpan'}</span>}
        </div>
      </section>

      {/* Master Data Industry Segments CRUDE Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <IndustrySegmentsManager />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={<Globe2 size={17} />}
          title={language === 'en' ? 'Regional & format' : 'Regional & format'}
          description={language === 'en' ? 'Formatting applied to ensure workspace consistency across modules.' : 'Format yang dipakai untuk menjaga konsistensi workspace lintas modul.'}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'en' ? 'Language' : 'Bahasa'}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              {language === 'en' ? 'English (EN)' : 'Bahasa Indonesia (ID)'}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {language === 'en' ? 'Navigation labels and workspace display.' : 'Label navigasi dan tampilan workspace.'}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === 'en' ? 'Timezone' : 'Zona waktu'}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">Asia/Jakarta (WIB)</div>
            <div className="mt-[11px] text-[11px] text-slate-500">
              {language === 'en' ? 'Activity dates are displayed according to this zone.' : 'Tanggal aktivitas ditampilkan mengikuti zona ini.'}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          icon={<Database size={17} />}
          title={language === 'en' ? 'Database & Backup' : 'Database & Cadangan Data'}
          description={
            language === 'en'
              ? 'Manage workspace records and export backups in JSON or SQL format.'
              : 'Kelola data workspace dan unduh cadangan database dalam format JSON atau SQL.'
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
          {counts.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{item.label}</div>
              <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{item.value}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {language === 'en' ? 'records saved' : 'record tersimpan'}
              </div>
            </div>
          ))}
        </div>

        {/* JSON & SQL Database Export Actions */}
        <div className="mt-5 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900">
              {language === 'en'
                ? 'Export or Restore Database (JSON & SQL)'
                : 'Ekspor atau Pulihkan Database (JSON & SQL)'}
            </div>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-600">
              {language === 'en'
                ? 'Download a complete backup of all workspace modules (markets, partners, activities, agreements, trainings, and master segments) in JSON or relational SQL format.'
                : 'Unduh cadangan lengkap seluruh modul workspace (markets, partners, activities, agreements, trainings, dan segmen industri) dalam format JSON atau SQL.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportSql}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 cursor-pointer"
            >
              <FileCode2 size={14} />
              <span>{language === 'en' ? 'Download MySQL (.sql)' : 'Unduh Dump MySQL (.sql)'}</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            >
              <Download size={14} />
              <span>{language === 'en' ? 'Download JSON DB' : 'Unduh DB JSON'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            >
              <Upload size={14} />
              <span>{language === 'en' ? 'Import JSON' : 'Impor JSON'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-900">
              {language === 'en' ? 'Restore initial sample data' : 'Pulihkan data sampel awal'}
            </div>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-amber-800">
              {language === 'en'
                ? 'Replaces all shared server data for every user. Disabled by default in production.'
                : 'Mengganti seluruh data server bersama untuk semua pengguna. Dinonaktifkan secara default di produksi.'}
            </p>
          </div>
          <button type="button" onClick={() => setIsResetModalOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-4 py-2.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 cursor-pointer">
            <ArchiveRestore size={14} /> {language === 'en' ? 'Reset sample data' : 'Reset data sampel'}
          </button>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-400">
        <span>Global Partner Expansion Hub</span>
        <span>v1.0</span>
      </div>
    </div>
  );
};

