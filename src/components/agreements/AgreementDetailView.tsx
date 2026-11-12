import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Building2,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Plus,
  Scale,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatCurrency,
  formatDateId,
  getAgreementExpiryStatus,
  getAgreementStatusBadge,
} from '../../utils/pipeline';
import {
  AGREEMENT_STATUSES,
  type AgreementWorkflowStatus,
} from '../../types';

interface AgreementDetailViewProps {
  agreementId: string;
  onBack: () => void;
}

export const AgreementDetailView: React.FC<AgreementDetailViewProps> = ({
  agreementId,
  onBack,
}) => {
  const {
    getAgreementById,
    getPartnerById,
    getMarketById,
    activities,
    setEditingAgreement,
    setIsAddAgreementOpen,
    updateAgreementStatus,
    updateAgreement,
    deleteAgreement,
    setIsAddActivityOpen,
    setPreselectedPartnerIdForActivity,
    toggleActivityStatus,
    setViewingPartnerId,
    setViewingMarketId,
    setViewingAgreementId,
    setActiveTab,
    language,
    t,
  } = useApp();

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<AgreementWorkflowStatus>('Draft');
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const agreement = getAgreementById(agreementId);

  if (!agreement) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xs">
        <p className="text-sm text-slate-500">
          {language === 'en' ? 'Agreement not found or has been deleted.' : 'Perjanjian tidak ditemukan atau telah dihapus.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {language === 'en' ? 'Back to agreements list' : 'Kembali ke daftar perjanjian'}
        </button>
      </div>
    );
  }

  const partner = getPartnerById(agreement.partnerId);
  const expiryInfo = getAgreementExpiryStatus(agreement.endDate, agreement.status, language);
  const statusBadge = getAgreementStatusBadge(agreement.status, language);

  // Filter activities related to this agreement or partner
  const relatedActivities = activities.filter(
    (a) =>
      a.relatedAgreementId === agreement.id ||
      (a.relatedPartnerId === agreement.partnerId && !a.relatedAgreementId)
  );

  const handleEdit = () => {
    setEditingAgreement(agreement);
    setIsAddAgreementOpen(true);
  };

  const handleDelete = () => {
    const confirmMsg = language === 'en'
      ? `Are you sure you want to delete agreement ${agreement.agreementCode} (${agreement.name})?`
      : `Apakah Anda yakin ingin menghapus data perjanjian ${agreement.agreementCode} (${agreement.name})?`;
    if (confirm(confirmMsg)) {
      deleteAgreement(agreement.id);
      onBack();
    }
  };

  const handleFollowUp = () => {
    setPreselectedPartnerIdForActivity(agreement.partnerId);
    setIsAddActivityOpen(true);
  };

  const handleOpenStatusModal = () => {
    setSelectedNextStatus(agreement.status);
    setStatusChangeNote('');
    setIsChangingStatus(true);
  };

  const handleSaveStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNextStatus !== agreement.status) {
      updateAgreementStatus(
        agreement.id,
        selectedNextStatus,
        statusChangeNote.trim() || undefined
      );
    }
    setIsChangingStatus(false);
  };

  const handleToggleChecklist = (key: keyof typeof agreement.reviewChecklist) => {
    const nextVal = !agreement.reviewChecklist[key];
    const updatedChecklist = {
      ...agreement.reviewChecklist,
      [key]: nextVal,
    };
    updateAgreement(
      agreement.id,
      { reviewChecklist: updatedChecklist },
      language === 'en' ? 'Review Checklist Update' : 'Pembaruan Checklist Review',
      language === 'en'
        ? `Checklist ${key} changed to: ${nextVal ? 'Approved' : 'Not Approved'}`
        : `Checklist ${key} diubah menjadi: ${nextVal ? 'Disetujui' : 'Belum Disetujui'}`
    );
  };

  const handleCopyDocRef = () => {
    if (agreement.documentRef) {
      navigator.clipboard.writeText(agreement.documentRef);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar & title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label={language === 'en' ? 'Back' : 'Kembali'}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {agreement.agreementCode}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">{agreement.type}</span>
              <span className="text-slate-300">•</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
              {/* Expiry urgency badge */}
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border ${expiryInfo.badgeColor}`}
              >
                {expiryInfo.label}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 truncate">
              {agreement.name}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleFollowUp}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Create Follow-up' : 'Buat Tindak Lanjut'}</span>
          </button>

          <button
            onClick={handleOpenStatusModal}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Change Status' : 'Ubah Status'}</span>
          </button>

          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Edit className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Edit Contract' : 'Edit Kontrak'}</span>
          </button>

          <button
            onClick={handleDelete}
            title={language === 'en' ? 'Delete Agreement' : 'Hapus Perjanjian'}
            className="rounded-md border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expiry Alert Warning Banner if near expiry or expired */}
      {expiryInfo.isWarning && (
        <div
          className={`flex items-start justify-between gap-3 rounded-lg border p-4 text-xs ${
            expiryInfo.status === 'expired'
              ? 'border-rose-300 bg-rose-50 text-rose-900'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">
                {expiryInfo.status === 'expired'
                  ? (language === 'en' ? 'Attention: This Agreement Has Expired!' : 'Perhatian: Masa Berlaku Perjanjian Ini Telah Kedaluwarsa!')
                  : (language === 'en' ? `Notice: This Agreement Expires in ${expiryInfo.daysLeft} Days!` : `Pemberitahuan: Perjanjian Ini Berakhir dalam ${expiryInfo.daysLeft} Hari!`)}
              </p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {language === 'en' ? 'End date:' : 'Tanggal akhir berlaku:'}{' '}
                <span className="font-semibold">{formatDateId(agreement.endDate, language)}</span>.{' '}
                {language === 'en' ? 'Agreed notice period is' : 'Notice period yang disepakati adalah'}{' '}
                <span className="font-semibold">{agreement.noticePeriodDays} {language === 'en' ? 'days' : 'hari'}</span>{' '}
                {language === 'en' ? 'prior to expiry.' : 'sebelum tanggal jatuh tempo.'}{' '}
                {agreement.renewalType === 'automatic'
                  ? (language === 'en' ? 'Renewal type: Automatic unless notice of non-renewal is provided.' : 'Jenis renewal: Otomatis jika tidak ada surat penolakan.')
                  : (language === 'en' ? 'Renewal type: Manual, requires a signed contract amendment.' : 'Jenis renewal: Manual, membutuhkan amandemen kontrak baru.')}
              </p>
            </div>
          </div>
          <button
            onClick={handleFollowUp}
            className="shrink-0 rounded-md bg-white px-2.5 py-1 font-semibold text-slate-800 shadow-2xs border border-slate-200 hover:bg-slate-50 transition"
          >
            {language === 'en' ? 'Schedule Re-negotiation' : 'Jadwalkan Re-negosiasi'}
          </button>
        </div>
      )}

      {/* Main Grid: Details left, Timeline right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form Sections */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: Ringkasan & Pihak Terkait */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>{language === 'en' ? 'Summary & Associated Parties' : 'Ringkasan & Pihak Terkait'}</span>
              <span className="font-normal lowercase text-[11px] text-slate-400">
                {language === 'en' ? `Revision ${agreement.version}` : `Revisi ${agreement.version}`}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Partner link */}
              <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Official Distributor Partner' : 'Mitra Distributor Resmi'}
                </span>
                {partner ? (
                  <button
                    onClick={() => {
                      setActiveTab('partners');
                      setViewingPartnerId(partner.id);
                      setViewingAgreementId(null);
                      setViewingMarketId(null);
                    }}
                    className="mt-1 flex items-center gap-1.5 font-bold text-indigo-700 hover:underline text-sm text-left group"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{partner.companyName}</span>
                    <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">ID Mitra: {agreement.partnerId}</span>
                )}
                {partner && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {language === 'en' ? 'Contact:' : 'Kontak:'} {partner.contactName} ({partner.contactEmail})
                  </p>
                )}
              </div>

              {/* Markets link */}
              <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Associated Market(s) / Country' : 'Pasar / Negara Terkait'}
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {agreement.marketIds && agreement.marketIds.length > 0 ? (
                    agreement.marketIds.map((mId) => {
                      const m = getMarketById(mId);
                      return (
                        <button
                          key={mId}
                          onClick={() => {
                            setActiveTab('markets');
                            setViewingMarketId(mId);
                            setViewingAgreementId(null);
                            setViewingPartnerId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200 hover:border-slate-400 hover:bg-slate-100 transition"
                        >
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span>{m ? m.country : mId}</span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400">{language === 'en' ? 'No specific market' : 'Tidak ada pasar spesifik'}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Agreement Type' : 'Tipe Perjanjian'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                  {agreement.type}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Internal Owner (PIC)' : 'Pemilik Internal (PIC)'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                  {agreement.owner}
                </span>
              </div>

              {agreement.documentRef && (
                <div className="sm:col-span-2 rounded-md bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      {language === 'en' ? 'Document Reference:' : 'Referensi Dokumen:'} {agreement.documentRef}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleCopyDocRef}
                      title={language === 'en' ? 'Copy Reference' : 'Salin Referensi'}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200 transition"
                    >
                      {copiedLink ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {agreement.documentRef.startsWith('http') && (
                      <a
                        href={agreement.documentRef}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-indigo-600 hover:bg-indigo-50 transition"
                        title={language === 'en' ? 'Open Document' : 'Buka Dokumen'}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Cakupan & Wilayah */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>{language === 'en' ? 'Product Scope & Distribution Territory' : 'Cakupan Produk & Wilayah Distribusi'}</span>
              <span
                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  agreement.isExclusive
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {agreement.isExclusive
                  ? (language === 'en' ? 'Exclusive Distribution' : 'Distribusi Eksklusif')
                  : (language === 'en' ? 'Non-Exclusive' : 'Non-Eksklusif')}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Product Category / Portfolio' : 'Kategori / Portofolio Produk'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-900">
                  {agreement.productCategory}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Territory / Operational Area' : 'Teritori / Wilayah Operasional'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-900">
                  {agreement.territory}
                </span>
              </div>

              {agreement.scopeNotes && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    {language === 'en' ? 'Special Scope & Channel Notes' : 'Catatan Khusus Cakupan & Saluran'}
                  </span>
                  <p className="mt-1 rounded bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100 leading-relaxed">
                    {agreement.scopeNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Ketentuan Komersial */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
              {language === 'en' ? 'Commercial & Financial Terms' : 'Ketentuan Komersial & Finansial'}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Annual Sales Target' : 'Target Penjualan Tahunan'}
                </span>
                <span className="mt-1 block text-base font-bold text-slate-900 font-mono">
                  {formatCurrency(agreement.annualSalesTarget, agreement.currency)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">
                  {language === 'en' ? 'Currency:' : 'Mata Uang:'} {agreement.currency}
                </span>
              </div>

              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Payment Terms' : 'Syarat Pembayaran'}
                </span>
                <span className="mt-1 block text-xs font-bold text-slate-800">
                  {agreement.paymentTerms}
                </span>
              </div>

              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Margin / Discount' : 'Margin / Diskon Grosir'}
                </span>
                <span className="mt-1 block text-xs font-bold text-slate-800">
                  {agreement.marginDiscount}
                </span>
              </div>

              <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Delivery Incoterms' : 'Incoterms Pengiriman'}
                </span>
                <span className="mt-1 block text-xs font-bold text-slate-800">
                  {agreement.incoterms || (language === 'en' ? 'Not specified' : 'Belum diatur')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Review Internal Legal & Finance */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-slate-500" />
                {language === 'en' ? 'Internal Review (Legal & Finance)' : 'Review Internal (Legal & Finance)'}
              </span>
              <span className="text-[11px] text-slate-400">
                {language === 'en' ? 'Click item to toggle approval' : 'Klik item untuk ubah persetujuan'}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Legal Reviewer */}
              <div className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'en' ? 'Legal Review' : 'Review Legal'}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      agreement.legalReviewStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : agreement.legalReviewStatus === 'Revision Required'
                        ? 'bg-rose-100 text-rose-800'
                        : agreement.legalReviewStatus === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {agreement.legalReviewStatus}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  Reviewer: <span className="font-medium text-slate-900">{agreement.legalReviewer || (language === 'en' ? 'Unassigned' : 'Belum ditugaskan')}</span>
                </p>
              </div>

              {/* Finance Reviewer */}
              <div className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'en' ? 'Finance Review' : 'Review Finance'}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      agreement.financeReviewStatus === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : agreement.financeReviewStatus === 'Revision Required'
                        ? 'bg-rose-100 text-rose-800'
                        : agreement.financeReviewStatus === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {agreement.financeReviewStatus}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  Reviewer: <span className="font-medium text-slate-900">{agreement.financeReviewer || (language === 'en' ? 'Unassigned' : 'Belum ditugaskan')}</span>
                </p>
              </div>
            </div>

            {/* Checklist Persetujuan Internal */}
            <div className="mt-4 rounded-md bg-slate-50 p-3 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                {language === 'en' ? 'Compliance & Approval Checklist' : 'Checklist Kepatuhan & Persetujuan'}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleChecklist('commercialTermsApproved')}
                  className={`flex items-center gap-2 p-2 rounded border text-left transition ${
                    agreement.reviewChecklist.commercialTermsApproved
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      agreement.reviewChecklist.commercialTermsApproved
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                    }`}
                  />
                  <span>{language === 'en' ? 'Commercial Terms Approved' : 'Ketentuan Komersial Disetujui'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleChecklist('complianceVerified')}
                  className={`flex items-center gap-2 p-2 rounded border text-left transition ${
                    agreement.reviewChecklist.complianceVerified
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      agreement.reviewChecklist.complianceVerified
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                    }`}
                  />
                  <span>{language === 'en' ? 'Regulatory Compliance Verified' : 'Kepatuhan Regulasi & Lisensi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleChecklist('creditLimitApproved')}
                  className={`flex items-center gap-2 p-2 rounded border text-left transition ${
                    agreement.reviewChecklist.creditLimitApproved
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      agreement.reviewChecklist.creditLimitApproved
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                    }`}
                  />
                  <span>{language === 'en' ? 'Credit Limit Approved' : 'Batas Plafon Kredit Disetujui'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleChecklist('disputeClauseAgreed')}
                  className={`flex items-center gap-2 p-2 rounded border text-left transition ${
                    agreement.reviewChecklist.disputeClauseAgreed
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      agreement.reviewChecklist.disputeClauseAgreed
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                    }`}
                  />
                  <span>{language === 'en' ? 'Dispute Resolution Clause Agreed' : 'Klausul Penyelesaian Sengketa'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Masa Berlaku, Renewal & Tanggal */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
              {language === 'en' ? 'Validity & Renewal Terms' : 'Masa Berlaku & Ketentuan Perpanjangan (Renewal)'}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Signing Date' : 'Tanggal Tanda Tangan'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                  {formatDateId(agreement.signingDate, language)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'Effective Date' : 'Tanggal Efektif'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                  {formatDateId(agreement.effectiveDate, language)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">
                  {language === 'en' ? 'End Date' : 'Tanggal Berakhir'}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-900 font-mono">
                  {formatDateId(agreement.endDate, language)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Notice Period</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                  {agreement.noticePeriodDays} {language === 'en' ? 'Days' : 'Hari'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{language === 'en' ? 'Renewal Mechanism:' : 'Mekanisme Perpanjangan:'}</span>
                <span className="font-semibold text-slate-800">
                  {agreement.renewalType === 'automatic'
                    ? (language === 'en' ? 'Automatic Renewal' : 'Perpanjangan Otomatis (Automatic Renewal)')
                    : (language === 'en' ? 'Manual Renewal (Written Amendment Required)' : 'Perpanjangan Manual (Harus Amandemen Tertulis)')}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${expiryInfo.badgeColor}`}>
                {expiryInfo.label}
              </span>
            </div>
          </div>

          {/* Section 6: Catatan Internal */}
          {agreement.internalNotes && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
                {language === 'en' ? 'IBD Operational & Strategic Notes' : 'Catatan Operasional & Strategis IBD'}
              </h2>
              <p className="mt-3 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {agreement.internalNotes}
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Timeline & Related Activities */}
        <div className="space-y-6">
          {/* Timeline Kronologis Perubahan & Review */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>{language === 'en' ? 'Chronological Timeline' : 'Timeline Kronologis'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                {agreement.timeline.length} {language === 'en' ? 'Entries' : 'Catatan'}
              </span>
            </h2>

            <div className="mt-4 relative pl-4 border-l-2 border-slate-200 space-y-4">
              {agreement.timeline.map((ev, idx) => (
                <div key={ev.id || idx} className="relative group text-xs">
                  {/* Dot */}
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-900 shadow-xs" />

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ev.timestamp}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {language === 'en' ? 'By:' : 'Oleh:'} <span className="font-semibold text-slate-700">{ev.author}</span>
                  </p>

                  {ev.newStatus && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {ev.previousStatus && (
                        <>
                          <span className="text-[10px] text-slate-400 line-through">
                            {ev.previousStatus}
                          </span>
                          <span className="text-[10px] text-slate-400">&rarr;</span>
                        </>
                      )}
                      <span className="inline-block rounded px-1.5 py-0.2 bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {ev.newStatus}
                      </span>
                    </div>
                  )}

                  {ev.note && (
                    <p className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      {ev.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related Follow-ups & Activities */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === 'en' ? 'Related Activities & Follow-ups' : 'Aktivitas & Tindak Lanjut Terkait'}
              </h2>
              <button
                onClick={handleFollowUp}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {language === 'en' ? 'Add' : 'Tambah'}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {relatedActivities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  {language === 'en' ? 'No follow-up activities registered for this agreement yet.' : 'Belum ada aktivitas tindak lanjut terdaftar untuk perjanjian ini.'}
                </div>
              ) : (
                relatedActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-2 rounded border border-slate-100 p-2 hover:bg-slate-50 text-xs"
                  >
                    <div className="min-w-0">
                      <span
                        className={`font-medium block truncate ${
                          act.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {act.title}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono text-indigo-600 font-medium">
                          {formatDateId(act.dueDate, language)}
                        </span>
                        <span>•</span>
                        <span>{act.type}</span>
                        <span>•</span>
                        <span>{act.owner}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActivityStatus(act.id)}
                      title={act.status === 'Completed' ? (language === 'en' ? 'Mark Incomplete' : 'Tandai Belum') : (language === 'en' ? 'Mark Completed' : 'Tandai Selesai')}
                      className="shrink-0 p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          act.status === 'Completed' ? 'text-emerald-600' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Change Status */}
      {isChangingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {language === 'en' ? 'Change Agreement Workflow Status' : 'Ubah Status Workflow Perjanjian'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {language === 'en'
                ? 'Status changes will be recorded on the chronological timeline of this agreement.'
                : 'Perubahan status akan dicatat pada timeline kronologis perjanjian ini.'}
            </p>

            <form onSubmit={handleSaveStatusChange} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'New Status' : 'Status Baru'}
                </label>
                <select
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value as AgreementWorkflowStatus)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                >
                  {AGREEMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Change Notes (Optional)' : 'Catatan Perubahan (Opsional)'}
                </label>
                <textarea
                  rows={3}
                  value={statusChangeNote}
                  onChange={(e) => setStatusChangeNote(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Signing witnessed by notary, or revised commercial clause approved...'
                      : 'Mis. Penandatanganan disaksikan notaris, atau revisi klausul komersial disetujui...'
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsChangingStatus(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {language === 'en' ? 'Save Status' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
