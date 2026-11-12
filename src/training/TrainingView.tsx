import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  MapPin,
  MonitorPlay,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Partner, Training, TrainingCategory, TrainingMode, TrainingStatus } from '../types/index.ts';

const STATUS_TONES: Record<TrainingStatus, string> = {
  Planned: 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const getStatusLabel = (status: TrainingStatus, lang: 'id' | 'en'): string => {
  if (lang === 'en') {
    const enMap: Record<TrainingStatus, string> = {
      Planned: 'Scheduled',
      'In Progress': 'In Progress',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
    };
    return enMap[status] || status;
  }
  const idMap: Record<TrainingStatus, string> = {
    Planned: 'Terjadwal',
    'In Progress': 'Berlangsung',
    Completed: 'Selesai',
    Cancelled: 'Dibatalkan',
  };
  return idMap[status] || status;
};

const getCategoryLabel = (category: TrainingCategory, lang: 'id' | 'en'): string => {
  if (lang === 'en') {
    const enMap: Record<TrainingCategory, string> = {
      Product: 'Product',
      'Sales & Channel': 'Sales & Channel',
      Operations: 'Operations',
      Regulatory: 'Regulatory',
      Marketing: 'Marketing',
      Other: 'Other',
    };
    return enMap[category] || category;
  }
  const idMap: Record<TrainingCategory, string> = {
    Product: 'Produk',
    'Sales & Channel': 'Sales & channel',
    Operations: 'Operasional',
    Regulatory: 'Regulasi',
    Marketing: 'Marketing',
    Other: 'Lainnya',
  };
  return idMap[category] || category;
};

const getModeLabel = (mode: TrainingMode, lang: 'id' | 'en'): string => {
  if (lang === 'en') {
    return mode;
  }
  const idMap: Record<TrainingMode, string> = {
    Online: 'Online',
    'On-site': 'Tatap muka',
    Hybrid: 'Hybrid',
  };
  return idMap[mode] || mode;
};

const formatDate = (date: string, lang: 'id' | 'en') => {
  if (!date) return '—';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date + 'T12:00:00'));
};

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

