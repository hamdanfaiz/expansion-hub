import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Award,
  FileText,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateAverageScore,
  formatDateId,
  getScorecardTier,
  getStageColor,
  isActivityOverdue,
} from '../../utils/pipeline';
import {
  PIPELINE_STAGES,
  type PipelineStage,
  type Agreement,
  type Activity,
  type Partner,
  type ProductAuthorityType,
} from '../../types';
import { WorldClockBadge } from '../common/WorldClockBadge';

interface PartnerDetailViewProps {
  partnerId: string;
  onBack: () => void;
}

export const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partnerId, onBack }) => {
  const {
    getPartnerById,
    getMarketById,
    getActivitiesByPartnerId,
    getAgreementsByPartnerId,
    getPartnersByMarketId,
    setEditingPartner,
    setIsAddPartnerOpen,
    deletePartner,
    updatePartnerStage,
    setIsAddActivityOpen,
    setPreselectedPartnerIdForActivity,
    toggleActivityStatus,
    setViewingMarketId,
    setViewingPartnerId,
    setViewingAgreementId,
    setIsAddAgreementOpen,
    setPreselectedPartnerIdForAgreement,
    setEditingAgreement,
    setActiveTab,
    language,
    t,
  } = useApp();

  const partner = getPartnerById(partnerId);

  if (!partner) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500 text-sm">
          {language === 'en' ? 'Partner record not found or has been deleted.' : 'Data mitra tidak ditemukan atau telah dihapus.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {language === 'en' ? 'Back to partners list' : 'Kembali ke daftar mitra'}
        </button>
      </div>
    );
  }

  const linkedMarket = getMarketById(partner.marketId);
  const activities = getActivitiesByPartnerId(partner.id);
  const agreements = getAgreementsByPartnerId(partner.id);
  const coDistributors = getPartnersByMarketId(partner.marketId).filter((p) => p.id !== partner.id);
  const stageStyle = getStageColor(partner.pipelineStage);

  const avgScore = calculateAverageScore(partner.scorecard);
  const scoreTier = getScorecardTier(avgScore, language);
  const isNextActivityOverdue = isActivityOverdue(partner.nextActivityDate, 'Pending');

  const handleEdit = () => {
    setEditingPartner(partner);
    setIsAddPartnerOpen(true);
  };

  const handleDelete = () => {
    const confirmMsg =
      language === 'en'
        ? `Are you sure you want to delete prospective partner ${partner.companyName}?`
        : `Apakah Anda yakin ingin menghapus data calon mitra ${partner.companyName}?`;
    if (confirm(confirmMsg)) {
      deletePartner(partner.id);
      onBack();
    }
  };

  const handleAddNewActivity = () => {
    setPreselectedPartnerIdForActivity(partner.id);
    setIsAddActivityOpen(true);
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {language === 'en' ? 'Partner Lead Details' : 'Detail Calon Mitra'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">{partner.country}</span>
              <span className="text-slate-400">•</span>
              <WorldClockBadge countryName={partner.country} variant="compact" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-0.5">
              {partner.companyName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewActivity}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('activities.btn.add', 'Catat Aktivitas')}</span>
          </button>
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Edit className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Edit Profile' : 'Edit Profil'}</span>
          </button>
          <button
            onClick={handleDelete}
            title={language === 'en' ? 'Delete Partner' : 'Hapus Mitra'}
            className="rounded-md border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Pipeline Stage Chevron / Progression Tracker */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pipeline Stage:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
            >
              {partner.pipelineStage}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {language === 'en' ? 'Move Stage:' : 'Pindahkan Tahap:'}
            </span>
            <select
              value={partner.pipelineStage}
              onChange={(e) => updatePartnerStage(partner.id, e.target.value as PipelineStage)}
              className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              {PIPELINE_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="mt-3 flex items-center overflow-x-auto pb-1 text-xs no-scrollbar gap-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCurrent = partner.pipelineStage === stage;
            const currentIdx = PIPELINE_STAGES.indexOf(partner.pipelineStage);
            const isPassed = currentIdx !== -1 && idx < currentIdx;

            return (
              <button
                key={stage}
                onClick={() => updatePartnerStage(partner.id, stage)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 font-medium transition shrink-0 ${
                  isCurrent
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : isPassed
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{stage}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: 4 Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Scorecard Rating */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Scorecard Evaluation' : 'Evaluasi Scorecard'}
            </span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {avgScore}%
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${scoreTier.color}`}>
              {scoreTier.label}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {language === 'en' ? 'Average of 4 distributor feasibility dimensions' : 'Rata-rata 4 dimensi kelayakan distributor'}
          </p>
        </div>

        {/* Card 2: Next Planned Activity */}
        <div
          className={`rounded-lg border p-4 shadow-xs ${
            isNextActivityOverdue
              ? 'border-rose-200 bg-rose-50/40'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Next Planned Activity' : 'Jadwal Aktivitas Berikutnya'}
            </span>
            {isNextActivityOverdue ? (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            ) : (
              <Calendar className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <p
            className={`mt-2 text-sm font-bold font-mono ${
              isNextActivityOverdue ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {formatDateId(partner.nextActivityDate, language)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            {isNextActivityOverdue
              ? (language === 'en' ? 'Schedule past target date!' : 'Jadwal lewat target tanggal!')
              : (language === 'en' ? 'On track with planned timeline' : 'Sesuai rencana timeline')}
          </p>
        </div>

        {/* Card 3: Owner PIC */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Lead PIC IBD' : 'Lead PIC IBD'}
            </span>
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{partner.owner}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            {language === 'en' ? 'Responsible for communication & negotiation' : 'Penanggung jawab komunikasi & negosiasi'}
          </p>
        </div>

        {/* Card 4: Linked Market */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {language === 'en' ? 'Linked Market' : 'Pasar Terhubung'}
            </span>
            <Globe className="h-4 w-4 text-slate-400" />
          </div>
          {linkedMarket ? (
            <div className="mt-2">
              <button
                onClick={() => {
                  setActiveTab('markets');
                  setViewingMarketId(linkedMarket.id);
                }}
                className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>{linkedMarket.country}</span>
                <span className="text-xs font-normal text-slate-500">({linkedMarket.priority})</span>
              </button>
              <p className="mt-2 text-[11px] text-slate-500">{linkedMarket.potential}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-slate-400">
              {language === 'en' ? 'Not linked to a market yet' : 'Belum terhubung ke pasar'}
            </p>
          )}
        </div>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (1 Col): World Clock & Hours, Contact, Scorecard Breakdown & Notes */}
        <div className="space-y-6 lg:col-span-1">
          {/* World Clock & Business Hours Card */}
          <WorldClockBadge
            countryName={partner.country}
            variant="detailed"
            showSeconds
          />

          {/* Contact Information */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
              {t('partners.detail.contact', 'Informasi Kontak Utama')}
            </h3>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {language === 'en' ? 'Contact Person Name' : 'Nama Kontak Person'}
                </span>
                <span className="font-semibold text-slate-900">{partner.contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${partner.contactEmail}`}
                  className="text-indigo-600 hover:underline truncate"
                >
                  {partner.contactEmail}
                </a>
              </div>
              {partner.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-700 font-mono">{partner.contactPhone}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">
                  {language === 'en' ? 'Focus Segment' : 'Segmen Fokus'}
                </span>
                <span className="font-medium text-slate-800">{partner.segment}</span>
              </div>
            </div>
          </div>

          {/* Portofolio Lini Produk & Otoritas Hak Keagenan (Multi-Distributor) */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-indigo-600" />
                <span>{t('partners.detail.productAuthority', 'Otoritas Produk & Hak Keagenan')}</span>
              </h3>
              <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                {partner.authorizedProducts?.length || 0} {language === 'en' ? 'Product Lines' : 'Lini Produk'}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {!partner.authorizedProducts || partner.authorizedProducts.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  <p>{language === 'en' ? 'No product lines assigned yet.' : 'Belum ada alokasi lini produk terdaftar.'}</p>
                  <button
                    onClick={handleEdit}
                    className="mt-2 text-indigo-600 hover:underline font-semibold"
                  >
                    {language === 'en' ? '+ Assign Product Authority' : '+ Tentukan Otoritas Produk'}
                  </button>
                </div>
              ) : (
                partner.authorizedProducts.map((auth) => {
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
                      className="p-2.5 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{auth.productCategory}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {auth.authorityType}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {language === 'en' ? 'Scope: ' : 'Cakupan: '}
                          {auth.territoryScope || (language === 'en' ? 'National' : 'Nasional')}
                        </span>
                      </div>
                      {auth.notes && (
                        <p className="mt-1 text-[10px] text-slate-400 italic">{auth.notes}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick note on multi-distributor framework */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              {language === 'en'
                ? 'Multi-distributor setup allows distinct product segmentation across distributors in the same market.'
                : 'Pengaturan multi-distributor memungkinkan segmentasi produk terpisah antar distributor di pasar yang sama.'}
            </div>
          </div>

          {/* Mitra Distributor Lain di Pasar Ini (Multidistributor Context) */}
          {coDistributors.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>
                    {language === 'en' ? 'Co-Distributors in ' : 'Ko-Distributor di '}
                    {partner.country} ({coDistributors.length})
                  </span>
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                  {language === 'en' ? 'Active Multidist' : 'Multidist Aktif'}
                </span>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {coDistributors.map((co) => {
                  const coStage = getStageColor(co.pipelineStage);
                  const firstAuth = co.authorizedProducts?.[0];
                  return (
                    <div
                      key={co.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <button
                          onClick={() => {
                            setViewingPartnerId(co.id);
                          }}
                          className="font-semibold text-slate-900 hover:text-indigo-600 text-left truncate block"
                        >
                          {co.companyName}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                          <span className={`px-1 rounded ${coStage.bg} ${coStage.text}`}>
                            {co.pipelineStage}
                          </span>
                          {firstAuth && (
                            <span className="truncate">
                              • {firstAuth.productCategory} ({firstAuth.authorityType})
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setViewingPartnerId(co.id);
                        }}
                        className="shrink-0 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {language === 'en' ? 'View Profile \u2192' : 'Lihat Profil \u2192'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Perjanjian Distribusi Terkait */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-violet-600" />
                <span>{t('agreements.title', 'Perjanjian Distribusi')} ({agreements.length})</span>
              </h3>
              <button
                onClick={() => {
                  setPreselectedPartnerIdForAgreement(partner.id);
                  setEditingAgreement(null);
                  setIsAddAgreementOpen(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {language === 'en' ? 'Create' : 'Buat'}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {agreements.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {language === 'en'
                    ? 'No official contracts registered for this distributor.'
                    : 'Belum ada kontrak resmi terdaftar untuk distributor ini.'}
                </div>
              ) : (
                agreements.map((agr: Agreement) => (
                  <button
                    key={agr.id}
                    onClick={() => {
                      setActiveTab('agreements');
                      setViewingAgreementId(agr.id);
                      setViewingPartnerId(null);
                      setViewingMarketId(null);
                    }}
                    className="w-full text-left p-2.5 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {agr.agreementCode}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-700">
                        {agr.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-800 truncate">{agr.name}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{language === 'en' ? 'Expires: ' : 'Berakhir: '}{formatDateId(agr.endDate, language)}</span>
                      <span className="text-indigo-600 font-semibold">{language === 'en' ? 'Open \u2192' : 'Buka \u2192'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detailed Scorecard Breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>{language === 'en' ? 'Scorecard Evaluation Dimensions' : 'Dimensi Evaluasi Scorecard'}</span>
              <span className="font-mono text-indigo-600">{avgScore}/100</span>
            </h3>

            <div className="mt-3.5 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">
                    {language === 'en' ? 'Financial & Credit Stability' : 'Stabilitas Finansial & Kredit'}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {partner.scorecard.financialStability}/5
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(partner.scorecard.financialStability / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">
                    {language === 'en' ? 'Distribution Network & Reach' : 'Jangkauan & Jaringan Distribusi'}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {partner.scorecard.distributionReach}/5
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(partner.scorecard.distributionReach / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">
                    {language === 'en' ? 'Regulatory Compliance & Licensing' : 'Kepatuhan Regulasi & Lisensi'}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {partner.scorecard.regulatoryCompliance}/5
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(partner.scorecard.regulatoryCompliance / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700">
                    {language === 'en' ? 'Market Reputation & Experience' : 'Reputasi Pasar & Pengalaman'}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">
                    {partner.scorecard.marketReputation}/5
                  </span>
                </div>
                <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(partner.scorecard.marketReputation / 5) * 100}%` }}
                  />
                </div>
              </div>

              {partner.scorecard.notes && (
                <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold block text-slate-800">
                    {language === 'en' ? 'Assessor Notes:' : 'Catatan Asesor:'}
                  </span>
                  {partner.scorecard.notes}
                </div>
              )}
            </div>
          </div>

          {/* Partner Research Notes */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
              {language === 'en' ? 'Negotiation Notes & History' : 'Catatan Negosiasi & Riwayat'}
            </h3>
            <div className="mt-3 text-xs leading-relaxed text-slate-700 bg-slate-50/70 p-3 rounded border border-slate-200">
              {partner.notes ? (
                <p className="whitespace-pre-wrap">{partner.notes}</p>
              ) : (
                <p className="italic text-slate-400">
                  {language === 'en' ? 'No additional notes recorded.' : 'Belum ada catatan tambahan.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (2 Cols): Chronological Activity Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span>{t('partners.detail.timeline', 'Timeline Aktivitas & Interaksi')} ({activities.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Chronological history of meetings, follow-ups, due diligence, and contract reviews'
                    : 'Riwayat kronologis pertemuan, follow-up, uji tuntas, dan review kontrak'}
                </p>
              </div>

              <button
                onClick={handleAddNewActivity}
                className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                <Plus className="h-3 w-3" /> {t('activities.btn.add', 'Catat Aktivitas')}
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'No activities recorded for this partner lead yet' : 'Belum ada aktivitas tercatat untuk calon mitra ini'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'en' ? 'Log your first meeting, call, or contract review.' : 'Catat pertemuan, panggilan, atau peninjauan kontrak pertama.'}
                </p>
                <button
                  onClick={handleAddNewActivity}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" /> {language === 'en' ? 'Log Activity Now' : 'Catat Sekarang'}
                </button>
              </div>
            ) : (
              <div className="relative mt-5 pl-6 border-l-2 border-slate-200 space-y-6">
                {activities.map((act: Activity) => {
                  const isOverdue = isActivityOverdue(act.dueDate, act.status);
                  const isCompleted = act.status === 'Completed';

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isCompleted
                            ? 'border-emerald-500 text-emerald-500'
                            : isOverdue
                            ? 'border-rose-500 text-rose-500 animate-pulse'
                            : 'border-indigo-500 text-indigo-500'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      </div>

                      {/* Card Content */}
                      <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs group-hover:border-slate-300 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {act.type}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {act.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-mono font-medium ${
                                isOverdue && !isCompleted
                                  ? 'text-rose-600 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {language === 'en' ? 'Due date: ' : 'Jatuh tempo: '}
                              {formatDateId(act.dueDate, language)}
                            </span>
                            <button
                              onClick={() => toggleActivityStatus(act.id)}
                              className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                              }`}
                            >
                              {isCompleted
                                ? (language === 'en' ? '\u2713 Completed' : '\u2713 Selesai')
                                : (language === 'en' ? 'Mark Completed' : 'Tandai Selesai')}
                            </button>
                          </div>
                        </div>

                        {act.notes && (
                          <p className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded">
                            {act.notes}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>PIC: {act.owner}</span>
                          <span>{language === 'en' ? 'Recorded: ' : 'Dicatat: '}{formatDateId(act.createdAt, language)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
