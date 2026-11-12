import React, { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe2,
  Handshake,
  MapPin,
  Target,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWorkspacePreferences } from '../utils/preferences';
import { PIPELINE_STAGES } from '../types/index.ts';
import type { Activity, ActivityType, Agreement, Market, Partner, PipelineStage, Training } from '../types/index.ts';

const ACTIVITY_TYPES: ActivityType[] = ['Meeting', 'Call', 'Email', 'Due Diligence', 'Site Visit', 'Contract Review', 'Follow-up'];

const getActivityLabel = (type: ActivityType, lang: 'id' | 'en'): string => {
  if (lang === 'en') return type;
  const labels: Record<ActivityType, string> = {
    Meeting: 'Pertemuan',
    Call: 'Panggilan',
    Email: 'Email',
    'Due Diligence': 'Uji tuntas',
    'Site Visit': 'Kunjungan',
    'Contract Review': 'Review kontrak',
    'Follow-up': 'Follow-up',
  };
  return labels[type] || type;
};

const getStageLabel = (stage: PipelineStage, lang: 'id' | 'en'): string => {
  if (lang === 'en') return stage;
  const labels: Record<PipelineStage, string> = {
    'Target found': 'Target ditemukan',
    Contacted: 'Dihubungi',
    Qualified: 'Terkualifikasi',
    'Due diligence': 'Uji tuntas',
    Negotiation: 'Negosiasi',
    Agreement: 'Agreement',
    Onboarding: 'Onboarding',
    Active: 'Aktif',
    'On hold': 'Ditunda',
    Rejected: 'Ditolak',
    'Closed / Lost': 'Ditutup / gagal',
  };
  return labels[stage] || stage;
};

const dateKey = (value: Date) => value.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
const todayKey = () => dateKey(new Date());
const shortDate = (value: string, lang: 'id' | 'en') =>
  value
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(value + 'T12:00:00'))
    : '—';