export const TrainingView: React.FC = () => {
  const { trainings, partners, markets, addTraining, updateTraining, deleteTraining, setActiveTab, setViewingPartnerId, language } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);

  const partnerById = useMemo(() => new Map(partners.map((partner) => [partner.id, partner] as const)), [partners]);
  const marketById = useMemo(() => new Map(markets.map((market) => [market.id, market] as const)), [markets]);
  const today = todayKey();

  const upcomingCount = trainings.filter((item) => item.status === 'Planned' && item.scheduledDate >= today).length;
  const inProgressCount = trainings.filter((item) => item.status === 'In Progress').length;
  const completedCount = trainings.filter((item) => item.status === 'Completed').length;
  const partnerCoverage = new Set(trainings.filter((item) => item.status !== 'Cancelled').map((item) => item.partnerId)).size;

  const filteredTrainings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trainings
      .filter((item) => {
        const partner = partnerById.get(item.partnerId);
        const market = marketById.get(item.marketId || partner?.marketId || '');
        const matchesQuery = !query || [
          item.title,
          item.trainer,
          partner?.companyName,
          partner?.country,
          market?.country,
          getCategoryLabel(item.category, language),
        ].some((value) => value?.toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesQuery && matchesStatus && matchesCategory;
      })
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [trainings, search, statusFilter, categoryFilter, partnerById, marketById, language]);

  const openCreate = () => {
    setEditingTraining(null);
    setIsModalOpen(true);
  };

  const openEdit = (training: Training) => {
    setEditingTraining(training);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTraining(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const partnerId = String(form.get('partnerId') || '');
    const selectedPartner = partnerById.get(partnerId);
    const payload: Omit<Training, 'id' | 'createdAt' | 'updatedAt'> = {
      title: String(form.get('title') || '').trim(),
      category: String(form.get('category') || 'Product') as TrainingCategory,
      partnerId,
      marketId: selectedPartner?.marketId || undefined,
      scheduledDate: String(form.get('scheduledDate') || ''),
      durationHours: Number(form.get('durationHours') || 1),
      mode: String(form.get('mode') || 'Online') as TrainingMode,
      trainer: String(form.get('trainer') || '').trim(),
      status: String(form.get('status') || 'Planned') as TrainingStatus,
      participantCount: Number(form.get('participantCount') || 0),
      meetingLink: String(form.get('meetingLink') || '').trim() || undefined,
      notes: String(form.get('notes') || '').trim() || undefined,
    };

    if (editingTraining) updateTraining(editingTraining.id, payload);
    else addTraining(payload);
    closeModal();
  };

  const handleStatusChange = (training: Training, status: TrainingStatus) => {
    updateTraining(training.id, { status });
  };

  const handleDelete = (training: Training) => {
    if (window.confirm(
      language === 'en'
        ? `Delete session "${training.title}"? This action cannot be undone.`
        : `Hapus sesi “${training.title}”? Tindakan ini tidak dapat dibatalkan.`
    )) {
      deleteTraining(training.id);
    }
  };

  const openPartner = (partnerId: string) => {
    setViewingPartnerId(partnerId);
    setActiveTab('partners');
  };

  const statuses: TrainingStatus[] = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
  const categories: TrainingCategory[] = ['Product', 'Sales & Channel', 'Operations', 'Regulatory', 'Marketing', 'Other'];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Enablement</span><span className="text-slate-300">/</span><span className="text-slate-500">Training</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partner Enablement</h1>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'en'
              ? 'Plan training sessions and monitor distributor readiness across each market.'
              : 'Rencanakan pelatihan dan pantau kesiapan distributor di setiap market.'}
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus className="h-4 w-4" /> {language === 'en' ? 'Schedule Training' : 'Jadwalkan Training'}
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="rounded-md bg-white p-2 text-indigo-600 shadow-sm"><GraduationCap className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {language === 'en' ? 'Build partners ready to scale' : 'Bangun partner yang siap bertumbuh'}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {language === 'en'
              ? 'Log product, sales, operations, regulatory, and marketing training in one workspace.'
              : 'Catat pelatihan produk, sales, operasional, regulasi, dan marketing dalam satu workspace.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label={language === 'en' ? 'Upcoming sessions' : 'Sesi mendatang'}
          value={upcomingCount}
          hint={language === 'en' ? 'Not started' : 'Belum dimulai'}
          tone="blue"
        />
        <MetricCard
          icon={MonitorPlay}
          label={language === 'en' ? 'In progress' : 'Sedang berlangsung'}
          value={inProgressCount}
          hint={language === 'en' ? 'Requires follow-up' : 'Perlu tindak lanjut'}
          tone="amber"
        />
        <MetricCard
          icon={CheckCircle2}
          label={language === 'en' ? 'Completed' : 'Selesai'}
          value={completedCount}
          hint={language === 'en' ? 'Recorded in workspace' : 'Tercatat di workspace'}
          tone="green"
        />
        <MetricCard
          icon={Users}
          label={language === 'en' ? 'Partners reached' : 'Partner terjangkau'}
          value={partnerCoverage}
          hint={language === 'en' ? 'Have training sessions' : 'Memiliki sesi training'}
          tone="indigo"
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'en' ? 'Training schedule & history' : 'Jadwal & riwayat training'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {language === 'en'
                ? `${filteredTrainings.length} sessions found · saved in this browser`
                : `${filteredTrainings.length} sesi ditemukan · tersimpan otomatis di browser ini`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={language === 'en' ? 'Search session, partner, trainer…' : 'Cari sesi, partner, trainer…'}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500">
              <option value="All">{language === 'en' ? 'All statuses' : 'Semua status'}</option>
              {statuses.map((status) => <option key={status} value={status}>{getStatusLabel(status, language)}</option>)}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500">
              <option value="All">{language === 'en' ? 'All topics' : 'Semua topik'}</option>
              {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category, language)}</option>)}
            </select>
          </div>
        </div>

        {filteredTrainings.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-500"><BookOpen className="h-6 w-6" /></div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'en' ? 'No matching sessions found' : 'Belum ada sesi yang cocok'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {language === 'en'
                ? 'Adjust keywords or filters, or schedule a training session for a new partner.'
                : 'Ubah kata kunci atau filter, atau jadwalkan sesi training untuk partner baru.'}
            </p>
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> {language === 'en' ? 'Schedule Training' : 'Jadwalkan Training'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">{language === 'en' ? 'Session / Topic' : 'Sesi / topik'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Partner & Market' : 'Partner & market'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Schedule' : 'Jadwal'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Trainer / Attendees' : 'Trainer / peserta'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Status' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrainings.map((training) => {
                  const partner = partnerById.get(training.partnerId);
                  const market = marketById.get(training.marketId || partner?.marketId || '');
                  return (
                    <tr key={training.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-indigo-50 p-2 text-indigo-600"><BookOpen className="h-4 w-4" /></div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{training.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {getCategoryLabel(training.category, language)} <span className="px-1 text-slate-300">·</span> {getModeLabel(training.mode, language)} <span className="px-1 text-slate-300">·</span> {training.durationHours} {language === 'en' ? 'hrs' : 'jam'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {partner ? (
                          <button onClick={() => openPartner(partner.id)} className="group text-left">
                            <span className="block font-medium text-slate-800 group-hover:text-indigo-700">{partner.companyName}</span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{market?.country || partner.country}</span>
                          </button>
                        ) : <span className="text-sm text-slate-400">{language === 'en' ? 'Partner not available' : 'Partner tidak tersedia'}</span>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(training.scheduledDate, language)}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {training.status === 'Completed'
                            ? (language === 'en' ? 'Completed session' : 'Sesi selesai')
                            : (language === 'en' ? 'Scheduled session' : 'Jadwal sesi')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {training.participantCount} {language === 'en' ? 'attendees' : 'peserta'}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {training.trainer || (language === 'en' ? 'Trainer not set' : 'Trainer belum diatur')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={training.status}
                          onChange={(event) => handleStatusChange(training, event.target.value as TrainingStatus)}
                          aria-label={(language === 'en' ? 'Change status ' : 'Ubah status ') + training.title}
                          className={'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset outline-none ' + STATUS_TONES[training.status]}
                        >
                          {statuses.map((status) => <option key={status} value={status}>{getStatusLabel(status, language)}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          {training.meetingLink && <a href={training.meetingLink} target="_blank" rel="noreferrer" title={language === 'en' ? 'Open session link' : 'Buka link sesi'} className="rounded p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><ExternalLink className="h-4 w-4" /></a>}
                          <button onClick={() => openEdit(training)} title={language === 'en' ? 'Edit session' : 'Edit sesi'} className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(training)} title={language === 'en' ? 'Delete session' : 'Hapus sesi'} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <Video className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold">{language === 'en' ? 'Learning formats' : 'Format pembelajaran'}</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MiniFormat icon={MonitorPlay} title={language === 'en' ? 'Online' : 'Online'} note={language === 'en' ? 'Remote sessions' : 'Sesi jarak jauh'} />
            <MiniFormat icon={MapPin} title={language === 'en' ? 'On-site' : 'Tatap muka'} note={language === 'en' ? 'Partner visits' : 'Kunjungan partner'} />
            <MiniFormat icon={Users} title={language === 'en' ? 'Hybrid' : 'Hybrid'} note={language === 'en' ? 'Combined teams' : 'Gabungan tim'} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <Clock3 className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold">{language === 'en' ? 'Enablement cycle' : 'Siklus enablement'}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
            <StepPill>{language === 'en' ? 'Orientation' : 'Orientasi'}</StepPill>
            <ArrowUpRight className="h-3 w-3 text-slate-300" />
            <StepPill>{language === 'en' ? 'Competency' : 'Kompetensi'}</StepPill>
            <ArrowUpRight className="h-3 w-3 text-slate-300" />
            <StepPill>{language === 'en' ? 'Execution' : 'Eksekusi'}</StepPill>
            <ArrowUpRight className="h-3 w-3 text-slate-300" />
            <StepPill>{language === 'en' ? 'Evaluation' : 'Evaluasi'}</StepPill>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {language === 'en'
              ? 'Log sessions per partner so training plans remain tied to market expansion.'
              : 'Catat sesi per partner agar rencana pelatihan tetap terhubung dengan ekspansi market.'}
          </p>
        </div>
      </div>

      {isModalOpen && (
        <TrainingModal
          key={editingTraining?.id || 'new-training'}
          editingTraining={editingTraining}
          partners={partners}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onOpenPartners={() => { closeModal(); setActiveTab('partners'); }}
          language={language}
        />
      )}
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ElementType; label: string; value: number; hint: string; tone: 'blue' | 'amber' | 'green' | 'indigo' }> = ({ icon: Icon, label, value, hint, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div><span className={'rounded-md p-2 ' + tones[tone]}><Icon className="h-4 w-4" /></span></div>
      <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
};

const MiniFormat: React.FC<{ icon: React.ElementType; title: string; note: string }> = ({ icon: Icon, title, note }) => (
  <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 p-2.5"><Icon className="h-4 w-4 shrink-0 text-slate-500" /><div><p className="text-xs font-semibold text-slate-700">{title}</p><p className="text-[11px] text-slate-500">{note}</p></div></div>
);

const StepPill: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{children}</span>;

const TrainingModal: React.FC<{
  editingTraining: Training | null;
  partners: Partner[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenPartners: () => void;
  language: 'id' | 'en';
}> = ({ editingTraining, partners, onClose, onSubmit, onOpenPartners, language }) => {
  const categories: TrainingCategory[] = ['Product', 'Sales & Channel', 'Operations', 'Regulatory', 'Marketing', 'Other'];
  const modes: TrainingMode[] = ['Online', 'On-site', 'Hybrid'];
  const statuses: TrainingStatus[] = ['Planned', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Enablement · Training</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {editingTraining
                ? (language === 'en' ? 'Edit training session' : 'Edit sesi training')
                : (language === 'en' ? 'Schedule training' : 'Jadwalkan training')}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {language === 'en'
                ? 'Sessions are saved and can be updated at any time.'
                : 'Sesi akan tersimpan dan dapat diperbarui kapan saja.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={language === 'en' ? 'Close form' : 'Tutup formulir'} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-5 py-5">
            {partners.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">
                  {language === 'en' ? 'Add partners first' : 'Tambahkan partner terlebih dahulu'}
                </p>
                <p className="mt-1 text-xs">
                  {language === 'en'
                    ? 'Training is always linked to distributor partners so enablement progress can be tracked.'
                    : 'Training selalu dikaitkan dengan partner distributor agar progres enablement dapat ditelusuri.'}
                </p>
                <button type="button" onClick={onOpenPartners} className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-amber-100">
                  {language === 'en' ? 'Open Partners' : 'Buka Partners'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <FormSection
                  title={language === 'en' ? 'Session information' : 'Informasi sesi'}
                  subtitle={language === 'en' ? 'Topic, partner, and training schedule.' : 'Topik, partner, dan jadwal pelatihan.'}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={language === 'en' ? 'Session name' : 'Nama sesi'} required className="md:col-span-2">
                      <input name="title" required defaultValue={editingTraining?.title || ''} placeholder={language === 'en' ? 'E.g., Product onboarding & positioning' : 'Contoh: Product onboarding & positioning'} className={inputClass} />
                    </Field>
                    <Field label={language === 'en' ? 'Topic' : 'Topik'} required>
                      <select name="category" defaultValue={editingTraining?.category || 'Product'} className={inputClass}>
                        {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category, language)}</option>)}
                      </select>
                    </Field>
                    <Field label={language === 'en' ? 'Distributor partner' : 'Partner distributor'} required>
                      <select name="partnerId" required defaultValue={editingTraining?.partnerId || partners[0]?.id || ''} className={inputClass}>
                        {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.companyName} · {partner.country}</option>)}
                      </select>
                    </Field>
                    <Field label={language === 'en' ? 'Date' : 'Tanggal'} required>
                      <input name="scheduledDate" required type="date" defaultValue={editingTraining?.scheduledDate || todayKey()} className={inputClass} />
                    </Field>
                    <Field label={language === 'en' ? 'Duration (hours)' : 'Durasi (jam)'} required>
                      <input name="durationHours" required type="number" min="0.5" step="0.5" defaultValue={editingTraining?.durationHours || 1} className={inputClass} />
                    </Field>
                  </div>
                </FormSection>
                <FormSection
                  title={language === 'en' ? 'Execution' : 'Pelaksanaan'}
                  subtitle={language === 'en' ? 'Set facilitator, format, and attendees.' : 'Atur fasilitator, format, dan peserta.'}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={language === 'en' ? 'Trainer / facilitator' : 'Trainer / fasilitator'} required>
                      <input name="trainer" required defaultValue={editingTraining?.trainer || ''} placeholder={language === 'en' ? 'Responsible person name' : 'Nama penanggung jawab'} className={inputClass} />
                    </Field>
                    <Field label={language === 'en' ? 'Format' : 'Format'}>
                      <select name="mode" defaultValue={editingTraining?.mode || 'Online'} className={inputClass}>
                        {modes.map((mode) => <option key={mode} value={mode}>{getModeLabel(mode, language)}</option>)}
                      </select>
                    </Field>
                    <Field label={language === 'en' ? 'Attendee count' : 'Jumlah peserta'}>
                      <input name="participantCount" type="number" min="0" step="1" defaultValue={editingTraining?.participantCount ?? 1} className={inputClass} />
                    </Field>
                    <Field label={language === 'en' ? 'Status' : 'Status'}>
                      <select name="status" defaultValue={editingTraining?.status || 'Planned'} className={inputClass}>
                        {statuses.map((status) => <option key={status} value={status}>{getStatusLabel(status, language)}</option>)}
                      </select>
                    </Field>
                    <Field label={language === 'en' ? 'Meeting link / materials' : 'Link meeting / materi'} className="md:col-span-2">
                      <input name="meetingLink" type="url" defaultValue={editingTraining?.meetingLink || ''} placeholder="https://…" className={inputClass} />
                    </Field>
                    <Field label={language === 'en' ? 'Notes / learning outcomes' : 'Catatan / hasil belajar'} className="md:col-span-2">
                      <textarea name="notes" rows={3} defaultValue={editingTraining?.notes || ''} placeholder={language === 'en' ? 'Goals, brief agenda, or session outcomes' : 'Tujuan, agenda singkat, atau hasil sesi'} className={inputClass + ' resize-y'} />
                    </Field>
                  </div>
                </FormSection>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="h-3.5 w-3.5" />
                  {language === 'en'
                    ? 'Related market follows the primary market of the selected partner.'
                    : 'Market terkait mengikuti market utama dari partner yang dipilih.'}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            {partners.length > 0 && (
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                {editingTraining
                  ? (language === 'en' ? 'Save changes' : 'Simpan perubahan')
                  : (language === 'en' ? 'Save session' : 'Simpan sesi')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const inputClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, required, className = '', children }) => (
  <label className={'block space-y-1.5 ' + className}><span className="block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span>{children}</label>
);

const FormSection: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section><div className="mb-3 border-b border-slate-100 pb-2"><h3 className="text-sm font-bold text-slate-800">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div>{children}</section>
);
