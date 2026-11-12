import React from 'react';
import {
  Globe,
  Building2,
  CalendarCheck,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Users,
  Compass,
  FileText,
  ShieldAlert,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateDashboardMetrics,
  calculateAgreementMetrics,
  formatDateId,
  formatCurrency,
  getAgreementExpiryStatus,
  getPriorityBadge,
  getStageColor,
  getStatusBadge,
  isActivityOverdue,
} from '../../utils/pipeline';
import type { Activity, PipelineStage } from '../../types';
import { WorldExpansionMap } from './WorldExpansionMap';
import { GlobalPartnerTimezonesCard } from './GlobalPartnerTimezonesCard';
import {
  generateCombinedMarketPartnerCsv,
  generateMarketsOnlyCsv,
  generatePartnersOnlyCsv,
  downloadCsvFile,
} from '../../utils/exportDashboardCsv';

export const DashboardView: React.FC = () => {
  const {
    markets,
    partners,
    activities,
    agreements,
    setActiveTab,
    setViewingMarketId,
    setViewingPartnerId,
    setViewingAgreementId,
    setIsAddMarketOpen,
    setIsAddPartnerOpen,
    setIsAddActivityOpen,
    setIsAddAgreementOpen,
    toggleActivityStatus,
    language,
    t,
  } = useApp();

  const metrics = calculateDashboardMetrics(markets, partners, activities);
  const agreementMetrics = calculateAgreementMetrics(agreements);

  // Overdue and upcoming activities
  const overdueActivities = activities
    .filter((a) => isActivityOverdue(a.dueDate, a.status))
    .slice(0, 5);

  const upcomingActivities = activities
    .filter((a) => a.status === 'Pending' && !isActivityOverdue(a.dueDate, a.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Recently updated partners and markets (sorted by updatedAt)
  const recentPartners = [...partners]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  // Regional distribution of markets
  const regionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    markets.forEach((m) => {
      counts[m.region] = (counts[m.region] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [markets]);

  // Download Report CSV state & handler
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = React.useState<string | null>(null);

  const handleDownloadReport = (type: 'combined' | 'markets' | 'partners' = 'combined') => {
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'markets') {
      const csv = generateMarketsOnlyCsv(markets);
      downloadCsvFile(csv, `ibd-markets-data-${today}.csv`);
      setExportSuccessMessage(`Data ${markets.length} pasar berhasil diekspor (.csv)`);
    } else if (type === 'partners') {
      const csv = generatePartnersOnlyCsv(partners, markets);
      downloadCsvFile(csv, `ibd-partners-pipeline-${today}.csv`);
      setExportSuccessMessage(`Data ${partners.length} mitra berhasil diekspor (.csv)`);
    } else {
      const csv = generateCombinedMarketPartnerCsv(markets, partners);
      downloadCsvFile(csv, `ibd-market-partner-report-${today}.csv`);
      setExportSuccessMessage(`Laporan lengkap ${markets.length} pasar & ${partners.length} mitra berhasil diekspor (.csv)`);
    }
    setIsExportMenuOpen(false);
    setTimeout(() => {
      setExportSuccessMessage(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Workspace Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {language === 'en' ? 'International Business Development Division' : 'Divisi International Business Development'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {t('dashboard.title', 'Overview Ekspansi Global')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('dashboard.subtitle', 'Pantau penetrasi pasar internasional, kelola prospek distributor, dan kawal target kemitraan.')}
          </p>
        </div>

        {/* Action buttons: Download Report, Tambah Market, Tambah Partner, Catat Aktivitas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Report Button with Split / Dropdown Options */}
          <div className="relative inline-flex items-center rounded-md border border-slate-300 bg-white shadow-xs transition hover:border-slate-400">
            <button
              onClick={() => handleDownloadReport('combined')}
              title={language === 'en' ? 'Download market & partner report in CSV format' : 'Download laporan pasar & mitra dalam format CSV'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-98 rounded-l-md transition"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>{t('dashboard.btn.downloadReport', 'Download Report')}</span>
            </button>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              aria-label={language === 'en' ? 'Download CSV report options' : 'Pilihan download laporan CSV'}
              title={language === 'en' ? 'CSV Export Options' : 'Pilihan ekspor CSV'}
              className="border-l border-slate-200 px-1.5 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-r-md transition"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {/* Backdrop click-away for dropdown */}
            {isExportMenuOpen && (
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setIsExportMenuOpen(false)}
              />
            )}

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  {language === 'en' ? 'CSV Format Options' : 'Opsi Format CSV'}
                </div>
                <button
                  onClick={() => handleDownloadReport('combined')}
                  className="w-full px-3 py-2 text-left hover:bg-indigo-50 hover:text-indigo-900 flex items-center justify-between text-slate-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-semibold block text-slate-900">
                        {t('dashboard.csv.allData', 'Semua Data Pasar & Mitra')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {markets.length} {language === 'en' ? 'markets' : 'pasar'} • {partners.length} {language === 'en' ? 'partners' : 'mitra'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-mono font-semibold">.csv</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('markets')}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between text-slate-700 transition border-t border-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-medium block text-slate-800">
                        {t('dashboard.csv.marketsOnly', 'Data Pasar Internasional')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {markets.length} {language === 'en' ? 'countries recorded' : 'negara terdata'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-mono font-semibold">.csv</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('partners')}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between text-slate-700 transition border-t border-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-medium block text-slate-800">
                        {t('dashboard.csv.partnersOnly', 'Data Pipeline Mitra Distributor')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {partners.length} {language === 'en' ? 'contacts & scorecards' : 'kontak mitra & scorecard'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-mono font-semibold">.csv</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAddMarketOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition active:scale-98"
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span>{t('dashboard.btn.addMarket', 'Tambah Market')}</span>
          </button>
          <button
            onClick={() => setIsAddPartnerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition active:scale-98"
          >
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            <span>{t('dashboard.btn.addPartner', 'Tambah Partner')}</span>
          </button>
          <button
            onClick={() => setIsAddActivityOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('dashboard.btn.logActivity', 'Catat Aktivitas')}</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback Banner when CSV is downloaded */}
      {exportSuccessMessage && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-emerald-100 p-1 text-emerald-700">
              <Check className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-semibold block">{exportSuccessMessage}</span>
              <span className="text-[11px] text-emerald-700">
                {language === 'en'
                  ? 'CSV file saved with UTF-8 encoding (compatible with Excel, Numbers, and Google Sheets).'
                  : 'File CSV tersimpan dengan encoding UTF-8 (kompatibel Excel, Numbers, dan Google Sheets).'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4 ERPNext Desk Style Number Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Markets */}
        <div
          onClick={() => setActiveTab('markets')}
          className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t('dashboard.metrics.markets', 'Pasar Internasional')}
            </span>
            <div className="rounded-md bg-slate-100 p-1.5 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.totalMarkets}
            </span>
            <span className="text-xs text-slate-500">
              {t('dashboard.metrics.markets.unit', 'negara terdata')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-emerald-700 font-medium">
              {metrics.activeMarketsCount} {t('dashboard.metrics.markets.active', 'Pasar Aktif')}
            </span>
            <span className="text-slate-400 font-mono">
              {metrics.priorityBreakdown.P1} {t('dashboard.metrics.markets.p1', 'P1 Prioritas')}
            </span>
          </div>
        </div>

        {/* Card 2: Pipeline Partners */}
        <div
          onClick={() => setActiveTab('partners')}
          className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t('dashboard.metrics.partners', 'Pipeline Calon Mitra')}
            </span>
            <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.inPipelinePartners}
            </span>
            <span className="text-xs text-slate-500">
              {t('dashboard.metrics.partners.unit', 'dalam penjajakan')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-indigo-700 font-medium">
              {metrics.dueDiligenceOrNegCount} {language === 'en' ? 'Negotiation / Due Diligence' : 'Negosiasi / Due Diligence'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* Card 3: Active Partnerships */}
        <div
          onClick={() => setActiveTab('partners')}
          className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t('dashboard.metrics.commercial', 'Mitra Komersial Aktif')}
            </span>
            <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.activePartnersCount}
            </span>
            <span className="text-xs text-slate-500">
              {t('dashboard.metrics.commercial.unit', 'mitra komersial')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-slate-600">
              {language === 'en'
                ? `Of ${metrics.totalPartners} recorded contacts`
                : `Dari total ${metrics.totalPartners} kontak terdata`}
            </span>
            <span className="text-emerald-700 font-semibold font-mono">
              {Math.round((metrics.activePartnersCount / (metrics.totalPartners || 1)) * 100)}% {t('dashboard.metrics.commercial.ratio', 'Rasio')}
            </span>
          </div>
        </div>

        {/* Card 4: Overdue & Pending Follow-ups */}
        <div
          onClick={() => setActiveTab('activities')}
          className={`group relative cursor-pointer rounded-lg border p-4 shadow-xs transition hover:shadow-md ${
            metrics.overdueActivitiesCount > 0
              ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {t('dashboard.metrics.followups', 'Follow-up & Tindakan')}
            </span>
            <div
              className={`rounded-md p-1.5 transition ${
                metrics.overdueActivitiesCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metrics.overdueActivitiesCount > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CalendarCheck className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                metrics.overdueActivitiesCount > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {metrics.overdueActivitiesCount}
            </span>
            <span className="text-xs text-slate-500">
              {t('dashboard.metrics.followups.unit', 'tindakan terlambat')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-slate-600">
              {metrics.pendingActivitiesCount} {t('dashboard.metrics.followups.pending', 'total jadwal tunggu')}
            </span>
            <span className="text-indigo-600 font-semibold hover:underline">
              {language === 'en' ? 'Check \u2192' : 'Periksa \u2192'}
            </span>
          </div>
        </div>
      </div>

      {/* Ringkasan Perjanjian Distribusi (Agreements Summary Link & Metrics) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-violet-50 p-2 text-violet-700 border border-violet-100">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{t('dashboard.agreements.title', 'Perjanjian Distribusi Resmi (Agreements)')}</span>
                <span className="rounded bg-slate-100 px-2 py-0.2 text-[11px] font-mono font-semibold text-slate-700">
                  {agreementMetrics.total} {language === 'en' ? 'Total Contracts' : 'Total Kontrak'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {t('dashboard.agreements.subtitle', 'Pelacakan legalitas distribusi, tinjauan legal/finance, dan pemantauan masa berlaku')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddAgreementOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="h-3.5 w-3.5 text-violet-600" />
              <span>{t('agreements.btn.create', 'Buat Agreement')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('agreements');
                setViewingAgreementId(null);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              <span>{t('dashboard.agreements.openModule', 'Buka Modul')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Agreement Metric Counters */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          {/* 1. Draft/Review */}
          <button
            onClick={() => {
              setActiveTab('agreements');
              setViewingAgreementId(null);
            }}
            className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-slate-100 transition text-left"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                {language === 'en' ? 'Draft / Under Review' : 'Draft / Dalam Review'}
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {agreementMetrics.draftOrReview}
              </span>
            </div>
            <span className="rounded bg-sky-100 text-sky-800 px-1.5 py-0.5 text-[10px] font-semibold">
              Review
            </span>
          </button>

          {/* 2. Signed/Active */}
          <button
            onClick={() => {
              setActiveTab('agreements');
              setViewingAgreementId(null);
            }}
            className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-slate-100 transition text-left"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                {language === 'en' ? 'Signed / Active' : 'Signed / Aktif Berjalan'}
              </span>
              <span className="font-mono text-base font-bold text-emerald-700">
                {agreementMetrics.signedActive}
              </span>
            </div>
            <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold">
              {language === 'en' ? 'Active' : 'Aktif'}
            </span>
          </button>

          {/* 3. Expiring in 90 Days */}
          <button
            onClick={() => {
              setActiveTab('agreements');
              setViewingAgreementId(null);
            }}
            className={`flex items-center justify-between rounded-md border p-2.5 transition text-left ${
              agreementMetrics.expiringIn90Days > 0
                ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900'
                : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100'
            }`}
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                {language === 'en' ? 'Expiring \u2264 90 Days' : 'Berakhir \u2264 90 Hari'}
              </span>
              <span className="font-mono text-base font-bold text-amber-700">
                {agreementMetrics.expiringIn90Days}
              </span>
            </div>
            <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold">
              {language === 'en' ? 'Notice Needed' : 'Perlu Notice'}
            </span>
          </button>

          {/* 4. Expired/Terminated */}
          <button
            onClick={() => {
              setActiveTab('agreements');
              setViewingAgreementId(null);
            }}
            className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/70 p-2.5 hover:bg-slate-100 transition text-left"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Expired / Terminated
              </span>
              <span className="font-mono text-base font-bold text-slate-700">
                {agreementMetrics.expiredOrTerminated}
              </span>
            </div>
            <span className="rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-semibold">
              {language === 'en' ? 'Archive' : 'Arsip'}
            </span>
          </button>
        </div>

        {/* Quick chip links to urgent agreements */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('dashboard.agreements.recent', 'Perjanjian Terkini:')}
          </span>
          {agreements.slice(0, 4).map((agr) => {
            const partner = partners.find((p) => p.id === agr.partnerId);
            const expiry = getAgreementExpiryStatus(agr.endDate, agr.status, undefined, language);
            return (
              <button
                key={agr.id}
                onClick={() => {
                  setActiveTab('agreements');
                  setViewingAgreementId(agr.id);
                }}
                className="inline-flex items-center gap-1.5 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-slate-700 text-[11px] transition"
              >
                <span className="font-mono font-semibold text-slate-900">{agr.agreementCode}</span>
                <span className="truncate max-w-[120px]">{partner?.companyName || agr.name}</span>
                <span className={`text-[10px] px-1 rounded ${expiry.badgeColor}`}>
                  {agr.status === 'Signed / Active' ? expiry.label : agr.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual World Map Component: Active Expansion Regions & Partner Density */}
      <WorldExpansionMap
        markets={markets}
        partners={partners}
        onSelectMarket={(marketId) => {
          setActiveTab('markets');
          setViewingMarketId(marketId);
        }}
      />

      {/* World Clock & Working Hours Across Partner Countries */}
      <GlobalPartnerTimezonesCard />

      {/* Main Grid: Pipeline Breakdown & Follow-ups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Pipeline Funnel & Priority Distribution */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card: Partner Pipeline Stage Breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {t('dashboard.pipeline.title', 'Distribusi Pipeline Calon Mitra')} ({metrics.totalPartners} {language === 'en' ? 'Leads' : 'Prospek'})
                </h2>
                <p className="text-xs text-slate-500">
                  {t('dashboard.pipeline.subtitle', 'Kemajuan prospek distributor melalui 11 tahapan standarisasi IBD')}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('partners')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>{t('dashboard.pipeline.openKanban', 'Buka Kanban')}</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(
                [
                  'Target found',
                  'Contacted',
                  'Qualified',
                  'Due diligence',
                  'Negotiation',
                  'Agreement',
                  'Onboarding',
                  'Active',
                  'On hold',
                  'Rejected',
                  'Closed / Lost',
                ] as PipelineStage[]
              ).map((stage) => {
                const count = metrics.stageBreakdown[stage] || 0;
                const percentage =
                  metrics.totalPartners > 0
                    ? Math.round((count / metrics.totalPartners) * 100)
                    : 0;
                const style = getStageColor(stage);

                return (
                  <div key={stage} className="flex items-center gap-3 text-xs">
                    <div className="w-28 truncate font-medium text-slate-700 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                      <span className="truncate">{stage}</span>
                    </div>

                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          stage === 'Active'
                            ? 'bg-emerald-500'
                            : stage === 'Negotiation' || stage === 'Agreement'
                            ? 'bg-indigo-600'
                            : stage === 'Due diligence'
                            ? 'bg-violet-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(percentage, count > 0 ? 6 : 0)}%` }}
                      />
                    </div>

                    <div className="w-16 text-right font-mono font-medium text-slate-600">
                      {count} <span className="text-slate-400 text-[10px]">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Markets by Priority & Region Focus */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Markets by Priority */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('dashboard.marketsByPriority', 'Pasar Berdasarkan Prioritas')}
              </h3>
              <div className="mt-3 space-y-2.5">
                {(['P1', 'P2', 'P3'] as const).map((priority) => {
                  const badge = getPriorityBadge(priority, language);
                  const count = metrics.priorityBreakdown[priority];
                  const percentage =
                    metrics.totalMarkets > 0
                      ? Math.round((count / metrics.totalMarkets) * 100)
                      : 0;

                  return (
                    <div
                      key={priority}
                      onClick={() => setActiveTab('markets')}
                      className="cursor-pointer rounded-md p-2 hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={`px-2 py-0.5 rounded border text-[11px] ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <span className="font-mono text-slate-700">
                          {count} {language === 'en' ? 'Markets' : 'Pasar'} ({percentage}%)
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            priority === 'P1'
                              ? 'bg-red-500'
                              : priority === 'P2'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional Focus Distribution */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('dashboard.regionalFocus', 'Fokus Wilayah Internasional')}
              </h3>
              <div className="mt-3 space-y-2">
                {regionCounts.map(([region, count]) => (
                  <div
                    key={region}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{region}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {count} {language === 'en' ? (count === 1 ? 'country' : 'countries') : 'negara'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Overdue Follow-ups & Recent Updates */}
        <div className="space-y-6">
          {/* Overdue and Upcoming Actions */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t('dashboard.urgentActions', 'Tindakan & Follow-up Segera')}
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('activities')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {t('dashboard.viewAll', 'Lihat Semua')} ({activities.length})
              </button>
            </div>

            {/* Overdue alert if any */}
            {overdueActivities.length > 0 && (
              <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    {overdueActivities.length} {language === 'en' ? 'Tasks Need Immediate Attention' : 'Jadwal Perlu Perhatian Segera'}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {overdueActivities.map((act) => {
                    const partner = partners.find((p) => p.id === act.relatedPartnerId);
                    return (
                      <div
                        key={act.id}
                        className="rounded bg-white p-2 border border-rose-200 text-xs flex items-start justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {partner ? partner.companyName : act.owner} • {language === 'en' ? 'Overdue by' : 'Lewat'} {formatDateId(act.dueDate, language)}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleActivityStatus(act.id)}
                          title={language === 'en' ? 'Mark Completed' : 'Tandai Selesai'}
                          className="shrink-0 p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming items */}
            <div className="mt-4 space-y-2.5">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                {t('dashboard.upcomingThisWeek', 'Mendatang Minggu Ini')}
              </span>
              {upcomingActivities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {language === 'en' ? 'No upcoming tasks at this time.' : 'Tidak ada jadwal mendatang saat ini.'}
                </div>
              ) : (
                upcomingActivities.map((act) => {
                  const partner = partners.find((p) => p.id === act.relatedPartnerId);
                  return (
                    <div
                      key={act.id}
                      className="group flex items-start justify-between gap-2 rounded-md border border-slate-100 p-2 hover:bg-slate-50 transition text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 block truncate group-hover:text-slate-900">
                          {act.title}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="font-mono text-indigo-600">
                            {formatDateId(act.dueDate, language)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{partner?.companyName || act.owner}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleActivityStatus(act.id)}
                        title={language === 'en' ? 'Mark Completed' : 'Tandai Selesai'}
                        className="shrink-0 rounded p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recently Updated Records */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
              {t('dashboard.recentUpdates', 'Pembaruan Prospek Terkini')}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {recentPartners.map((p) => {
                const stageColor = getStageColor(p.pipelineStage);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('partners');
                      setViewingPartnerId(p.id);
                    }}
                    className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 rounded px-1 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-900 truncate">{p.companyName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {p.country} • PIC: {p.owner}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stageColor.bg} ${stageColor.text} ${stageColor.border}`}>
                        {p.pipelineStage}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatDateId(p.updatedAt, language)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
