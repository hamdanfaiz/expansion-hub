import React, { useState, useEffect } from 'react';
import { X, Globe, AlertCircle, Lock, Tag, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Market, PriorityLevel, MarketStatus } from '../../types';
import {
  getAllMasterCountries,
  getMasterCountry,
  getRegionForCountry,
} from '../../data/countryRegionDatabase';

export const MarketModal: React.FC = () => {
  const {
    isAddMarketOpen,
    setIsAddMarketOpen,
    editingMarket,
    setEditingMarket,
    addMarket,
    updateMarket,
    industrySegments,
    addIndustrySegment,
    language,
    t,
  } = useApp();

  const masterCountries = getAllMasterCountries();

  const [country, setCountry] = useState(masterCountries[0]?.name || 'Vietnam');
  const [region, setRegion] = useState('Asia Tenggara');
  const [segment, setSegment] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('P1');
  const [potential, setPotential] = useState('');
  const [owner, setOwner] = useState('Budi Santoso');
  const [status, setStatus] = useState<MarketStatus>('Active');
  const [researchNotes, setResearchNotes] = useState('');
  const [error, setError] = useState('');

  // Quick add new segment state
  const [isQuickAddingSegment, setIsQuickAddingSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentCode, setNewSegmentCode] = useState('');

  useEffect(() => {
    if (editingMarket) {
      setCountry(editingMarket.country);
      setRegion(getRegionForCountry(editingMarket.country, editingMarket.region));
      setSegment(editingMarket.segment);
      setPriority(editingMarket.priority);
      setPotential(editingMarket.potential);
      setOwner(editingMarket.owner);
      setStatus(editingMarket.status);
      setResearchNotes(editingMarket.researchNotes);
    } else {
      const defaultCountry = masterCountries[0]?.name || 'Vietnam';
      setCountry(defaultCountry);
      setRegion(getRegionForCountry(defaultCountry));
      setSegment(industrySegments[0]?.name || 'FMCG & Consumer Goods');
      setPriority('P1');
      setPotential('Tier 1 - Strategis ($10M+ TAM)');
      setOwner('Budi Santoso');
      setStatus('Exploring');
      setResearchNotes('');
    }
    setError('');
    setIsQuickAddingSegment(false);
  }, [editingMarket, isAddMarketOpen]);

  // When country changes, automatically update and lock region from Master Database
  const handleCountryChange = (selectedCountryName: string) => {
    setCountry(selectedCountryName);
    const matchedRegion = getRegionForCountry(selectedCountryName);
    setRegion(matchedRegion);
  };

  const handleQuickCreateSegment = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) {
      setError(language === 'en' ? 'New segment name is required' : 'Nama segmen baru wajib diisi');
      return;
    }
    const code = newSegmentCode.trim() || `SEG-${newSegmentName.slice(0, 4).toUpperCase()}`;
    addIndustrySegment({
      name: newSegmentName.trim(),
      code: code.toUpperCase(),
      description: language === 'en' ? `Industry category ${newSegmentName.trim()}` : `Kategori industri ${newSegmentName.trim()}`,
      targetAudience: language === 'en' ? 'Specialist distributors & modern retail' : 'Distributor spesialis & modern retail',
      isActive: true,
    });
    setSegment(newSegmentName.trim());
    setNewSegmentName('');
    setNewSegmentCode('');
    setIsQuickAddingSegment(false);
    setError('');
  };

  if (!isAddMarketOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim()) {
      setError(language === 'en' ? 'Target market country must be selected from the database' : 'Negara pasar wajib dipilih dari database negara');
      return;
    }
    if (!segment.trim()) {
      setError(language === 'en' ? 'Target industry segment must be selected' : 'Segmen industri/produk sasaran wajib dipilih');
      return;
    }

    const payload = {
      country: country.trim(),
      region,
      segment: segment.trim(),
      priority,
      potential: potential.trim() || (language === 'en' ? 'Tier 2 - Potential ($3M - $10M)' : 'Tier 2 - Potensial ($3M - $10M)'),
      owner,
      status,
      researchNotes: researchNotes.trim(),
    };

    if (editingMarket) {
      updateMarket(editingMarket.id, payload);
    } else {
      addMarket(payload);
    }

    setIsAddMarketOpen(false);
    setEditingMarket(null);
  };

  const selectedCountryObj = getMasterCountry(country);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingMarket
                  ? (language === 'en' ? 'Edit International Market' : 'Edit Data Pasar Internasional')
                  : (language === 'en' ? 'Add Target Market' : 'Tambah Pasar Sasaran Baru')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Data automatically linked to global geographic database & interactive map'
                  : 'Data terikat otomatis ke database geografis global & peta interaktif'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddMarketOpen(false);
              setEditingMarket(null);
            }}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identifikasi Geografis & Komoditas */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '1. Geographic & Industry Identification (Standardized Database)' : '1. Identifikasi Geografis & Komoditas (Database Terstandarisasi)'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Select Target Country' : 'Pilih Negara Sasaran'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden bg-white font-medium text-slate-900"
                  required
                >
                  {masterCountries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.code}) - {c.region}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {selectedCountryObj ? `${language === 'en' ? 'ISO Code' : 'Kode ISO'}: ${selectedCountryObj.code} • ${language === 'en' ? 'Currency' : 'Mata uang'}: ${selectedCountryObj.defaultCurrency}` : ''}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    {language === 'en' ? 'Region / Territory (Locked)' : 'Wilayah / Region (Terkunci)'}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                    <Lock className="h-2.5 w-2.5" /> {language === 'en' ? 'Map Synced' : 'Sinkron Peta'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={region}
                    readOnly
                    tabIndex={-1}
                    className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700 font-semibold cursor-not-allowed select-none"
                  />
                  <Lock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="mt-1 block text-[10px] text-slate-500">
                  {language === 'en'
                    ? 'Region relation is automatically locked to maintain visual map coordinate consistency.'
                    : 'Relasi wilayah terkunci otomatis mencegah inkonsistensi koordinat visual map.'}
                </span>
              </div>
            </div>

            {/* Segmen Industri / Produk Sasaran dengan CRUDE Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  {language === 'en' ? 'Target Industry / Product Segment' : 'Segmen Industri / Produk Sasaran'} <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddingSegment(!isQuickAddingSegment)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="h-3 w-3" />
                  <span>
                    {isQuickAddingSegment
                      ? (language === 'en' ? 'Close Segment Form' : 'Tutup Form Segmen Baru')
                      : (language === 'en' ? '+ Add New Segment' : '+ Tambah Segmen Baru')}
                  </span>
                </button>
              </div>

              {!isQuickAddingSegment ? (
                <div className="relative">
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden bg-white text-slate-900"
                    required
                  >
                    {industrySegments
                      .filter((s) => s.isActive || s.name === segment)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.code}) {!s.isActive ? (language === 'en' ? '[Inactive]' : '[Nonaktif]') : ''}
                        </option>
                      ))}
                  </select>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {language === 'en' ? 'Selected from company industry master segmentation.' : 'Dipilih dari master segmentasi industri perusahaan.'}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> {language === 'en' ? 'Quick Entry: New Industry Segment' : 'Entri Cepat Segmen Industri Baru'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Segment Name (e.g. Halal Personal Care)' : 'Nama Segmen (mis: Halal Personal Care)'}
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      className="col-span-2 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'Code (e.g. SEG-CARE)' : 'Kode (mis: SEG-CARE)'}
                      value={newSegmentCode}
                      onChange={(e) => setNewSegmentCode(e.target.value.toUpperCase())}
                      className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-800 uppercase focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddingSegment(false)}
                      className="rounded px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200"
                    >
                      {language === 'en' ? 'Cancel' : 'Batal'}
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickCreateSegment}
                      className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 shadow-2xs"
                    >
                      {language === 'en' ? 'Save & Select Segment' : 'Simpan & Pilih Segmen'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Potensi & Prioritas */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '2. Market Potential & Priority' : '2. Klasifikasi Potensi & Prioritas'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Priority Level' : 'Tingkat Prioritas'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
                >
                  <option value="P1">{language === 'en' ? 'P1 - Strategic (Primary Allocation)' : 'P1 - Strategis (Alokasi Utama)'}</option>
                  <option value="P2">{language === 'en' ? 'P2 - Potential (Medium Development)' : 'P2 - Potensial (Pengembangan Menengah)'}</option>
                  <option value="P3">{language === 'en' ? 'P3 - Secondary (Long-term Exploration)' : 'P3 - Sekunder (Eksplorasi Jangka Panjang)'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Market Potential Estimation (TAM)' : 'Estimasi Potensi Pasar (TAM)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Tier 1 - Strategic ($12M TAM)' : 'Contoh: Tier 1 - Strategis ($12M TAM)'}
                  value={potential}
                  onChange={(e) => setPotential(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kepemilikan & Status */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '3. Owner (PIC) & Status' : '3. Penanggung Jawab (PIC) & Status'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Market Status' : 'Status Pasar'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MarketStatus)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
                >
                  <option value="Active">{language === 'en' ? 'Active (In Progress)' : 'Aktif (Sedang Berjalan)'}</option>
                  <option value="Exploring">{language === 'en' ? 'Exploring (Initial Research)' : 'Eksplorasi (Tahap Riset Awal)'}</option>
                  <option value="On Hold">{language === 'en' ? 'On Hold (Pending Evaluation)' : 'Ditunda (Menunggu Evaluasi)'}</option>
                  <option value="Closed">{language === 'en' ? 'Closed (Discontinued)' : 'Ditutup (Tidak Dilanjutkan)'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Catatan Riset */}
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              {language === 'en' ? '4. Research Notes & Import Regulations' : '4. Catatan Riset & Regulasi Impor'}
            </h3>
            <div>
              <textarea
                rows={3}
                placeholder={
                  language === 'en'
                    ? 'Enter notes regarding local FDA/quarantine rules, key modern trade channels, import tariffs, or recommended logistics partners...'
                    : 'Tuliskan catatan terkait regulasi FDA/karantina lokal, saluran modern trade utama, tarif impor, atau mitra logistik rekomendasi...'
                }
                value={researchNotes}
                onChange={(e) => setResearchNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddMarketOpen(false);
                setEditingMarket(null);
              }}
              className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs active:scale-98"
            >
              {editingMarket
                ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                : (language === 'en' ? 'Add Market' : 'Tambah Pasar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
