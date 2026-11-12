import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateAgreementCode } from '../../utils/pipeline';
import {
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  type Agreement,
  type AgreementType,
  type AgreementWorkflowStatus,
  type ReviewStatus,
  type Partner,
  type Market,
} from '../../types';

export const AgreementModal: React.FC = () => {
  const {
    isAddAgreementOpen,
    setIsAddAgreementOpen,
    editingAgreement,
    setEditingAgreement,
    preselectedPartnerIdForAgreement,
    setPreselectedPartnerIdForAgreement,
    agreements,
    partners,
    markets,
    addAgreement,
    updateAgreement,
    language,
  } = useApp();

  // Form states
  const [agreementCode, setAgreementCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AgreementType>('Distribution');
  const [partnerId, setPartnerId] = useState('');
  const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>([]);
  const [owner, setOwner] = useState('');

  // Cakupan (Scope)
  const [productCategory, setProductCategory] = useState('');
  const [territory, setTerritory] = useState('');
  const [scopeNotes, setScopeNotes] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);

  // Ketentuan Komersial
  const [currency, setCurrency] = useState('USD');
  const [annualSalesTarget, setAnnualSalesTarget] = useState<number | string>('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [marginDiscount, setMarginDiscount] = useState('');
  const [incoterms, setIncoterms] = useState('');

  // Review Internal
  const [legalReviewer, setLegalReviewer] = useState('');
  const [legalReviewStatus, setLegalReviewStatus] = useState<ReviewStatus>('Pending');
  const [financeReviewer, setFinanceReviewer] = useState('');
  const [financeReviewStatus, setFinanceReviewStatus] = useState<ReviewStatus>('Pending');
  const [reviewChecklist, setReviewChecklist] = useState({
    commercialTermsApproved: false,
    complianceVerified: false,
    creditLimitApproved: false,
    disputeClauseAgreed: false,
  });

  // Masa Berlaku & Versi
  const [signingDate, setSigningDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState<number | string>(60);
  const [renewalType, setRenewalType] = useState<'manual' | 'automatic'>('manual');
  const [version, setVersion] = useState('v1.0');
  const [documentRef, setDocumentRef] = useState('');

  // Status & Catatan
  const [status, setStatus] = useState<AgreementWorkflowStatus>('Draft');
  const [internalNotes, setInternalNotes] = useState('');

  // Validation
  const [error, setError] = useState('');

  // Reset or fill form when modal opens
  useEffect(() => {
    if (!isAddAgreementOpen) return;

    if (editingAgreement) {
      setAgreementCode(editingAgreement.agreementCode);
      setName(editingAgreement.name);
      setType(editingAgreement.type);
      setPartnerId(editingAgreement.partnerId);
      setSelectedMarketIds(editingAgreement.marketIds || []);
      setOwner(editingAgreement.owner);

      setProductCategory(editingAgreement.productCategory);
      setTerritory(editingAgreement.territory);
      setScopeNotes(editingAgreement.scopeNotes || '');
      setIsExclusive(editingAgreement.isExclusive);

      setCurrency(editingAgreement.currency);
      setAnnualSalesTarget(editingAgreement.annualSalesTarget);
      setPaymentTerms(editingAgreement.paymentTerms);
      setMarginDiscount(editingAgreement.marginDiscount);
      setIncoterms(editingAgreement.incoterms || '');

      setLegalReviewer(editingAgreement.legalReviewer || '');
      setLegalReviewStatus(editingAgreement.legalReviewStatus);
      setFinanceReviewer(editingAgreement.financeReviewer || '');
      setFinanceReviewStatus(editingAgreement.financeReviewStatus);
      setReviewChecklist({ ...editingAgreement.reviewChecklist });

      setSigningDate(editingAgreement.signingDate || '');
      setEffectiveDate(editingAgreement.effectiveDate);
      setEndDate(editingAgreement.endDate);
      setNoticePeriodDays(editingAgreement.noticePeriodDays);
      setRenewalType(editingAgreement.renewalType);
      setVersion(editingAgreement.version);
      setDocumentRef(editingAgreement.documentRef || '');

      setStatus(editingAgreement.status);
      setInternalNotes(editingAgreement.internalNotes || '');
    } else {
      // Auto-generate code
      const existingCodes = agreements.map((a: Agreement) => a.agreementCode);
      const newCode = generateAgreementCode(existingCodes, new Date().getFullYear());
      setAgreementCode(newCode);

      const targetPartnerId = preselectedPartnerIdForAgreement || '';
      setPartnerId(targetPartnerId);

      const pObj = partners.find((p: Partner) => p.id === targetPartnerId);
      const defaultMarketId = pObj?.marketId || '';
      setSelectedMarketIds(defaultMarketId ? [defaultMarketId] : []);
      setOwner(pObj ? pObj.owner : '');

      setName(pObj ? (language === 'en' ? `Distribution Agreement ${pObj.companyName}` : `Perjanjian Distribusi ${pObj.companyName}`) : '');
      setType('Distribution');
      setProductCategory(pObj?.segment || '');
      setTerritory(pObj?.country || '');
      setScopeNotes('');
      setIsExclusive(false);

      setCurrency('USD');
      setAnnualSalesTarget('');
      setPaymentTerms('');
      setMarginDiscount('');
      setIncoterms('');

      setLegalReviewer('');
      setLegalReviewStatus('Pending');
      setFinanceReviewer('');
      setFinanceReviewStatus('Pending');
      setReviewChecklist({
        commercialTermsApproved: false,
        complianceVerified: false,
        creditLimitApproved: false,
        disputeClauseAgreed: false,
      });

      const today = new Date();
      const toLocalDateInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const eff = toLocalDateInput(today);
      const end = new Date(today);
      end.setFullYear(end.getFullYear() + 1);
      const endStr = toLocalDateInput(end);

      setSigningDate('');
      setEffectiveDate(eff);
      setEndDate(endStr);
      setNoticePeriodDays(60);
      setRenewalType('manual');
      setVersion('v1.0');
      setDocumentRef('');

      setStatus('Draft');
      setInternalNotes('');
    }
    setError('');
  }, [
    isAddAgreementOpen,
    editingAgreement,
    preselectedPartnerIdForAgreement,
    partners,
    markets,
    agreements,
    language,
  ]);

  if (!isAddAgreementOpen) return null;

  const handlePartnerSelect = (pId: string) => {
    setPartnerId(pId);
    const p = partners.find((item: Partner) => item.id === pId);
    if (p) {
      if (!name || name.startsWith('Perjanjian Distribusi') || name.startsWith('Distribution Agreement')) {
        setName(language === 'en' ? `Distribution Agreement ${p.companyName}` : `Perjanjian Distribusi ${p.companyName}`);
      }
      if (p.marketId && !selectedMarketIds.includes(p.marketId)) {
        setSelectedMarketIds([p.marketId]);
      }
      setOwner(p.owner);
      setProductCategory(p.segment);
      setTerritory(p.country);
    }
  };

  const handleToggleMarket = (mId: string) => {
    setSelectedMarketIds((prev) =>
      prev.includes(mId) ? prev.filter((id) => id !== mId) : [...prev, mId]
    );
  };

  const handleRegenerateCode = () => {
    const existingCodes = agreements
      .filter((a: Agreement) => !editingAgreement || a.id !== editingAgreement.id)
      .map((a: Agreement) => a.agreementCode);
    setAgreementCode(generateAgreementCode(existingCodes, new Date().getFullYear()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'en' ? 'Agreement name is required' : 'Nama perjanjian wajib diisi');
      return;
    }
    if (!partnerId) {
      setError(language === 'en' ? 'Distributor partner must be selected' : 'Mitra distributor wajib dipilih');
      return;
    }
    if (selectedMarketIds.length === 0 && !territory.trim()) {
      setError(language === 'en' ? 'Select at least one market or enter operational territory' : 'Pilih minimal satu pasar atau isi teritori/wilayah operasional');
      return;
    }
    if (!effectiveDate) {
      setError(language === 'en' ? 'Effective date is required' : 'Tanggal efektif wajib ditentukan');
      return;
    }
    if (!endDate) {
      setError(language === 'en' ? 'End date is required' : 'Tanggal berakhir wajib ditentukan');
      return;
    }
    if (new Date(endDate) <= new Date(effectiveDate)) {
      setError(language === 'en' ? 'End date must be after effective date' : 'Tanggal berakhir harus setelah tanggal efektif');
      return;
    }

    const targetNum = Number(annualSalesTarget);
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      setError(language === 'en' ? 'Annual sales target must be greater than 0' : 'Target penjualan tahunan harus lebih besar dari 0');
      return;
    }
    if (status === 'Signed / Active') {
      if (!signingDate) {
        setError(language === 'en' ? 'Signing date is required for active agreements' : 'Tanggal tanda tangan wajib diisi untuk agreement aktif');
        return;
      }
      if (legalReviewStatus !== 'Approved' || financeReviewStatus !== 'Approved') {
        setError(language === 'en' ? 'Legal and Finance reviews must be approved before activating agreement' : 'Review Legal dan Finance harus disetujui sebelum agreement diaktifkan');
        return;
      }
      if (!Object.values(reviewChecklist).every(Boolean)) {
        setError(language === 'en' ? 'Complete all internal checklist items before activating agreement' : 'Selesaikan seluruh checklist internal sebelum agreement diaktifkan');
        return;
      }
    }
    const parsedNoticePeriod = noticePeriodDays === '' ? 30 : Number(noticePeriodDays);
    const noticeNum = Number.isFinite(parsedNoticePeriod) && parsedNoticePeriod >= 0 ? parsedNoticePeriod : 30;

    const agreementData = {
      agreementCode: agreementCode.trim(),
      name: name.trim(),
      type,
      partnerId,
      marketIds: selectedMarketIds,
      owner,
      productCategory: productCategory.trim(),
      territory: territory.trim(),
      scopeNotes: scopeNotes.trim(),
      isExclusive,
      currency,
      annualSalesTarget: targetNum,
      paymentTerms: paymentTerms.trim(),
      marginDiscount: marginDiscount.trim(),
      incoterms: incoterms.trim() || undefined,
      legalReviewer: legalReviewer.trim() || undefined,
      legalReviewStatus,
      financeReviewer: financeReviewer.trim() || undefined,
      financeReviewStatus,
      reviewChecklist,
      signingDate: signingDate || undefined,
      effectiveDate,
      endDate,
      noticePeriodDays: noticeNum,
      renewalType,
      version: version.trim() || 'v1.0',
      documentRef: documentRef.trim() || undefined,
      status,
      internalNotes: internalNotes.trim() || undefined,
    };

    if (editingAgreement) {
      updateAgreement(editingAgreement.id, agreementData);
    } else {
      addAgreement(agreementData);
    }

    setIsAddAgreementOpen(false);
    setEditingAgreement(null);
    setPreselectedPartnerIdForAgreement(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-lg border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-slate-900 p-2 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingAgreement
                  ? (language === 'en' ? 'Edit Distribution Agreement' : 'Edit Perjanjian Distribusi')
                  : (language === 'en' ? 'Create New Distribution Agreement' : 'Buat Perjanjian Distribusi Baru')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Operational distributor partnership contract form for IBD Hub'
                  : 'Formulir operasional kontrak kemitraan distributor IBD Hub'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddAgreementOpen(false);
              setEditingAgreement(null);
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-4 space-y-6">
          {/* Section 1: Ringkasan & Pihak */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '1. Summary & Party Identification' : '1. Ringkasan & Identitas Pihak'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Agreement Code (Auto)' : 'Kode Perjanjian (Auto)'}
                </label>
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={agreementCode}
                    onChange={(e) => setAgreementCode(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                  />
                  {!editingAgreement && (
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      title={language === 'en' ? 'Generate New Code' : 'Generate Kode Baru'}
                      className="rounded border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Official Agreement Name *' : 'Nama Resmi Perjanjian *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'E.g., Master Distribution Agreement FMCG South Vietnam' : 'Mis. Master Distribution Agreement FMCG Vietnam Selatan'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Agreement Type' : 'Tipe Perjanjian'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AgreementType)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                >
                  {AGREEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Distributor Partner *' : 'Mitra Distributor (Partners) *'}
                </label>
                <select
                  value={partnerId}
                  onChange={(e) => handlePartnerSelect(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                >
                  <option value="">{language === 'en' ? '-- Select Prospect / Distributor Partner --' : '-- Pilih Calon / Mitra Distributor --'}</option>
                  {partners.map((p: Partner) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Internal Owner (PIC IBD)' : 'Pemilik Internal (PIC IBD)'}
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Related International Markets (Markets)' : 'Pasar Internasional Terkait (Markets)'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {markets.map((m: Market) => {
                    const isSelected = selectedMarketIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleToggleMarket(m.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{m.country}</span>
                        <span className="text-[10px] text-slate-400">({m.region})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cakupan & Teritori */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '2. Portfolio Scope & Territory' : '2. Cakupan Portofolio & Teritori'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Category / Product' : 'Kategori / Produk'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., Health Supplements, Vitamins' : 'Mis. Health Supplements, Vitamins'}
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Operational Territory' : 'Teritori / Wilayah Operasional'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., South Vietnam or KSA National' : 'Mis. Seluruh Vietnam Selatan atau KSA National'}
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Exclusivity' : 'Eksklusivitas'}
                </label>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isExclusive"
                      checked={isExclusive}
                      onChange={() => setIsExclusive(true)}
                      className="text-slate-900"
                    />
                    <span className="font-semibold text-purple-700">{language === 'en' ? 'Exclusive' : 'Eksklusif'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isExclusive"
                      checked={!isExclusive}
                      onChange={() => setIsExclusive(false)}
                      className="text-slate-900"
                    />
                    <span className="text-slate-600">{language === 'en' ? 'Non-Exclusive' : 'Non-Eksklusif'}</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Scope Notes & Channel Restrictions' : 'Catatan Cakupan & Batasan Saluran'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., Valid for modern trade (WinMart) & pharmacy chain; excludes cross-border e-commerce.' : 'Mis. Berlaku untuk modern trade (WinMart) & pharmacy chain; tidak termasuk e-commerce cross-border.'}
                  value={scopeNotes}
                  onChange={(e) => setScopeNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ketentuan Komersial */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '3. Commercial Terms' : '3. Ketentuan Komersial'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Currency' : 'Mata Uang'}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="IDR">IDR (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? `Annual Sales Target (${currency}) *` : `Target Penjualan Tahunan (${currency}) *`}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={annualSalesTarget}
                  onChange={(e) => setAnnualSalesTarget(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Payment Terms' : 'Ketentuan Pembayaran (Payment Terms)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., Net 45 via LC at sight, 30% Advance T/T' : 'Mis. Net 45 via LC at sight, 30% Advance T/T'}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Wholesale Margin / Discount' : 'Margin / Diskon Grosir'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., 30% Wholesale Discount + 3% Rebate' : 'Mis. 30% Wholesale Discount + 3% Rebate'}
                  value={marginDiscount}
                  onChange={(e) => setMarginDiscount(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Shipping Incoterms (Optional)' : 'Incoterms Pengiriman (Opsional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., CIF Ho Chi Minh (Incoterms 2020), FOB Jakarta' : 'Mis. CIF Ho Chi Minh (Incoterms 2020), FOB Jakarta'}
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Review Internal Legal & Finance */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '4. Internal Review & Approval Checklist' : '4. Review Internal & Checklist Persetujuan'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-3 bg-slate-50/50">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {language === 'en' ? 'Legal Review' : 'Review Legal'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {language === 'en' ? 'Legal Reviewer' : 'Reviewer Legal'}
                    </span>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Legal Officer Name' : 'Nama Legal Officer'}
                      value={legalReviewer}
                      onChange={(e) => setLegalReviewer(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {language === 'en' ? 'Legal Review Status' : 'Status Review Legal'}
                    </span>
                    <select
                      value={legalReviewStatus}
                      onChange={(e) => setLegalReviewStatus(e.target.value as ReviewStatus)}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Revision Required">Revision Required</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-3 bg-slate-50/50">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {language === 'en' ? 'Finance Review' : 'Review Finance'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {language === 'en' ? 'Finance Reviewer' : 'Reviewer Finance'}
                    </span>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Finance Officer Name' : 'Nama Finance Officer'}
                      value={financeReviewer}
                      onChange={(e) => setFinanceReviewer(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {language === 'en' ? 'Finance Review Status' : 'Status Review Finance'}
                    </span>
                    <select
                      value={financeReviewStatus}
                      onChange={(e) => setFinanceReviewStatus(e.target.value as ReviewStatus)}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Revision Required">Revision Required</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 rounded-md bg-slate-50 p-3 border border-slate-200">
                <span className="text-xs font-semibold text-slate-800 block mb-2">
                  {language === 'en' ? 'Internal Verification Checklist' : 'Checklist Verifikasi Internal'}
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewChecklist.commercialTermsApproved}
                      onChange={(e) =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          commercialTermsApproved: e.target.checked,
                        }))
                      }
                      className="rounded text-slate-900"
                    />
                    <span>{language === 'en' ? 'Commercial terms & pricing approved' : 'Ketentuan komersial & harga disetujui'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewChecklist.complianceVerified}
                      onChange={(e) =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          complianceVerified: e.target.checked,
                        }))
                      }
                      className="rounded text-slate-900"
                    />
                    <span>{language === 'en' ? 'Import regulations & licensing compliance verified' : 'Kepatuhan regulasi impor & lisensi terverifikasi'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewChecklist.creditLimitApproved}
                      onChange={(e) =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          creditLimitApproved: e.target.checked,
                        }))
                      }
                      className="rounded text-slate-900"
                    />
                    <span>{language === 'en' ? 'Credit limit & payment guarantee approved' : 'Plafon kredit & garansi pembayaran disetujui'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewChecklist.disputeClauseAgreed}
                      onChange={(e) =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          disputeClauseAgreed: e.target.checked,
                        }))
                      }
                      className="rounded text-slate-900"
                    />
                    <span>{language === 'en' ? 'Arbitration & dispute resolution clause agreed' : 'Klausul arbitrase & penyelesaian sengketa disepakati'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Masa Berlaku & Dokumen */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '5. Validity Period & Document Reference' : '5. Masa Berlaku & Dokumen Referensi'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Signing Date (Optional)' : 'Tanggal Tanda Tangan (Opsional)'}
                </label>
                <input
                  type="date"
                  value={signingDate}
                  onChange={(e) => setSigningDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Effective Date *' : 'Tanggal Efektif *'}
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'End Date *' : 'Tanggal Berakhir *'}
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Notice Period (Days)' : 'Notice Period (Hari)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Renewal Type' : 'Jenis Perpanjangan (Renewal)'}
                </label>
                <select
                  value={renewalType}
                  onChange={(e) => setRenewalType(e.target.value as 'manual' | 'automatic')}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-hidden"
                >
                  <option value="automatic">{language === 'en' ? 'Automatic (Automatic Renewal)' : 'Otomatis (Automatic Renewal)'}</option>
                  <option value="manual">{language === 'en' ? 'Manual (Requires Written Addendum)' : 'Manual (Perlu Adendum Tertulis)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Version / Revision' : 'Versi / Revisi'}
                </label>
                <input
                  type="text"
                  placeholder="v1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Document Reference / File URL' : 'Referensi Dokumen / URL Berkas'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., https://drive.google.com/ibd/legal/AGR-2026-0001.pdf or Drive Ref #AGR-01' : 'Mis. https://drive.google.com/ibd/legal/AGR-2026-0001.pdf atau Drive Ref #AGR-01'}
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Status Workflow & Catatan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              {language === 'en' ? '6. Workflow Status & Internal Notes' : '6. Status Workflow & Catatan Internal'}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {language === 'en' ? 'Workflow Status *' : 'Status Workflow *'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AgreementWorkflowStatus)}
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
                  {language === 'en' ? 'Internal IBD Notes' : 'Catatan Internal IBD'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'en' ? 'Notes on strategic clauses, regional limits, or next steps...' : 'Catatan klausul strategis, batasan wilayah, atau tahapan lanjutan...'}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddAgreementOpen(false);
                setEditingAgreement(null);
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98"
            >
              {editingAgreement
                ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                : (language === 'en' ? 'Issue Agreement' : 'Terbitkan Agreement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
