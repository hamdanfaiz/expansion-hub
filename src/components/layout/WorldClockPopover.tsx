/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Globe,
  Sun,
  Moon,
  Coffee,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getActivePartnerCountryClocks,
  getPartnerBusinessStatus,
  type CountryClockSummary,
} from '../../utils/worldClock';
import { getAllMasterCountries } from '../../data/countryRegionDatabase';

export const WorldClockPopover: React.FC = () => {
  const { partners, setActiveTab, setViewingPartnerId, language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Aggregate active partner country clocks
  const partnerClocks = React.useMemo(() => {
    return getActivePartnerCountryClocks(partners, currentTime, language);
  }, [partners, currentTime, language]);

  // User's own formatted local time
  const userTimeFormatted = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      timeZoneName: 'short',
    });
    return formatter.format(currentTime);
  }, [currentTime, language]);

  // Filtered countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return partnerClocks.countries;
    }
    const q = searchQuery.toLowerCase();
    // Search within active partner countries first
    const matchedPartners = partnerClocks.countries.filter(
      (c) =>
        c.countryName.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.status.label.toLowerCase().includes(q)
    );

    if (matchedPartners.length > 0) return matchedPartners;

    // Fallback: search all master countries if user wants to check any country
    const masterMatches = getAllMasterCountries()
      .filter((mc) => mc.name.toLowerCase().includes(q) || mc.region.toLowerCase().includes(q))
      .slice(0, 6)
      .map((mc) => ({
        countryName: mc.name,
        flag: mc.flag,
        region: mc.region,
        partnerCount: 0,
        partners: [],
        status: getPartnerBusinessStatus(mc.name, currentTime, language),
      }));

    return masterMatches;
  }, [partnerClocks.countries, searchQuery, currentTime, language]);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('clock.title', 'Buka World Clock & Jam Kerja Partner Global')}
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition shadow-2xs ${
          isOpen
            ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200/50'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 font-mono">
          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>{userTimeFormatted}</span>
        </div>

        <div className="h-3 w-px bg-slate-200 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-700">
            {partnerClocks.workingCount}/{partnerClocks.totalCountries}
          </span>
          <span className="text-slate-500">{language === 'en' ? 'Active' : 'Jam Kerja'}</span>
        </div>
      </button>

      {/* Modern Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-xl border border-slate-200/90 bg-white shadow-xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-white/10 p-1.5 backdrop-blur-xs">
                <Globe className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-tight">
                  {t('clock.popover.title', 'World Clock & Jam Kerja Mitra')}
                </h3>
                <p className="text-[10px] text-indigo-200 mt-0.5">
                  {t('clock.userTime', 'Waktu Anda:')} <span className="font-mono font-semibold">{userTimeFormatted}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/80 px-2 py-2 text-center text-[11px]">
            <div className="px-2">
              <span className="text-slate-500 block text-[10px]">{t('clock.popover.activeWorking', 'Jam Kerja Aktif')}</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">
                {partnerClocks.workingCount} {language === 'en' ? 'Countries' : 'Negara'}
              </span>
            </div>
            <div className="px-2">
              <span className="text-slate-500 block text-[10px]">{t('clock.popover.offHours', 'Di Luar Jam Kerja')}</span>
              <span className="font-bold text-slate-700 font-mono text-sm">
                {partnerClocks.totalCountries - partnerClocks.workingCount} {language === 'en' ? 'Countries' : 'Negara'}
              </span>
            </div>
            <div className="px-2">
              <span className="text-slate-500 block text-[10px]">{t('clock.popover.totalPartners', 'Total Mitra IBD')}</span>
              <span className="font-bold text-indigo-700 font-mono text-sm">
                {partners.length} {language === 'en' ? 'Partners' : 'Mitra'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('clock.popover.search', 'Cari negara (mis. Jepang, Vietnam, Jerman)...')}
                className="w-full rounded-md border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* List of Countries */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredCountries.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {language === 'en'
                  ? `No countries match "${searchQuery}"`
                  : `Tidak ada negara yang cocok dengan "${searchQuery}"`}
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isWorking = c.status.isCurrentlyWorking;
                return (
                  <div
                    key={c.countryName}
                    className="flex items-center justify-between p-3 hover:bg-slate-50/90 transition group"
                  >
                    {/* Left: Flag & Country Info */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-lg leading-none shrink-0" role="img" aria-label={c.countryName}>
                        {c.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">{c.countryName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.status.gmtOffsetString}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {c.partnerCount > 0 ? (
                            <span className="text-indigo-600 font-medium">
                              {c.partnerCount} {language === 'en' ? 'registered partners' : 'mitra terdaftar'}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {language === 'en' ? 'No partners yet' : 'Belum ada mitra'}
                            </span>
                          )}
                          {' · '}
                          <span>{c.status.timeDiffString}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Local Time & Business Hours Status */}
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-mono text-sm font-extrabold text-slate-900">
                        {c.status.formattedTime}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold border ${c.status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.status.dotColor}`} />
                          <span>{c.status.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {language === 'en' ? 'Standard business hours: 09:00 - 18:00' : 'Standar jam kerja internasional: 09:00 - 18:00'}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveTab('partners');
              }}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              {language === 'en' ? 'View All Partners →' : 'Lihat Semua Partner →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
