import React, { useState, useMemo } from 'react';
import {
  FileText,
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
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateAgreementMetrics,
  formatCurrency,
  formatDateId,
  getAgreementExpiryStatus,
  getAgreementStatusBadge,
} from '../../utils/pipeline';
import { AgreementDetailView } from './AgreementDetailView';
import type { Agreement, AgreementWorkflowStatus } from '../../types';

export const AgreementsView: React.FC = () => {
  const {
    agreements,
    partners,
    markets,
    viewingAgreementId,
    setViewingAgreementId,
    setIsAddAgreementOpen,
    setEditingAgreement,
    deleteAgreement,
    updateAgreementStatus,
    getPartnerById,
    language,
    t,
  } = useApp();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<keyof Agreement>('endDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Calculate top summary metrics
  const metrics = calculateAgreementMetrics(agreements);

  // Owners list
  const uniqueOwners = useMemo(() => {
    const set = new Set<string>();
    agreements.forEach((a) => {
      if (a.owner) set.add(a.owner);
    });
    return Array.from(set);
  }, [agreements]);

  // Filtered & sorted agreements
  const filteredAgreements = useMemo(() => {
    return agreements.filter((agreement) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const partner = getPartnerById(agreement.partnerId);
        const matchCode = agreement.agreementCode.toLowerCase().includes(q);
        const matchName = agreement.name.toLowerCase().includes(q);
        const matchPartner = partner ? partner.companyName.toLowerCase().includes(q) : false;
        const matchCategory = agreement.productCategory.toLowerCase().includes(q);
        const matchTerritory = agreement.territory.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPartner && !matchCategory && !matchTerritory) {
          return false;
        }
      }

      // Workflow Status
      if (statusFilter !== 'ALL' && agreement.status !== statusFilter) {
        return false;
      }

      // Owner
      if (ownerFilter !== 'ALL' && agreement.owner !== ownerFilter) {
        return false;
      }

      // Market Region
      if (regionFilter !== 'ALL') {
        const matchesRegion = agreement.marketIds.some((mId) => {
          const m = markets.find((item) => item.id === mId);
          return m && m.region === regionFilter;
        });
        if (!matchesRegion) return false;
      }

      // Expiry filter
      if (expiryFilter !== 'ALL') {
        const expiry = getAgreementExpiryStatus(agreement.endDate, agreement.status);
        if (expiryFilter === 'EXPIRED' && expiry.status !== 'expired') return false;
        if (expiryFilter === '30' && expiry.status !== 'expiring_30') return false;
        if (expiryFilter === '60' && expiry.status !== 'expiring_60' && expiry.status !== 'expiring_30') return false;
        if (
          expiryFilter === '90' &&
          expiry.status !== 'expiring_90' &&
          expiry.status !== 'expiring_60' &&
          expiry.status !== 'expiring_30'
        ) {
          return false;
        }
        if (expiryFilter === 'SAFE' && expiry.status !== 'safe') return false;
      }

      return true;
    });
  }, [agreements, searchQuery, statusFilter, ownerFilter, regionFilter, expiryFilter, markets, getPartnerById]);

  // Sort
  const sortedAgreements = useMemo(() => {
    return [...filteredAgreements].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const res = valA.localeCompare(valB);
        return sortDirection === 'asc' ? res : -res;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [filteredAgreements, sortField, sortDirection]);

  // Paginated items
  const totalPages = Math.ceil(sortedAgreements.length / itemsPerPage) || 1;
  const paginatedAgreements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAgreements.slice(start, start + itemsPerPage);
  }, [sortedAgreements, currentPage, itemsPerPage]);

  const handleSort = (field: keyof Agreement) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setRegionFilter('ALL');
    setOwnerFilter('ALL');
    setExpiryFilter('ALL');
    setCurrentPage(1);
  };

  // If viewing single agreement detail
  if (viewingAgreementId) {
    return (
      <AgreementDetailView
        agreementId={viewingAgreementId}
        onBack={() => setViewingAgreementId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 border border-violet-200">
              {language === 'en' ? 'Commercial Module' : 'Modul Komersial'}
            </span>
            <span className="text-xs text-slate-500 font-medium">Distributor Agreement Tracker</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {language === 'en' ? 'International Distribution Agreements' : 'Perjanjian Distribusi Internasional'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {language === 'en'
              ? 'Manage contract legality, renewal periods, legal-finance reviews, and distributor sales targets.'
              : 'Kelola legalitas kontrak, masa berlaku perpanjangan, tinjauan legal-finance, dan target penjualan distributor.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAgreement(null);
            setIsAddAgreementOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'en' ? 'Create Agreement' : 'Buat Agreement'}</span>
        </button>
      </div>

      {/* 4 Summary Number Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Draft & Review */}
        <div
          onClick={() => {
            setStatusFilter('Draft');
            setCurrentPage(1);
          }}
          className={`group cursor-pointer rounded-lg border p-4 shadow-xs transition hover:shadow-md ${
            statusFilter === 'Draft' ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Draft & Under Review' : 'Draft & Dalam Review'}
            </span>
            <div className="rounded-md bg-sky-50 p-1.5 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.draftOrReview}
            </span>
            <span className="text-xs text-slate-500">{language === 'en' ? 'contracts' : 'kontrak'}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {language === 'en' ? 'Drafting, legal, & negotiation stages' : 'Tahap penyusunan, legal, & negosiasi'}
          </p>
        </div>

        {/* Card 2: Signed & Active */}
        <div
          onClick={() => {
            setStatusFilter('Signed / Active');
            setCurrentPage(1);
          }}
          className={`group cursor-pointer rounded-lg border p-4 shadow-xs transition hover:shadow-md ${
            statusFilter === 'Signed / Active'
              ? 'border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Signed / Active' : 'Signed / Aktif'}
            </span>
            <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.signedActive}
            </span>
            <span className="text-xs text-slate-500">{language === 'en' ? 'active' : 'resmi berjalan'}</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-700 font-medium border-t border-slate-100 pt-2">
            {language === 'en' ? 'Licensed official distribution partners' : 'Mitra distributor resmi berlisensi'}
          </p>
        </div>

        {/* Card 3: Expiring in 90 Days */}
        <div
          onClick={() => {
            setExpiryFilter(expiryFilter === '90' ? 'ALL' : '90');
            setCurrentPage(1);
          }}
          className={`group cursor-pointer rounded-lg border p-4 shadow-xs transition hover:shadow-md ${
            metrics.expiringIn90Days > 0
              ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Expiring ≤ 90 Days' : 'Berakhir ≤ 90 Hari'}
            </span>
            <div
              className={`rounded-md p-1.5 transition ${
                metrics.expiringIn90Days > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                metrics.expiringIn90Days > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {metrics.expiringIn90Days}
            </span>
            <span className="text-xs text-slate-500">{language === 'en' ? 'needs notice' : 'perlu notice'}</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-800 font-medium border-t border-slate-100 pt-2">
            {language === 'en' ? 'Evaluate renewal & target terms' : 'Perlu evaluasi perpanjangan & target'}
          </p>
        </div>

        {/* Card 4: Expired or Terminated */}
        <div
          onClick={() => {
            setStatusFilter('Expired');
            setCurrentPage(1);
          }}
          className={`group cursor-pointer rounded-lg border p-4 shadow-xs transition hover:shadow-md ${
            statusFilter === 'Expired'
              ? 'border-rose-700 ring-1 ring-rose-700 bg-rose-50/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expired / Terminated</span>
            <div className="rounded-md bg-rose-50 p-1.5 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.expiredOrTerminated}
            </span>
            <span className="text-xs text-slate-500">{language === 'en' ? 'ended / expired' : 'selesai / berakhir'}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            {language === 'en' ? 'Partnership history archive' : 'Arsip riwayat kerjasama'}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search code, agreement name, distributor, scope...' : 'Cari kode, nama perjanjian, distributor, cakupan...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter status workflow"
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-hidden"
            >
              <option value="ALL">{language === 'en' ? 'All Workflow Status' : 'Semua Status Workflow'}</option>
              <option value="Draft">Draft</option>
              <option value="Internal Review">Internal Review</option>
              <option value="Partner Review">Partner Review</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Signed / Active">Signed / Active</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>

            {/* Toggle advanced filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
                showFilters || regionFilter !== 'ALL' || ownerFilter !== 'ALL' || expiryFilter !== 'ALL'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Advanced Filters' : 'Filter Lanjutan'}</span>
            </button>

            {(searchQuery || statusFilter !== 'ALL' || regionFilter !== 'ALL' || ownerFilter !== 'ALL' || expiryFilter !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Region Filter */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                {language === 'en' ? 'Market Region / Territory' : 'Wilayah / Regional Pasar'}
              </label>
              <select
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">{language === 'en' ? 'All Regions' : 'Semua Wilayah'}</option>
                <option value="Asia Tenggara">{language === 'en' ? 'Southeast Asia' : 'Asia Tenggara'}</option>
                <option value="Timur Tengah & Afrika Utara">{language === 'en' ? 'Middle East & North Africa' : 'Timur Tengah & Afrika Utara'}</option>
                <option value="Eropa Barat">{language === 'en' ? 'Western Europe' : 'Eropa Barat'}</option>
                <option value="Asia Timur">{language === 'en' ? 'East Asia' : 'Asia Timur'}</option>
                <option value="Oseania">{language === 'en' ? 'Oceania' : 'Oseania'}</option>
                <option value="Amerika Latin">{language === 'en' ? 'Latin America' : 'Amerika Latin'}</option>
              </select>
            </div>

            {/* Owner Filter */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                {language === 'en' ? 'Internal Owner (PIC)' : 'Pemilik Internal (PIC)'}
              </label>
              <select
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">{language === 'en' ? 'All Owners' : 'Semua PIC'}</option>
                {uniqueOwners.map((own) => (
                  <option key={own} value={own}>
                    {own}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Urgency Filter */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                {language === 'en' ? 'Expiry Status' : 'Status Masa Berlaku'}
              </label>
              <select
                value={expiryFilter}
                onChange={(e) => {
                  setExpiryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">{language === 'en' ? 'All Periods' : 'Semua Periode'}</option>
                <option value="EXPIRED">{language === 'en' ? 'Expired' : 'Kedaluwarsa (Expired)'}</option>
                <option value="30">{language === 'en' ? 'Expiring ≤ 30 Days' : 'Berakhir ≤ 30 Hari'}</option>
                <option value="60">{language === 'en' ? 'Expiring ≤ 60 Days' : 'Berakhir ≤ 60 Hari'}</option>
                <option value="90">{language === 'en' ? 'Expiring ≤ 90 Days' : 'Berakhir ≤ 90 Hari'}</option>
                <option value="SAFE">{language === 'en' ? 'Safe (> 90 Days)' : 'Aman (> 90 Hari)'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('agreementCode')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Code & Contract Name' : 'Kode & Nama Kontrak'}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">{language === 'en' ? 'Partner & Territory' : 'Mitra & Teritori'}</th>
                <th
                  onClick={() => handleSort('annualSalesTarget')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Sales Target' : 'Target Penjualan'}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('endDate')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Validity' : 'Masa Berlaku'}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'en' ? 'Workflow Status' : 'Status Workflow'}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">PIC IBD</th>
                <th className="px-4 py-3 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAgreements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">
                      {language === 'en' ? 'No matching agreements found' : 'Tidak ada perjanjian yang cocok'}
                    </p>
                    <p className="mt-1 text-xs">
                      {language === 'en'
                        ? 'Try adjusting keywords or clearing search filters.'
                        : 'Coba sesuaikan kata kunci atau bersihkan filter pencarian.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAgreements.map((agreement) => {
                  const partner = getPartnerById(agreement.partnerId);
                  const expiry = getAgreementExpiryStatus(agreement.endDate, agreement.status, language);
                  const statusBadge = getAgreementStatusBadge(agreement.status, language);

                  return (
                    <tr
                      key={agreement.id}
                      onClick={() => setViewingAgreementId(agreement.id)}
                      className="group cursor-pointer hover:bg-slate-50 transition"
                    >
                      {/* Code & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {agreement.agreementCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {agreement.type}
                          </span>
                        </div>
                        <p className="mt-1 font-semibold text-slate-800 line-clamp-1 group-hover:text-slate-900">
                          {agreement.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                          {agreement.productCategory}
                        </p>
                      </td>

                      {/* Partner & Territory */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold truncate max-w-[200px]">
                          <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{partner ? partner.companyName : '-'}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[200px]">
                          {agreement.territory}
                        </p>
                        <div className="mt-1">
                          {agreement.isExclusive ? (
                            <span className="inline-block rounded bg-purple-50 text-purple-700 px-1.5 py-0.2 text-[10px] font-semibold border border-purple-200">
                              {language === 'en' ? 'Exclusive' : 'Eksklusif'}
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[10px]">
                              {language === 'en' ? 'Non-Exclusive' : 'Non-Eksklusif'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target Sales */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(agreement.annualSalesTarget, agreement.currency)}
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {agreement.paymentTerms}
                        </p>
                      </td>

                      {/* Validity & Expiry Badge */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-slate-800 font-medium text-xs">
                          {formatDateId(agreement.endDate, language)}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${expiry.badgeColor}`}
                          >
                            {expiry.label}
                          </span>
                        </div>
                      </td>

                      {/* Workflow Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 font-medium">{agreement.owner}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingAgreement(agreement);
                              setIsAddAgreementOpen(true);
                            }}
                            title={language === 'en' ? 'Edit Agreement' : 'Edit Perjanjian'}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const confirmMsg = language === 'en'
                                ? `Delete agreement ${agreement.agreementCode} (${agreement.name})?`
                                : `Hapus data perjanjian ${agreement.agreementCode} (${agreement.name})?`;
                              if (confirm(confirmMsg)) {
                                deleteAgreement(agreement.id);
                              }
                            }}
                            title={language === 'en' ? 'Delete' : 'Hapus'}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setViewingAgreementId(agreement.id)}
                            className="rounded p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title={language === 'en' ? 'View Details' : 'Buka Detail'}
                          >
                            <ChevronRight className="h-4 w-4" />
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <div>
            {language === 'en' ? 'Showing ' : 'Menampilkan '}
            <span className="font-semibold text-slate-700">
              {sortedAgreements.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            {language === 'en' ? 'to ' : 'sampai '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * itemsPerPage, sortedAgreements.length)}
            </span>{' '}
            {language === 'en' ? 'of ' : 'dari '}
            <span className="font-semibold text-slate-700">{sortedAgreements.length}</span>{' '}
            {language === 'en' ? 'agreements' : 'perjanjian'}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Previous' : 'Sebelumnya'}</span>
            </button>
            <span className="px-2 font-mono text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <span>{language === 'en' ? 'Next' : 'Selanjutnya'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
