import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  RotateCcw,
  ChevronRight,
  Globe,
  Building2,
  CalendarPlus,
  FileText,
  X,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorldClockPopover } from './WorldClockPopover';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { DatabaseStatus } from './DatabaseStatus';

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const {
    authUser,
    logout,
    activeTab,
    setActiveTab,
    viewingMarketId,
    setViewingMarketId,
    viewingPartnerId,
    setViewingPartnerId,
    viewingAgreementId,
    setViewingAgreementId,
    getMarketById,
    getPartnerById,
    getAgreementById,
    setIsAddMarketOpen,
    setIsAddPartnerOpen,
    setIsAddActivityOpen,
    setIsAddAgreementOpen,
    setIsResetModalOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    markets,
    partners,
    agreements,
    language,
    t,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick search results
  const searchResults = React.useMemo(() => {
    if (!globalSearchQuery.trim()) return { markets: [], partners: [], agreements: [] };
    const q = globalSearchQuery.toLowerCase();
    const matchedMarkets = markets.filter(
      (m) => m.country.toLowerCase().includes(q) || m.region.toLowerCase().includes(q)
    );
    const matchedPartners = partners.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q)
    );
    const matchedAgreements = agreements.filter(
      (a) =>
        a.agreementCode.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.territory.toLowerCase().includes(q) ||
        a.productCategory.toLowerCase().includes(q)
    );
    return {
      markets: matchedMarkets.slice(0, 3),
      partners: matchedPartners.slice(0, 3),
      agreements: matchedAgreements.slice(0, 3),
    };
  }, [globalSearchQuery, markets, partners, agreements]);

  // Determine breadcrumbs
  const currentMarket = viewingMarketId ? getMarketById(viewingMarketId) : null;
  const currentPartner = viewingPartnerId ? getPartnerById(viewingPartnerId) : null;
  const currentAgreement = viewingAgreementId ? getAgreementById(viewingAgreementId) : null;

  const tabLabels: Record<string, string> = {
    overview: t('nav.overview.sub', 'Workspace Overview'),
    markets: t('nav.markets.sub', 'Pasar Internasional'),
    partners: t('nav.partners.sub', 'Pipeline Mitra Distribusi'),
    activities: t('nav.activities.sub', 'Log Aktivitas & Jadwal'),
    agreements: t('nav.agreements.sub', 'Perjanjian Distribusi'),
    training: t('nav.training.sub', 'Pelatihan & Sertifikasi'),
    reports: t('nav.reports.sub', 'Laporan & Analitik'),
    settings: t('nav.settings.sub', 'Pengaturan Sistem'),
  };

  return (
    <div className="sticky top-0 z-30 shrink-0">
    <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-slate-500 min-w-0">
          <button
            onClick={() => {
              setActiveTab('overview');
              setViewingMarketId(null);
              setViewingPartnerId(null);
              setViewingAgreementId(null);
            }}
            className="hover:text-slate-900 truncate"
          >
            {language === 'en' ? 'IBD Hub' : 'Hub IBD'}
          </button>

          <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-slate-400 shrink-0" />

          <button
            onClick={() => {
              setViewingMarketId(null);
              setViewingPartnerId(null);
              setViewingAgreementId(null);
            }}
            className={`hover:text-slate-900 truncate ${
              !viewingMarketId && !viewingPartnerId && !viewingAgreementId
                ? 'font-semibold text-slate-900'
                : ''
            }`}
          >
            {tabLabels[activeTab] || 'Overview'}
          </button>

          {activeTab === 'markets' && currentMarket && (
            <>
              <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                {currentMarket.country}
              </span>
            </>
          )}

          {activeTab === 'partners' && currentPartner && (
            <>
              <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[220px]">
                {currentPartner.companyName}
              </span>
            </>
          )}

          {activeTab === 'agreements' && currentAgreement && (
            <>
              <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[220px]">
                {currentAgreement.agreementCode}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex relative flex-1 max-w-md mx-4" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('header.search.placeholder', 'Cari pasar, distributor, negara, kontak...')}
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={language === 'en' ? 'Clear search' : 'Bersihkan pencarian'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchFocused && globalSearchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-slate-200 bg-white py-2 shadow-lg z-50 text-xs">
            {searchResults.markets.length === 0 && searchResults.partners.length === 0 && searchResults.agreements.length === 0 ? (
              <div className="px-3 py-2 text-slate-400 text-center">
                {t('header.search.noResults', 'Tidak ada data yang cocok dengan')} &quot;{globalSearchQuery}&quot;
              </div>
            ) : (
              <>
                {searchResults.markets.length > 0 && (
                  <div className="px-2 pb-1.5">
                    <span className="px-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {t('header.search.section.markets', 'Pasar')}
                    </span>
                    {searchResults.markets.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setActiveTab('markets');
                          setViewingMarketId(m.id);
                          setViewingPartnerId(null);
                          setIsSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-800">{m.country}</span>
                          <span className="text-slate-500 text-[11px]">({m.region})</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {m.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.partners.length > 0 && (
                  <div className="px-2 pt-1 border-t border-slate-100">
                    <span className="px-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {language === 'en' ? 'Distributor Partners' : 'Mitra Distributor'}
                    </span>
                    {searchResults.partners.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveTab('partners');
                          setViewingPartnerId(p.id);
                          setViewingMarketId(null);
                          setViewingAgreementId(null);
                          setIsSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-left"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {p.companyName}
                          </span>
                          <span className="text-slate-500 text-[11px] truncate">
                            • {p.country}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
                          {p.pipelineStage}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.agreements.length > 0 && (
                  <div className="px-2 pt-1 border-t border-slate-100">
                    <span className="px-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {language === 'en' ? 'Distribution Agreements' : 'Perjanjian Distribusi (Agreements)'}
                    </span>
                    {searchResults.agreements.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setActiveTab('agreements');
                          setViewingAgreementId(a.id);
                          setViewingMarketId(null);
                          setViewingPartnerId(null);
                          setIsSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-left"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                          <span className="font-semibold text-slate-800 font-mono text-[11px]">
                            {a.agreementCode}
                          </span>
                          <span className="text-slate-600 truncate text-[11px]">
                            {a.name}
                          </span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium shrink-0">
                          {a.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: World Clock, Language Switcher, Quick Actions & Reset */}
      <div className="flex items-center gap-2 shrink-0">
        {/* World Clock & International Business Hours Widget */}
        <WorldClockPopover />

        {/* Dual Language Switcher EN / ID */}
        <LanguageSwitcher variant="header" />

        {/* Reset Prototype Data */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          title={t('header.btn.resetSample', 'Reset Sampel')}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">{t('header.btn.resetSample', 'Reset Sampel')}</span>
        </button>

        {/* Primary "+ Buat Baru" Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-slate-800 hover:to-indigo-900 transition active:scale-98 ring-1 ring-black/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('header.btn.createNew', 'Buat Baru')}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg z-50">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAddMarketOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-semibold">{t('header.btn.addMarket', 'Tambah Market')}</div>
                  <div className="text-[10px] text-slate-400">{t('header.btn.addMarket.desc', 'Target negara ekspansi')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAddPartnerOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <Building2 className="h-4 w-4 text-indigo-500" />
                <div>
                  <div className="font-semibold">{t('header.btn.addPartner', 'Tambah Partner')}</div>
                  <div className="text-[10px] text-slate-400">{t('header.btn.addPartner.desc', 'Prospek calon distributor')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAddAgreementOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <FileText className="h-4 w-4 text-violet-600" />
                <div>
                  <div className="font-semibold">{t('header.btn.createAgreement', 'Buat Agreement')}</div>
                  <div className="text-[10px] text-slate-400">{t('header.btn.createAgreement.desc', 'Kontrak distributor resmi')}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsAddActivityOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100"
              >
                <CalendarPlus className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="font-semibold">{t('header.btn.logActivity', 'Catat Aktivitas')}</div>
                  <div className="text-[10px] text-slate-400">{t('header.btn.logActivity.desc', 'Jadwal meeting, call, review')}</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Logout Button */}
        {authUser && (
          <button
            type="button"
            onClick={() => logout()}
            title={
              language === 'en'
                ? `Sign out (${authUser.displayName})`
                : `Keluar dari sesi (${authUser.displayName})`
            }
            aria-label={language === 'en' ? 'Sign Out' : 'Keluar'}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition shadow-xs cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">
              {language === 'en' ? 'Sign Out' : 'Keluar'}
            </span>
          </button>
        )}
      </div>
    </header>
    <DatabaseStatus />
    </div>
  );
};
