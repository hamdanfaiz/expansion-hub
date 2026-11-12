import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PartnerDetailView } from './PartnerDetailView';
import { PartnerKanbanBoard } from './PartnerKanbanBoard';
import { PartnersTableView } from './PartnersTableView';
import { PIPELINE_STAGES, type PipelineStage, type Partner, type Market } from '../../types';

export const PartnersView: React.FC = () => {
  const {
    partners,
    markets,
    viewingPartnerId,
    setViewingPartnerId,
    partnersViewMode,
    setPartnersViewMode,
    setIsAddPartnerOpen,
    setEditingPartner,
    language,
    t,
  } = useApp();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  // Extract unique owners
  const uniqueOwners = useMemo(
    () => Array.from(new Set(partners.map((p: Partner) => p.owner))).filter(Boolean) as string[],
    [partners]
  );

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter((partner: Partner) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        partner.companyName.toLowerCase().includes(q) ||
        partner.country.toLowerCase().includes(q) ||
        partner.contactName.toLowerCase().includes(q) ||
        partner.segment.toLowerCase().includes(q) ||
        partner.owner.toLowerCase().includes(q);

      const matchesStage = stageFilter === 'ALL' || partner.pipelineStage === stageFilter;
      const matchesMarket = marketFilter === 'ALL' || partner.marketId === marketFilter;
      const matchesOwner = ownerFilter === 'ALL' || partner.owner === ownerFilter;

      return matchesSearch && matchesStage && matchesMarket && matchesOwner;
    });
  }, [partners, searchQuery, stageFilter, marketFilter, ownerFilter]);

  // If a partner is currently being viewed, show the detail view
  if (viewingPartnerId) {
    return (
      <PartnerDetailView
        partnerId={viewingPartnerId}
        onBack={() => setViewingPartnerId(null)}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'en' ? 'Commercial Pipeline' : 'Pipeline Komersial'}
            </span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700 border border-indigo-200">
              {partners.length} {language === 'en' ? 'Leads & Partners' : 'Calon & Mitra'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {t('partners.title', 'Pipeline Mitra Distribusi Internasional')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('partners.subtitle', 'Kawal siklus kemitraan dari pencarian target hingga distributor aktif berlisensi.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View mode toggle: Table vs Kanban */}
          <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
            <button
              onClick={() => setPartnersViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition ${
                partnersViewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>{t('partners.view.kanban', 'Kanban')}</span>
            </button>
            <button
              onClick={() => setPartnersViewMode('table')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition ${
                partnersViewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{t('partners.view.table', 'Tabel')}</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPartner(null);
              setIsAddPartnerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>{t('partners.btn.add', 'Tambah Partner')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('partners.search.placeholder', 'Cari nama mitra, kontak, negara, atau email...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">
                {language === 'en' ? 'All Stages (11 Stages)' : 'Semua Tahapan (11 Stage)'}
              </option>
              {PIPELINE_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>

            {/* Market filter */}
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Markets' : 'Semua Pasar'}</option>
              {markets.map((m: Market) => (
                <option key={m.id} value={m.id}>
                  {m.country} ({m.region})
                </option>
              ))}
            </select>

            {/* Owner filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Owners (PIC)' : 'Semua PIC (Owner)'}</option>
              {uniqueOwners.map((owner: string) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {(searchQuery || stageFilter !== 'ALL' || marketFilter !== 'ALL' || ownerFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStageFilter('ALL');
                  setMarketFilter('ALL');
                  setOwnerFilter('ALL');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline px-1"
              >
                {t('common.resetFilter', 'Reset Filter')}
              </button>
            )}
          </div>
        </div>

        {/* Counter & Instruction */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
          <span>
            {language === 'en' ? 'Showing ' : 'Menampilkan '}
            <strong className="text-slate-900">{filteredPartners.length}</strong>
            {language === 'en' ? ' prospective partners' : ' calon mitra'}
          </span>
          <span className="text-slate-400">
            {partnersViewMode === 'kanban'
              ? language === 'en'
                ? 'Use card arrow buttons to instantly shift pipeline stage'
                : 'Gunakan tombol panah pada kartu untuk memindahkan tahapan pipeline secara instan'
              : language === 'en'
                ? 'Click table row to inspect full profile, scorecard, and activity timeline'
                : 'Klik baris tabel untuk melihat profil lengkap, scorecard, dan timeline aktivitas'}
          </span>
        </div>
      </div>

      {/* Main View Display: Kanban or Table */}
      {partnersViewMode === 'kanban' ? (
        <PartnerKanbanBoard filteredPartners={filteredPartners} />
      ) : (
        <PartnersTableView partners={filteredPartners} />
      )}
    </div>
  );
};