export const ReportsView: React.FC = () => {
  const { markets, partners, activities, agreements, trainings, language } = useApp();
  const [region, setRegion] = useState(() => getWorkspacePreferences().defaultReportRegion);
  const [period, setPeriod] = useState<'30d' | '90d' | '12m' | 'all'>(() => getWorkspacePreferences().defaultReportPeriod);

  const numberFormat = useMemo(() => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'id-ID'), [language]);
  const regions = useMemo(() => Array.from(new Set(markets.map((market) => market.region))).sort((a, b) => a.localeCompare(b)), [markets]);
  const marketById = useMemo(() => new Map(markets.map((market) => [market.id, market] as const)), [markets]);
  const partnerById = useMemo(() => new Map(partners.map((partner) => [partner.id, partner] as const)), [partners]);
  const today = todayKey();
  const startDate = useMemo(() => {
    if (period === 'all') return '0000-01-01';
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - (period === '30d' ? 30 : period === '90d' ? 90 : 365));
    return dateKey(start);
  }, [period]);

  const scopedMarkets = useMemo(() => markets.filter((market) => region === 'All' || market.region === region), [markets, region]);
  const scopedMarketIds = useMemo(() => new Set(scopedMarkets.map((market) => market.id)), [scopedMarkets]);
  const scopedPartners = useMemo(() => partners.filter((partner) => scopedMarketIds.has(partner.marketId)), [partners, scopedMarketIds]);
  const scopedPartnerIds = useMemo(() => new Set(scopedPartners.map((partner) => partner.id)), [scopedPartners]);
  const scopedAgreements = useMemo(() => agreements.filter((agreement) => {
    const partnerMatch = scopedPartnerIds.has(agreement.partnerId);
    const marketMatch = agreement.marketIds?.some((marketId) => scopedMarketIds.has(marketId));
    return region === 'All' || partnerMatch || marketMatch;
  }), [agreements, region, scopedPartnerIds, scopedMarketIds]);
  const periodActivities = useMemo(() => activities.filter((activity) => {
    const isInScope = region === 'All' || scopedPartnerIds.has(activity.relatedPartnerId) || scopedMarketIds.has(activity.relatedMarketId);
    const isInPeriod = period === 'all' || (activity.dueDate >= startDate && activity.dueDate <= today);
    return isInScope && isInPeriod;
  }), [activities, region, scopedPartnerIds, scopedMarketIds, period, startDate, today]);
  const periodTrainings = useMemo(() => trainings.filter((training) => {
    const partner = partnerById.get(training.partnerId);
    const marketId = training.marketId || partner?.marketId;
    const isInScope = region === 'All' || scopedPartnerIds.has(training.partnerId) || (!!marketId && scopedMarketIds.has(marketId));
    const isInPeriod = period === 'all' || (training.scheduledDate >= startDate && training.scheduledDate <= today);
    return isInScope && isInPeriod;
  }), [trainings, partnerById, region, scopedPartnerIds, scopedMarketIds, period, startDate, today]);

  const activeMarketCount = scopedMarkets.filter((market) => market.status === 'Active').length;
  const activePartnerCount = scopedPartners.filter((partner) => partner.pipelineStage === 'Active').length;
  const activeAgreementCount = scopedAgreements.filter((agreement) => agreement.status === 'Signed / Active').length;
  const overdueActivities = periodActivities.filter((activity) => activity.status === 'Overdue' || (activity.status === 'Pending' && activity.dueDate < today)).length;
  const completedTrainingCount = periodTrainings.filter((training) => training.status === 'Completed').length;
  const trainingCompletion = periodTrainings.length ? Math.round((completedTrainingCount / periodTrainings.length) * 100) : 0;

  const pipelineData = useMemo(() => PIPELINE_STAGES.map((stage) => ({
    stage,
    label: getStageLabel(stage, language),
    count: scopedPartners.filter((partner) => partner.pipelineStage === stage).length,
  })), [scopedPartners, language]);
  const pipelineMax = Math.max(1, ...pipelineData.map((item) => item.count));

  const activityData = useMemo(() => ACTIVITY_TYPES.map((type) => ({
    type,
    label: getActivityLabel(type, language),
    count: periodActivities.filter((activity) => activity.type === type).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count), [periodActivities, language]);
  const activityMax = Math.max(1, ...activityData.map((item) => item.count));

  const trainingStatusData = useMemo(() => [
    { label: language === 'en' ? 'Scheduled' : 'Terjadwal', count: periodTrainings.filter((training) => training.status === 'Planned').length, color: 'bg-blue-500' },
    { label: language === 'en' ? 'In Progress' : 'Berlangsung', count: periodTrainings.filter((training) => training.status === 'In Progress').length, color: 'bg-amber-500' },
    { label: language === 'en' ? 'Completed' : 'Selesai', count: completedTrainingCount, color: 'bg-emerald-500' },
    { label: language === 'en' ? 'Cancelled' : 'Dibatalkan', count: periodTrainings.filter((training) => training.status === 'Cancelled').length, color: 'bg-slate-400' },
  ], [periodTrainings, completedTrainingCount, language]);

  const regionRows = useMemo(() => regions
    .filter((item) => region === 'All' || item === region)
    .map((item) => {
      const regionMarkets = markets.filter((market) => market.region === item);
      const ids = new Set(regionMarkets.map((market) => market.id));
      const regionPartners = partners.filter((partner) => ids.has(partner.marketId));
      const regionActivePartners = regionPartners.filter((partner) => partner.pipelineStage === 'Active').length;
      const regionActiveAgreements = agreements.filter((agreement) => agreement.status === 'Signed / Active' && (regionPartners.some((partner) => partner.id === agreement.partnerId) || agreement.marketIds?.some((id) => ids.has(id)))).length;
      return { region: item, markets: regionMarkets.length, activeMarkets: regionMarkets.filter((market) => market.status === 'Active').length, partners: regionPartners.length, activePartners: regionActivePartners, agreements: regionActiveAgreements };
    })
    .sort((a, b) => b.markets - a.markets || b.partners - a.partners), [regions, region, markets, partners, agreements]);

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [[
      language === 'en' ? 'Type' : 'Jenis',
      'ID',
      language === 'en' ? 'Name / Description' : 'Nama / Deskripsi',
      'Market',
      'Status',
      language === 'en' ? 'Date' : 'Tanggal',
      'PIC',
    ]];
    scopedMarkets.forEach((market: Market) => rows.push(['Market', market.id, market.country, market.region, market.status, market.updatedAt, market.owner]));
    scopedPartners.forEach((partner: Partner) => rows.push(['Partner', partner.id, partner.companyName, marketById.get(partner.marketId)?.country || partner.country, partner.pipelineStage, partner.updatedAt, partner.owner]));
    scopedAgreements.forEach((agreement: Agreement) => rows.push(['Agreement', agreement.agreementCode, agreement.name, agreement.territory, agreement.status, agreement.endDate, agreement.owner]));
    periodActivities.forEach((activity: Activity) => rows.push(['Activity', activity.id, activity.title, marketById.get(activity.relatedMarketId)?.country || '', activity.status, activity.dueDate, activity.owner]));
    periodTrainings.forEach((training: Training) => rows.push(['Training', training.id, training.title, marketById.get(training.marketId || partnerById.get(training.partnerId)?.marketId || '')?.country || '', training.status, training.scheduledDate, training.trainer]));
    const safeCell = (value: string | number) => {
      let text = String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = '﻿' + rows.map((row) => row.map(safeCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ibd-insights-' + today + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span>Insights</span><span className="text-slate-300">/</span><span className="text-slate-500">Reports</span></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Market Expansion Insights</h1>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'en'
              ? 'View pipeline health, regional coverage, activities, and partner enablement.'
              : 'Lihat kesehatan pipeline, cakupan wilayah, aktivitas, dan enablement partner.'}
          </p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Download className="h-4 w-4" /> {language === 'en' ? 'Export CSV' : 'Ekspor CSV'}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {language === 'en' ? 'Report filters' : 'Filter laporan'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {language === 'en'
              ? 'Current market and pipeline snapshot; period filters activities and trainings.'
              : 'Snapshot market dan pipeline saat ini; periode memfilter aktivitas serta training.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
              <option value="All">{language === 'en' ? 'All regions' : 'Semua wilayah'}</option>
              {regions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="min-w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
              <option value="30d">{language === 'en' ? 'Last 30 days' : '30 hari terakhir'}</option>
              <option value="90d">{language === 'en' ? 'Last 90 days' : '90 hari terakhir'}</option>
              <option value="12m">{language === 'en' ? 'Last 12 months' : '12 bulan terakhir'}</option>
              <option value="all">{language === 'en' ? 'All periods' : 'Semua periode'}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Globe2}
          label={language === 'en' ? 'Active markets' : 'Market aktif'}
          value={activeMarketCount}
          detail={language === 'en' ? `of ${numberFormat.format(scopedMarkets.length)} markets` : `dari ${numberFormat.format(scopedMarkets.length)} market`}
          tone="blue"
          numberFormat={numberFormat}
        />
        <MetricCard
          icon={Users}
          label={language === 'en' ? 'Active distributors' : 'Distributor aktif'}
          value={activePartnerCount}
          detail={language === 'en' ? `${numberFormat.format(scopedPartners.length)} partners in pipeline` : `${numberFormat.format(scopedPartners.length)} partner dalam pipeline`}
          tone="indigo"
          numberFormat={numberFormat}
        />
        <MetricCard
          icon={Handshake}
          label={language === 'en' ? 'Active agreements' : 'Agreement aktif'}
          value={activeAgreementCount}
          detail={language === 'en' ? `of ${numberFormat.format(scopedAgreements.length)} agreements` : `dari ${numberFormat.format(scopedAgreements.length)} agreement`}
          tone="green"
          numberFormat={numberFormat}
        />
        <MetricCard
          icon={ActivityIcon}
          label={language === 'en' ? 'Overdue activities' : 'Aktivitas terlambat'}
          value={overdueActivities}
          detail={language === 'en' ? `${numberFormat.format(periodActivities.length)} activities in period` : `${numberFormat.format(periodActivities.length)} aktivitas dalam periode`}
          tone="rose"
          numberFormat={numberFormat}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
          <SectionHeading
            icon={Target}
            title={language === 'en' ? 'Distributor pipeline' : 'Pipeline distributor'}
            subtitle={language === 'en' ? 'Partner distribution by current stage' : 'Distribusi partner menurut tahap saat ini'}
          />
          <div className="mt-5 space-y-3">
            {pipelineData.map((item) => (
              <div key={item.stage} className="grid grid-cols-[120px_1fr_28px] items-center gap-3 sm:grid-cols-[150px_1fr_32px]">
                <span className="truncate text-xs font-medium text-slate-600" title={item.label}>{item.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={'h-full rounded-full ' + (item.stage === 'Active' ? 'bg-emerald-500' : item.stage === 'Rejected' || item.stage === 'Closed / Lost' ? 'bg-slate-400' : 'bg-indigo-500')} style={{ width: (item.count / pipelineMax * 100) + '%' }} /></div>
                <span className="text-right text-xs font-bold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <SectionHeading
            icon={CheckCircle2}
            title={language === 'en' ? 'Partner enablement' : 'Enablement partner'}
            subtitle={language === 'en' ? 'Training session completion in selected period' : 'Capaian sesi training pada periode terpilih'}
          />
          <div className="mt-5 flex items-center gap-5">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#10b981 ' + trainingCompletion + '%, #e2e8f0 ' + trainingCompletion + '%)' }}><div className="grid h-[5.25rem] w-[5.25rem] place-items-center rounded-full bg-white"><div className="text-center"><p className="text-xl font-bold text-slate-900">{trainingCompletion}%</p><p className="text-[10px] font-medium text-slate-500">{language === 'en' ? 'completed' : 'selesai'}</p></div></div></div>
            <div className="min-w-0 flex-1 space-y-2.5">
              {trainingStatusData.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><span className={'h-2 w-2 rounded-full ' + item.color} />{item.label}</span><span className="font-bold text-slate-800">{item.count}</span></div>)}
              <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                {language === 'en'
                  ? `${periodTrainings.length} sessions recorded · ${new Set(periodTrainings.map((training) => training.partnerId)).size} partners`
                  : `${periodTrainings.length} sesi tercatat · ${new Set(periodTrainings.map((training) => training.partnerId)).size} partner`}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeading
            icon={ActivityIcon}
            title={language === 'en' ? 'Activities by type' : 'Aktivitas berdasarkan jenis'}
            subtitle={period === 'all' ? (language === 'en' ? 'All activity records' : 'Semua catatan aktivitas') : (language === 'en' ? `Activities ${shortDate(startDate, language)} – ${shortDate(today, language)}` : `Aktivitas ${shortDate(startDate, language)} – ${shortDate(today, language)}`)}
          />
          {activityData.length ? <div className="mt-5 space-y-3">{activityData.map((item) => <div key={item.type} className="grid grid-cols-[105px_1fr_28px] items-center gap-3 sm:grid-cols-[125px_1fr_32px]"><span className="truncate text-xs font-medium text-slate-600">{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: (item.count / activityMax * 100) + '%' }} /></div><span className="text-right text-xs font-bold text-slate-700">{item.count}</span></div>)}</div> : <EmptyChart message={language === 'en' ? 'No activities in this period and region filter.' : 'Belum ada aktivitas dalam filter periode dan wilayah ini.'} />}
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeading
            icon={BarChart3}
            title={language === 'en' ? 'Regional coverage summary' : 'Ringkasan cakupan wilayah'}
            subtitle={language === 'en' ? 'Markets, active partners, and ongoing agreements' : 'Pasar, partner aktif, dan agreement berjalan'}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 pr-3">{language === 'en' ? 'Region' : 'Wilayah'}</th>
                  <th className="pb-2 pr-3 text-right">Market</th>
                  <th className="pb-2 pr-3 text-right">{language === 'en' ? 'Active partners' : 'Partner aktif'}</th>
                  <th className="pb-2 text-right">Agreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionRows.map((row) => (
                  <tr key={row.region}>
                    <td className="py-3 pr-3 font-semibold text-slate-700">{row.region}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{row.activeMarkets}/{row.markets}</td>
                    <td className="py-3 pr-3 text-right text-slate-600">{row.activePartners}/{row.partners}</td>
                    <td className="py-3 text-right font-bold text-slate-800">{row.agreements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!regionRows.length && <EmptyChart message={language === 'en' ? 'No markets for this region.' : 'Belum ada market untuk wilayah ini.'} />}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            icon={FileSpreadsheet}
            title={language === 'en' ? 'Data within report scope' : 'Data dalam cakupan laporan'}
            subtitle={language === 'en' ? 'CSV export includes all records within the selected region and period.' : 'Ekspor CSV mencakup seluruh record pada wilayah dan periode terpilih.'}
          />
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
            <ScopePill>{scopedMarkets.length} {language === 'en' ? 'markets' : 'market'}</ScopePill>
            <ScopePill>{scopedPartners.length} {language === 'en' ? 'partners' : 'partner'}</ScopePill>
            <ScopePill>{scopedAgreements.length} {language === 'en' ? 'agreements' : 'agreement'}</ScopePill>
            <ScopePill>{periodActivities.length} {language === 'en' ? 'activities' : 'aktivitas'}</ScopePill>
            <ScopePill>{periodTrainings.length} {language === 'en' ? 'trainings' : 'training'}</ScopePill>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
          <MapPin className="h-3 w-3" />
          {language === 'en'
            ? 'Updated based on saved data when page was loaded. Commercial targets across different currencies are not summed to avoid mixed FX values.'
            : 'Diperbarui mengikuti data tersimpan saat halaman dibuka. Total target komersial lintas mata uang tidak dijumlahkan agar laporan tidak mencampur nilai FX.'}
        </p>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  detail: string;
  tone: 'blue' | 'indigo' | 'green' | 'rose';
  numberFormat: Intl.NumberFormat;
}> = ({ icon: Icon, label, value, detail, tone, numberFormat }) => {
  const tones = { blue: 'bg-blue-50 text-blue-700', indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-emerald-50 text-emerald-700', rose: 'bg-rose-50 text-rose-700' };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{numberFormat.format(value)}</p>
        </div>
        <span className={'rounded-md p-2 ' + tones[tone]}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
};

const SectionHeading: React.FC<{ icon: React.ElementType; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => <div className="flex items-start gap-2.5"><span className="mt-0.5 rounded-md bg-slate-100 p-1.5 text-slate-600"><Icon className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div></div>;
const EmptyChart: React.FC<{ message: string }> = ({ message }) => <div className="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">{message}</div>;
const ScopePill: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">{children}</span>;
