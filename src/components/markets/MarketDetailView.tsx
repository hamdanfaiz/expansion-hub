import React from 'react';
import {
  ArrowLeft,
  Edit3,
  Globe,
  Building2,
  CalendarCheck,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  User,
  FileText,
  Package,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateId,
  getPriorityBadge,
  getStageColor,
  getStatusBadge,
} from '../../utils/pipeline';
import type { ProductAuthorityType } from '../../types';

interface MarketDetailViewProps {
  marketId: string;
  onBack: () => void;
}

export const MarketDetailView: React.FC<MarketDetailViewProps> = ({ marketId, onBack }) => {
  const {
    getMarketById,
    getPartnersByMarketId,
    getAgreementsByMarketId,
    setEditingMarket,
    setIsAddMarketOpen,
    deleteMarket,
    setIsAddPartnerOpen,
    setPreselectedMarketIdForPartner,
    setViewingPartnerId,
    setViewingMarketId,
    setViewingAgreementId,
    setActiveTab,
    language,
    t,
  } = useApp();

  const market = getMarketById(marketId);

  if (!market) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500 text-sm">
          {language === 'en' ? 'Market data not found or has been deleted.' : 'Data pasar tidak ditemukan atau telah dihapus.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {language === 'en' ? 'Back to markets list' : 'Kembali ke daftar pasar'}
        </button>
      </div>
    );
  }

  const linkedPartners = getPartnersByMarketId(market.id);
  const marketAgreements = getAgreementsByMarketId(market.id);
  const priorityBadge = getPriorityBadge(market.priority, language);
  const statusBadge = getStatusBadge(market.status, language);

  const handleEdit = () => {
    setEditingMarket(market);
    setIsAddMarketOpen(true);
  };

  const handleDelete = () => {
    const confirmMsg =
      language === 'en'
        ? `Are you sure you want to delete market data for ${market.country}?`
        : `Apakah Anda yakin ingin menghapus data pasar ${market.country}?`;
    if (confirm(confirmMsg)) {
      deleteMarket(market.id);
      onBack();
    }
  };

  const handleAddPartnerToThisMarket = () => {
    setPreselectedMarketIdForPartner(market.id);
    setIsAddPartnerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar & back */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label={language === 'en' ? 'Back' : 'Kembali'}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {language === 'en' ? 'Target Market Details' : 'Detail Pasar Target'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                {statusBadge.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>{market.country}</span>
              <span className="text-sm font-normal text-slate-500 font-mono">({market.region})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Edit Market' : 'Edit Pasar'}</span>
          </button>
          <button
            onClick={handleAddPartnerToThisMarket}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>
              {language === 'en' ? `Add Partner in ${market.country}` : `Tambah Partner di ${market.country}`}
            </span>
          </button>
          <button
            onClick={handleDelete}
            title={language === 'en' ? 'Delete Market' : 'Hapus Pasar'}
            className="rounded-md border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {language === 'en' ? 'Priority Level' : 'Tingkat Prioritas'}
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}>
              {priorityBadge.label}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {language === 'en' ? 'Expansion resource allocation tier' : 'Klasifikasi alokasi sumber daya ekspansi'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {language === 'en' ? 'Estimated Market Potential (TAM)' : 'Estimasi Potensi Pasar (TAM)'}
          </span>
          <p className="mt-1 text-sm font-bold text-slate-900">{market.potential}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            {language === 'en' ? 'Target segment Total Addressable Market' : 'Total Addressable Market segmen sasaran'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {language === 'en' ? 'PIC / Market Lead' : 'PIC / Penanggung Jawab'}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-900">{market.owner}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Lead Business Development Region</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">
            {language === 'en' ? 'Commodity Segment' : 'Segmen Komoditas'}
          </span>
          <p className="mt-1 text-sm font-bold text-slate-900 truncate">{market.segment}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{language === 'en' ? 'Updated ' : 'Diperbarui '}{formatDateId(market.updatedAt, language)}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Notes & Linked Partners */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Research Notes & Compliance */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>{language === 'en' ? 'Market Research & Regulatory Notes' : 'Catatan Riset & Regulasi Pasar'}</span>
            </h3>
            <div className="mt-3 text-xs leading-relaxed text-slate-700 bg-slate-50/70 p-3.5 rounded-md border border-slate-200">
              {market.researchNotes ? (
                <p className="whitespace-pre-wrap">{market.researchNotes}</p>
              ) : (
                <p className="italic text-slate-400">
                  {language === 'en' ? 'No specific research notes recorded for this market.' : 'Belum ada catatan riset spesifik untuk pasar ini.'}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Market ID:' : 'ID Pasar:'}</span>
                <span className="font-mono text-slate-700">{market.id}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Created:' : 'Didaftarkan:'}</span>
                <span>{formatDateId(market.createdAt, language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'en' ? 'Updated:' : 'Pembaruan:'}</span>
                <span>{formatDateId(market.updatedAt, language)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Linked Partners in this market */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>
                    {language === 'en'
                      ? `Associated Prospective & Active Partners (${linkedPartners.length})`
                      : `Calon & Mitra Distributor Terkait (${linkedPartners.length})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? `List of local distributor companies prospected in ${market.country}`
                    : `Daftar perusahaan distributor lokal yang dijajaki di ${market.country}`}
                </p>
              </div>

              <button
                onClick={handleAddPartnerToThisMarket}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="h-3.5 w-3.5" /> {language === 'en' ? 'Add Partner' : 'Tambah Mitra'}
              </button>
            </div>

            {linkedPartners.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'No distributor partners for this market yet' : 'Belum ada mitra distributor untuk pasar ini'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Start mapping by adding profiles of prospective local distributors.'
                    : 'Mulai pemetaan dengan menambahkan profil calon distributor lokal.'}
                </p>
                <button
                  onClick={handleAddPartnerToThisMarket}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" /> {language === 'en' ? 'Add First Partner' : 'Tambah Mitra Pertama'}
                </button>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {linkedPartners.map((partner) => {
                  const stageStyle = getStageColor(partner.pipelineStage);
                  return (
                    <div
                      key={partner.id}
                      className="group flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 hover:bg-slate-50/80 rounded px-2 transition gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              setActiveTab('partners');
                              setViewingPartnerId(partner.id);
                            }}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 cursor-pointer"
                          >
                            {partner.companyName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                          >
                            {partner.pipelineStage}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>{language === 'en' ? 'Contact:' : 'Kontak:'} {partner.contactName} ({partner.contactEmail})</span>
                          <span>•</span>
                          <span>Owner: {partner.owner}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-[11px]">
                          <span className="text-slate-400 block text-[10px]">Next Activity:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {formatDateId(partner.nextActivityDate, language)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('partners');
                            setViewingPartnerId(partner.id);
                          }}
                          className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
                        >
                          {language === 'en' ? 'View Details' : 'Buka Detail'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matriks Multi-Distributor & Alokasi Otoritas Produk */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <span>
                    {language === 'en'
                      ? 'Multi-Distributor Matrix & Product Authority Allocation'
                      : 'Matriks Multi-Distributor & Alokasi Otoritas Produk'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? `Mapping of exclusive vs non-exclusive product agency rights across distributors in ${market.country}`
                    : `Pemetaan hak keagenan produk eksklusif vs non-eksklusif antar distributor di ${market.country}`}
                </p>
              </div>

              {linkedPartners.length > 1 ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  {language === 'en' ? `Active Multi-Distributor (${linkedPartners.length} Partners)` : `Multidistributor Aktif (${linkedPartners.length} Mitra)`}
                </span>
              ) : linkedPartners.length === 1 ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {language === 'en' ? 'Single Distributor' : 'Distributor Tunggal'}
                </span>
              ) : null}
            </div>

            {linkedPartners.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'en'
                  ? 'No distributor partners allocated in this market yet.'
                  : 'Belum ada mitra distributor yang dialokasikan di pasar ini.'}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {linkedPartners.map((p) => {
                  const pStage = getStageColor(p.pipelineStage);
                  const auths = p.authorizedProducts || [];

                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-slate-50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-2 mb-2.5 gap-1.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-600" />
                          <button
                            onClick={() => {
                              setActiveTab('partners');
                              setViewingPartnerId(p.id);
                            }}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 text-left"
                          >
                            {p.companyName}
                          </button>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${pStage.bg} ${pStage.text} ${pStage.border}`}
                          >
                            {p.pipelineStage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>PIC: {p.owner}</span>
                          <span>•</span>
                          <button
                            onClick={() => {
                              setActiveTab('partners');
                              setViewingPartnerId(p.id);
                            }}
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            {language === 'en' ? 'View Profile →' : 'Buka Profil →'}
                          </button>
                        </div>
                      </div>

                      {auths.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          {language === 'en'
                            ? 'No specific product authority division assigned for this partner yet.'
                            : 'Belum ada pembagian otoritas produk spesifik untuk mitra ini.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {auths.map((auth) => {
                            const badgeStyles: Record<ProductAuthorityType, { bg: string; text: string; border: string }> = {
                              Exclusive: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                              'Non-Exclusive': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
                              'Co-Exclusive': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                              'Pilot / Trial': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                            };
                            const style = badgeStyles[auth.authorityType] || badgeStyles['Exclusive'];

                            return (
                              <div
                                key={auth.id}
                                className="rounded bg-white p-2 border border-slate-200 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900 truncate pr-1">
                                    {auth.productCategory}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                                  >
                                    {auth.authorityType}
                                  </span>
                                </div>
                                <div className="mt-1 text-[10px] text-slate-500">
                                  <span>{language === 'en' ? 'Scope:' : 'Cakupan:'} {auth.territoryScope || (language === 'en' ? 'Nationwide' : 'Nasional')}</span>
                                  {auth.notes && (
                                    <span className="block text-slate-400 italic truncate mt-0.5">
                                      {auth.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Perjanjian Distribusi Resmi di Pasar Ini */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-600" />
                  <span>
                    {language === 'en'
                      ? `Distribution Agreements for ${market.country} (${marketAgreements.length})`
                      : `Perjanjian Distribusi Terkait Pasar ${market.country} (${marketAgreements.length})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Official contracts, territory scope, and annual targets in this country'
                    : 'Kontrak resmi, wilayah teritori, dan target tahunan di negara ini'}
                </p>
              </div>
            </div>

            {marketAgreements.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {language === 'en'
                  ? 'No official distributor contracts registered for this market yet.'
                  : 'Belum ada kontrak distributor resmi terdaftar untuk pasar ini.'}
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {marketAgreements.map((agr) => (
                  <div
                    key={agr.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 hover:bg-slate-50 rounded px-2 transition text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{agr.agreementCode}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                          {agr.type}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-50 text-violet-700 font-semibold border border-violet-100">
                          {agr.status}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-slate-800 truncate">{agr.name}</p>
                      <p className="text-[11px] text-slate-500">{agr.productCategory} • PIC: {agr.owner}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-[11px]">
                        <span className="text-slate-400 block text-[10px]">{language === 'en' ? 'Validity:' : 'Masa Berlaku:'}</span>
                        <span className="font-mono font-medium text-slate-700">
                          {formatDateId(agr.endDate, language)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('agreements');
                          setViewingAgreementId(agr.id);
                          setViewingMarketId(null);
                          setViewingPartnerId(null);
                        }}
                        className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white hover:border-slate-300 shadow-2xs"
                      >
                        {language === 'en' ? 'Open Contract' : 'Buka Kontrak'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
