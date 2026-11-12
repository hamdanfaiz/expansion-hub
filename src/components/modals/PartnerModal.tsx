import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  AlertCircle,
  Award,
  Package,
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PIPELINE_STAGES,
  DISTRIBUTABLE_PRODUCT_CATEGORIES,
  PRODUCT_AUTHORITY_TYPES,
  type Partner,
  type PipelineStage,
  type Market,
  type PartnerProductAuthorization,
  type ProductAuthorityType,
} from '../../types';
import {
  getAllMasterCountries,
  getMasterCountry,
  getRegionForCountry,
} from '../../data/countryRegionDatabase';

export const PartnerModal: React.FC = () => {
  const {
    isAddPartnerOpen,
    setIsAddPartnerOpen,
    editingPartner,
    setEditingPartner,
    preselectedMarketIdForPartner,
    setPreselectedMarketIdForPartner,
    markets,
    addPartner,
    updatePartner,
    industrySegments,
    language,
    t,
  } = useApp();

  const masterCountries = getAllMasterCountries();

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [marketId, setMarketId] = useState('');
  const [segment, setSegment] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [owner, setOwner] = useState('Budi Santoso');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('Target found');

  // Multi-distributor authorized products list
  const [authorizedProducts, setAuthorizedProducts] = useState<PartnerProductAuthorization[]>([]);

  // Temporary row state for adding a product authorization
  const [selectedCategory, setSelectedCategory] = useState<string>(DISTRIBUTABLE_PRODUCT_CATEGORIES[0]);
  const [selectedAuthority, setSelectedAuthority] = useState<ProductAuthorityType>('Exclusive');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedNotes, setSelectedNotes] = useState('');

  // Scorecard values (1-5)
  const [financialStability, setFinancialStability] = useState(4);
  const [distributionReach, setDistributionReach] = useState(4);
  const [regulatoryCompliance, setRegulatoryCompliance] = useState(4);
  const [marketReputation, setMarketReputation] = useState(4);
  const [scorecardNotes, setScorecardNotes] = useState('');

  const [notes, setNotes] = useState('');
  const [nextActivityDate, setNextActivityDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPartner) {
      setCompanyName(editingPartner.companyName);
      setCountry(editingPartner.country);
      setMarketId(editingPartner.marketId);
      setSegment(editingPartner.segment);
      setContactName(editingPartner.contactName);
      setContactEmail(editingPartner.contactEmail);
      setContactPhone(editingPartner.contactPhone || '');
      setOwner(editingPartner.owner);
      setPipelineStage(editingPartner.pipelineStage);
      setAuthorizedProducts(editingPartner.authorizedProducts || []);
      setFinancialStability(editingPartner.scorecard?.financialStability || 4);
      setDistributionReach(editingPartner.scorecard?.distributionReach || 4);
      setRegulatoryCompliance(editingPartner.scorecard?.regulatoryCompliance || 4);
      setMarketReputation(editingPartner.scorecard?.marketReputation || 4);
      setScorecardNotes(editingPartner.scorecard?.notes || '');
      setNotes(editingPartner.notes || '');
      setNextActivityDate(editingPartner.nextActivityDate || '');
    } else {
      setCompanyName('');
      const defaultMarket = preselectedMarketIdForPartner
        ? markets.find((m: Market) => m.id === preselectedMarketIdForPartner)
        : markets[0];

      if (defaultMarket) {
        setMarketId(defaultMarket.id);
        setCountry(defaultMarket.country);
        setSegment(defaultMarket.segment);
      } else {
        setMarketId('');
        setCountry(masterCountries[0]?.name || 'Vietnam');
        setSegment(industrySegments[0]?.name || 'FMCG & Consumer Goods');
      }

      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setOwner('Budi Santoso');
      setPipelineStage('Target found');
      setAuthorizedProducts([
        {
          id: `auth-${Date.now()}-1`,
          productCategory: DISTRIBUTABLE_PRODUCT_CATEGORIES[0],
          authorityType: 'Exclusive',
          territoryScope: 'Seluruh Wilayah Negara / Nasional',
          notes: 'Fokus kanal retail & modern trade',
        },
      ]);
      setFinancialStability(4);
      setDistributionReach(4);
      setRegulatoryCompliance(4);
      setMarketReputation(4);
      setScorecardNotes('');
      setNotes('');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setNextActivityDate(d.toISOString().split('T')[0]);
    }
    setError('');
  }, [editingPartner, isAddPartnerOpen, preselectedMarketIdForPartner, markets, industrySegments]);

  const handleMarketChange = (newMarketId: string) => {
    setMarketId(newMarketId);
    const m = markets.find((item: Market) => item.id === newMarketId);
    if (m) {
      setCountry(m.country);
      if (!segment) setSegment(m.segment);
    }
  };

  const handleAddProductAuth = () => {
    if (!selectedCategory) return;
    // Check if category already added
    const alreadyExists = authorizedProducts.some((p) => p.productCategory === selectedCategory);
    if (alreadyExists) {
      setError(
        language === 'en'
          ? `Category "${selectedCategory}" is already added for this partner.`
          : `Kategori "${selectedCategory}" sudah ada dalam daftar otoritas mitra ini.`
      );
      return;
    }

    const newAuth: PartnerProductAuthorization = {
      id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productCategory: selectedCategory,
      authorityType: selectedAuthority,
      territoryScope: selectedScope.trim() || (language === 'en' ? 'Nationwide / All Regions' : 'Seluruh Wilayah Negara / Nasional'),
      notes: selectedNotes.trim(),
    };

    setAuthorizedProducts([...authorizedProducts, newAuth]);
    setSelectedScope('');
    setSelectedNotes('');
    setError('');
  };

  const handleRemoveProductAuth = (authId: string) => {
    setAuthorizedProducts(authorizedProducts.filter((p) => p.id !== authId));
  };

  if (!isAddPartnerOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError(language === 'en' ? 'Prospective distributor company name is required' : 'Nama perusahaan calon distributor wajib diisi');
      return;
    }
    if (!country.trim()) {
      setError(language === 'en' ? 'Country of origin must be selected' : 'Negara asal wajib dipilih');
      return;
    }
    if (!contactName.trim()) {
      setError(language === 'en' ? 'Contact person name is required' : 'Nama kontak penanggung jawab wajib diisi');
      return;
    }

    const partnerData = {
      companyName: companyName.trim(),
      country: country.trim(),
      marketId: marketId || (markets[0]?.id ?? ''),
      segment: segment.trim() || 'FMCG & Consumer Goods',
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      owner,
      pipelineStage,
      authorizedProducts,
      scorecard: {
        financialStability: Number(financialStability),
        distributionReach: Number(distributionReach),
        regulatoryCompliance: Number(regulatoryCompliance),
        marketReputation: Number(marketReputation),
        notes: scorecardNotes.trim(),
      },
      notes: notes.trim(),
      nextActivityDate: nextActivityDate || new Date().toISOString().split('T')[0],
    };

    if (editingPartner) {
      updatePartner(editingPartner.id, partnerData);
    } else {
      addPartner(partnerData);
    }

    setIsAddPartnerOpen(false);
    setEditingPartner(null);
    setPreselectedMarketIdForPartner(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingPartner
                  ? (language === 'en' ? 'Edit Prospective Distributor Partner' : 'Edit Profil Calon Mitra Distributor')
                  : (language === 'en' ? 'Add New Prospective Distributor' : 'Tambah Calon Mitra Distributor Baru')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Integrated partnership pipeline form and scorecard evaluation'
                  : 'Formulir terpadu pipeline kemitraan dan evaluasi scorecard'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddPartnerOpen(false);
              setEditingPartner(null);
              setPreselectedMarketIdForPartner(null);
            }}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Informasi Perusahaan & Pasar */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '1. Company Profile & Market Linkage' : '1. Profil Perusahaan & Hubungan Pasar'}
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Distributor Company Name' : 'Nama Perusahaan Distributor'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={language === 'en' ? 'e.g. Saigon Apex Logistics Ltd, Bavaria Bio-Handel GmbH' : 'Contoh: Saigon Apex Logistics Ltd, Bavaria Bio-Handel GmbH'}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Link to Registered Target Market' : 'Hubungkan ke Pasar Sasaran Terdata'}
                </label>
                <select
                  value={marketId}
                  onChange={(e) => handleMarketChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden bg-white font-medium text-slate-900"
                >
                  {markets.map((m: Market) => (
                    <option key={m.id} value={m.id}>
                      {m.country} ({m.region}) - {m.priority}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {language === 'en' ? 'Selecting a market automatically associates country & region.' : 'Memilih pasar otomatis mengunci negara & wilayah mitra.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Country of Domicile' : 'Negara Domisili'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden bg-white text-slate-900"
                  required
                >
                  {masterCountries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.code}) - {c.region}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {language === 'en' ? 'Standardized country database for map synchronization.' : 'Database negara terstandarisasi untuk sinkronisasi peta ekspansi.'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Primary Industry Segment Focus' : 'Fokus Segmen Industri Utama'}
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden bg-white text-slate-900"
              >
                {industrySegments
                  .filter((s) => s.isActive || s.name === segment)
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Section 2: Otoritas Produk & Hak Distribusi (Multi-Distributor) */}
          <div className="space-y-3 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{language === 'en' ? '2. Product Authority & Distribution Rights (Multi-Distributor)' : '2. Otoritas Produk & Hak Keagenan (Multi-Distributor)'}</span>
                </h3>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 font-mono">
                  {authorizedProducts.length} {language === 'en' ? 'Product Lines' : 'Lini Diageni'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                {language === 'en'
                  ? 'In the same territory or market, multiple distributors can be appointed (multidist) with specific product categories, territorial coverage, or exclusivity allocations.'
                  : 'Di beberapa wilayah atau pasar sasaran yang sama, perusahaan dapat menunjuk lebih dari satu distributor (multidist) dengan alokasi kategori produk, cakupan teritori, atau hak eksklusivitas yang berbeda.'}
              </p>
            </div>

            {/* List of currently authorized products */}
            <div className="space-y-2">
              {authorizedProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-slate-400">
                  <Package className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-600">
                    {language === 'en' ? 'No product lines allocated yet' : 'Belum ada lini produk yang dialokasikan'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'en'
                      ? 'Select a product category and authority type below to allocate distribution rights for this partner.'
                      : 'Pilih kategori produk dan jenis otoritas di bawah untuk menambahkan hak distribusi mitra ini.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40">
                  {authorizedProducts.map((auth) => {
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
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 bg-white hover:bg-slate-50/80 transition gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {auth.productCategory}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {auth.authorityType}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600">
                              {language === 'en' ? 'Territory/Channel:' : 'Teritori/Kanal:'} {auth.territoryScope || (language === 'en' ? 'Nationwide' : 'Nasional')}
                            </span>
                            {auth.notes && (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-400">{auth.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProductAuth(auth.id)}
                          className="self-end sm:self-center rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={language === 'en' ? 'Remove this product authority' : 'Hapus Otoritas Produk Ini'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form to add an authorized product */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Plus className="h-3.5 w-3.5 text-indigo-600" />
                <span>{language === 'en' ? 'Add Product Line Distribution Rights:' : 'Tambah Hak Distribusi Lini Produk:'}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    {language === 'en' ? 'Product Category' : 'Kategori Produk'}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  >
                    {DISTRIBUTABLE_PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    {language === 'en' ? 'Authority Type' : 'Tipe Otoritas'}
                  </label>
                  <select
                    value={selectedAuthority}
                    onChange={(e) => setSelectedAuthority(e.target.value as ProductAuthorityType)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  >
                    {PRODUCT_AUTHORITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}{' '}
                        {t === 'Exclusive'
                          ? (language === 'en' ? '(Sole Agency)' : '(Hak Tunggal)')
                          : t === 'Non-Exclusive'
                          ? (language === 'en' ? '(Shared)' : '(Bersama)')
                          : t === 'Co-Exclusive'
                          ? (language === 'en' ? '(Territory Split)' : '(Bagi Teritori)')
                          : (language === 'en' ? '(Trial Period)' : '(Uji Coba)')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    {language === 'en' ? 'Territory Scope / Channel (Optional)' : 'Cakupan Teritori / Saluran (Opsional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g. Southern Region, Modern Trade Only, etc.' : 'Contoh: Wilayah Selatan (HCMC), Modern Trade, dll.'}
                    value={selectedScope}
                    onChange={(e) => setSelectedScope(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    {language === 'en' ? 'Authority Notes (Optional)' : 'Catatan Otoritas (Opsional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g. Year 1 MOQ target, local import license' : 'Contoh: Target MoQ tahun 1, lisensi BPOM lokal'}
                    value={selectedNotes}
                    onChange={(e) => setSelectedNotes(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddProductAuth}
                  className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>{language === 'en' ? 'Add to Partner Portfolio' : 'Tambahkan ke Portofolio Mitra'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Kontak Utama */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '3. Primary Partner Contact' : '3. Kontak Utama Calon Mitra'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Partner PIC Name' : 'Nama PIC Mitra'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Full Name' : 'Nama Lengkap'}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Official Email' : 'Email Resmi'}
                </label>
                <input
                  type="email"
                  placeholder="email@distributor.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Phone / WhatsApp' : 'Nomor Telepon / WA'}
                </label>
                <input
                  type="text"
                  placeholder="+84 28 3822 9100"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Kepemilikan */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '4. Pipeline Stage & Internal IBD PIC' : '4. Pipeline Stage & PIC Internal IBD'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Pipeline Stage' : 'Tahapan Pipeline'}
                </label>
                <select
                  value={pipelineStage}
                  onChange={(e) => setPipelineStage(e.target.value as PipelineStage)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
                >
                  {PIPELINE_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Owner (IBD Team PIC)' : 'Owner (PIC Tim IBD)'}
                </label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
                >
                  <option value="Budi Santoso">Budi Santoso</option>
                  <option value="Rina Wijaya">Rina Wijaya</option>
                  <option value="Tariq Al-Mansoor">Tariq Al-Mansoor</option>
                  <option value="Sarah Jenkins">Sarah Jenkins</option>
                  <option value="Kenji Sato">Kenji Sato</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Scorecard Evaluasi Kelayakan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span>{language === 'en' ? '5. Partner Eligibility Scorecard (Scale 1 - 5)' : '5. Scorecard Penilaian Kelayakan Mitra (Skala 1 - 5)'}</span>
              </h3>
              <span className="font-mono text-indigo-600 font-bold">
                {language === 'en' ? 'Average: ' : 'Rata-rata: '}
                {Math.round(
                  (((Number(financialStability) +
                    Number(distributionReach) +
                    Number(regulatoryCompliance) +
                    Number(marketReputation)) /
                    4 /
                    5) *
                    100)
                )}
                %
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>{language === 'en' ? 'Financial Stability & Capital' : 'Stabilitas Finansial & Modal'}</span>
                  <span className="font-mono text-indigo-600">{financialStability}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={financialStability}
                  onChange={(e) => setFinancialStability(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>{language === 'en' ? 'Distribution Network & Reach' : 'Jangkauan Jaringan Distribusi'}</span>
                  <span className="font-mono text-indigo-600">{distributionReach}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={distributionReach}
                  onChange={(e) => setDistributionReach(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>{language === 'en' ? 'Regulatory Compliance & Licenses' : 'Kepatuhan Regulasi & Lisensi'}</span>
                  <span className="font-mono text-indigo-600">{regulatoryCompliance}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={regulatoryCompliance}
                  onChange={(e) => setRegulatoryCompliance(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>{language === 'en' ? 'Market Reputation & Experience' : 'Reputasi Pasar & Pengalaman'}</span>
                  <span className="font-mono text-indigo-600">{marketReputation}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={marketReputation}
                  onChange={(e) => setMarketReputation(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Scorecard Assessor Notes' : 'Catatan Asesor Scorecard'}
              </label>
              <input
                type="text"
                placeholder={
                  language === 'en'
                    ? 'e.g. Operates 1,200 modern retail POS and 3 temperature-controlled warehouses.'
                    : 'Contoh: Memiliki 1.200 titik distribusi modern trade dan 3 hub logistik berpendingin.'
                }
                value={scorecardNotes}
                onChange={(e) => setScorecardNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 6: Rencana Aktivitas & Catatan */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '6. Next Activity Schedule & Negotiation Notes' : '6. Rencana Jadwal & Catatan Negosiasi'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Next Activity Target Date' : 'Target Tanggal Aktivitas Berikutnya'}
                </label>
                <input
                  type="date"
                  value={nextActivityDate}
                  onChange={(e) => setNextActivityDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Negotiation Notes & History' : 'Catatan Negosiasi & Riwayat'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  language === 'en'
                    ? 'Summary of negotiation status, annual sales commitments, or distributor discount requests...'
                    : 'Rangkuman status negosiasi, komitmen target penjualan tahunan, atau permintaan diskon distributor...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddPartnerOpen(false);
                setEditingPartner(null);
                setPreselectedMarketIdForPartner(null);
              }}
              className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs active:scale-98"
            >
              {editingPartner
                ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                : (language === 'en' ? 'Add Partner' : 'Tambah Partner')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
