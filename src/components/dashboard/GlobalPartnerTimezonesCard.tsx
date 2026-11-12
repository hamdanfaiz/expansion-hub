/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Sun,
  Moon,
  Coffee,
  Calendar,
  ChevronRight,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getActivePartnerCountryClocks,
  type CountryClockSummary,
} from '../../utils/worldClock';

export const GlobalPartnerTimezonesCard: React.FC = () => {
  const { partners, setActiveTab, setViewingPartnerId, language, t } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'all' | 'working' | 'off'>('all');

  // Live timer every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const data = React.useMemo(() => {
    return getActivePartnerCountryClocks(partners, currentTime, language);
  }, [partners, currentTime, language]);

  const userTimeFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZoneName: 'short',
    }).format(currentTime);
  }, [currentTime, language]);

  const filteredCountries = React.useMemo(() => {
    if (filterMode === 'working') {
      return data.countries.filter((c) => c.status.isCurrentlyWorking);
    }
    if (filterMode === 'off') {
      return data.countries.filter((c) => !c.status.isCurrentlyWorking);
    }
    return data.countries;
  }, [data.countries, filterMode]);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{t('clock.title', 'Jam Kerja & Zona Waktu Mitra Global')}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                {data.workingCount} {t('clock.activeBadge', 'Negara Sedang Aktif')}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('clock.userTime', 'Waktu lokal Anda (Jakarta):')} <span className="font-mono font-semibold text-slate-700">{userTimeFormatted}</span>
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`rounded-md px-2.5 py-1 transition ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('clock.tab.all', 'Semua')} ({data.totalCountries})
          </button>
          <button
            onClick={() => setFilterMode('working')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
              filterMode === 'working'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{t('clock.tab.working', 'Sedang Jam Kerja')} ({data.workingCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('off')}
            className={`rounded-md px-2.5 py-1 transition ${
              filterMode === 'off'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('clock.tab.off', 'Di Luar Jam')} ({data.totalCountries - data.workingCount})
          </button>
        </div>
      </div>

      {/* Grid of Partner Countries */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredCountries.map((c) => {
          const isWorking = c.status.isCurrentlyWorking;
          return (
            <div
              key={c.countryName}
              className={`group relative rounded-xl border p-3.5 transition-all duration-200 ${
                isWorking
                  ? 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/20 to-white hover:border-emerald-300 hover:shadow-md'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Country & Flag */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xl leading-none" role="img" aria-label={c.countryName}>
                    {c.flag}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate block">
                      {c.countryName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.status.gmtOffsetString}
                    </span>
                  </div>
                </div>

                {/* Status Dot & Badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border shrink-0 ${c.status.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${c.status.dotColor}`} />
                  <span>{c.status.label}</span>
                </span>
              </div>

              {/* Local Time Big Typography */}
              <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-100/80 pt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    {language === 'en' ? 'Current Time' : 'Waktu Saat Ini'}
                  </span>
                  <span className="font-mono text-xl font-extrabold tracking-tight text-slate-900">
                    {c.status.formattedTime}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {c.status.timeDiffString}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                    {c.partnerCount} {language === 'en' ? 'active partners' : 'mitra aktif'}
                  </span>
                </div>
              </div>

              {/* Recommendation pill */}
              <div className="mt-2 text-[10px] text-slate-500 leading-snug line-clamp-2 bg-slate-50/80 rounded p-1.5 border border-slate-100">
                {c.status.recommendation}
              </div>

              {/* Click to open partners */}
              {c.partners.length > 0 && (
                <div className="mt-2 pt-1 border-t border-slate-100/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate max-w-[130px]">
                    {c.partners[0].companyName}
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab('partners');
                      setViewingPartnerId(c.partners[0].id);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    {language === 'en' ? 'Open Profile' : 'Buka Profil'} <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCountries.length === 0 && (
        <div className="py-8 text-center text-slate-400 text-xs">
          {language === 'en'
            ? 'No partner countries match the selected business hours filter.'
            : 'Tidak ada negara mitra yang sesuai dengan filter jam kerja terpilih.'}
        </div>
      )}
    </div>
  );
};
