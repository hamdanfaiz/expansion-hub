import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  ChevronRight,
  Edit,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateId,
  getPriorityBadge,
  getStatusBadge,
} from '../../utils/pipeline';
import { MarketDetailView } from './MarketDetailView';
import type { Market, PriorityLevel, MarketStatus } from '../../types';

export const MarketsView: React.FC = () => {
  const {
    markets,
    partners,
    viewingMarketId,
    setViewingMarketId,
    setIsAddMarketOpen,
    setEditingMarket,
    deleteMarket,
    language,
    t,
  } = useApp();

  // Local filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'country' | 'priority' | 'updatedAt'>('country');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract distinct regions
  const uniqueRegions = useMemo(
    () => Array.from(new Set(markets.map((m) => m.region))).filter(Boolean),
    [markets]
  );

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    return markets
      .filter((market) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          market.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.segment.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.owner.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRegion = regionFilter === 'ALL' || market.region === regionFilter;
        const matchesPriority = priorityFilter === 'ALL' || market.priority === priorityFilter;
        const matchesStatus = statusFilter === 'ALL' || market.status === statusFilter;

        return matchesSearch && matchesRegion && matchesPriority && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField];
        let valB: string | number = b[sortField];

        // Custom sort for priority P1 < P2 < P3
        if (sortField === 'priority') {
          const pOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
          valA = pOrder[a.priority] || 99;
          valB = pOrder[b.priority] || 99;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [markets, searchQuery, regionFilter, priorityFilter, statusFilter, sortField, sortDirection]);

  // If a single market is selected for viewing, render MarketDetailView
  if (viewingMarketId) {
    return (
      <MarketDetailView
        marketId={viewingMarketId}
        onBack={() => setViewingMarketId(null)}
      />
    );
  }

  const toggleSort = (field: 'country' | 'priority' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header and Add Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'en' ? 'Market Expansion Master Data' : 'Master Data Ekspansi'}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
              {markets.length} {language === 'en' ? 'Countries' : 'Negara'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {t('markets.title', 'Daftar Pasar Target Internasional')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {t('markets.subtitle', 'Kelola data negara tujuan ekspor, prioritas TAM, regulasi impor, dan PIC pasar.')}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMarket(null);
            setIsAddMarketOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{t('markets.btn.add', 'Tambah Market Baru')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('markets.search.placeholder', 'Cari nama negara, wilayah, segmen produk, atau owner...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Regions' : 'Semua Wilayah'}</option>
              {uniqueRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Priorities' : 'Semua Prioritas'}</option>
              <option value="P1">{language === 'en' ? 'P1 - Strategic' : 'P1 - Strategis'}</option>
              <option value="P2">{language === 'en' ? 'P2 - Potential' : 'P2 - Potensial'}</option>
              <option value="P3">{language === 'en' ? 'P3 - Secondary' : 'P3 - Sekunder'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Status' : 'Semua Status'}</option>
              <option value="Active">{language === 'en' ? 'Active' : 'Aktif'}</option>
              <option value="Exploring">{language === 'en' ? 'Exploring' : 'Eksplorasi'}</option>
              <option value="On Hold">{language === 'en' ? 'On Hold' : 'Ditunda'}</option>
              <option value="Closed">{language === 'en' ? 'Closed' : 'Ditutup'}</option>
            </select>

            {(searchQuery || regionFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRegionFilter('ALL');
                  setPriorityFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline px-1"
              >
                {language === 'en' ? 'Reset Filters' : 'Reset Filter'}
              </button>
            )}
          </div>
        </div>

        {/* Counter indicator */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
          <span>
            {language === 'en' ? 'Showing ' : 'Menampilkan '}
            <strong className="text-slate-900">{filteredMarkets.length}</strong>
            {language === 'en' ? ` of ${markets.length} markets` : ` dari ${markets.length} pasar`}
          </span>
          <span className="text-slate-400">
            {language === 'en' ? 'Click row to view market & partner details' : 'Klik baris tabel untuk melihat detail pasar dan mitra'}
          </span>
        </div>
      </div>

      {/* Markets Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th
                  onClick={() => toggleSort('country')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('markets.table.country', 'Negara & Wilayah')}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('priority')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('markets.table.priority', 'Prioritas')}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">{t('markets.table.potential', 'Estimasi Potensi (TAM)')}</th>
                <th className="px-4 py-3">{t('markets.table.segment', 'Segmen Produk')}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Linked Partners' : 'Mitra Terkait'}</th>
                <th className="px-4 py-3">{t('markets.table.status', 'Status')}</th>
                <th className="px-4 py-3">{t('markets.table.owner', 'Owner (PIC)')}</th>
                <th
                  onClick={() => toggleSort('updatedAt')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{language === 'en' ? 'Updated' : 'Diperbarui'}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMarkets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">
                      {language === 'en' ? 'No markets match the filter criteria' : 'Tidak ada pasar yang sesuai dengan kriteria filter'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {language === 'en' ? 'Try adjusting your search terms or resetting filters' : 'Coba sesuaikan kata kunci atau atur ulang filter Anda'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMarkets.map((market) => {
                  const priority = getPriorityBadge(market.priority, language);
                  const status = getStatusBadge(market.status, language);
                  const linkedPartners = partners.filter((p) => p.marketId === market.id);

                  return (
                    <tr
                      key={market.id}
                      onClick={() => setViewingMarketId(market.id)}
                      className="group cursor-pointer hover:bg-slate-50/80 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
                          <div>
                            <span className="block">{market.country}</span>
                            <span className="text-[11px] font-normal text-slate-500">
                              {market.region}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${priority.bg} ${priority.text} ${priority.border}`}>
                          {priority.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700">
                        {market.potential}
                      </td>

                      <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">
                        {market.segment}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          <span>{linkedPartners.length}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${status.bg} ${status.text} ${status.border}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {market.owner}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                        {formatDateId(market.updatedAt, language)}
                      </td>

                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingMarket(market);
                              setIsAddMarketOpen(true);
                            }}
                            title={language === 'en' ? 'Edit Market' : 'Edit Pasar'}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMsg = language === 'en'
                                ? `Delete market ${market.country}?`
                                : `Hapus pasar ${market.country}?`;
                              if (confirm(confirmMsg)) {
                                deleteMarket(market.id);
                              }
                            }}
                            title={language === 'en' ? 'Delete Market' : 'Hapus Pasar'}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
