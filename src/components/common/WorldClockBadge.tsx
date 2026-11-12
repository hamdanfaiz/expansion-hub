/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Coffee, Calendar, AlertCircle } from 'lucide-react';
import { getPartnerBusinessStatus, type PartnerBusinessStatus } from '../../utils/worldClock';
import { useApp } from '../../context/AppContext';

interface WorldClockBadgeProps {
  countryName: string;
  variant?: 'compact' | 'pill' | 'detailed' | 'timeline';
  showSeconds?: boolean;
  className?: string;
}

export const WorldClockBadge: React.FC<WorldClockBadgeProps> = ({
  countryName,
  variant = 'compact',
  showSeconds = false,
  className = '',
}) => {
  const { language, t } = useApp();
  const [status, setStatus] = useState<PartnerBusinessStatus>(() =>
    getPartnerBusinessStatus(countryName, new Date(), language)
  );

  // Live timer updating every 10 seconds (or 1s if showSeconds)
  useEffect(() => {
    setStatus(getPartnerBusinessStatus(countryName, new Date(), language));
    const intervalMs = showSeconds ? 1000 : 10000;
    const interval = setInterval(() => {
      setStatus(getPartnerBusinessStatus(countryName, new Date(), language));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [countryName, showSeconds, language]);

  const renderIcon = (size = 'h-3 w-3') => {
    switch (status.iconType) {
      case 'sun':
        return <Sun className={`${size} text-emerald-600 shrink-0`} />;
      case 'moon':
        return <Moon className={`${size} text-indigo-400 shrink-0`} />;
      case 'coffee':
        return <Coffee className={`${size} text-amber-600 shrink-0`} />;
      case 'calendar':
        return <Calendar className={`${size} text-amber-600 shrink-0`} />;
      default:
        return <Clock className={`${size} text-slate-500 shrink-0`} />;
    }
  };

  // 1. Compact: Single-line badge with time and dot
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border ${status.badgeClass} ${className}`}
        title={`${status.countryName}: ${status.formattedTime} (${status.gmtOffsetString}) • ${status.label} • ${status.recommendation}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor} shrink-0`} />
        <span className="font-mono font-semibold">{status.formattedTime}</span>
        <span className="text-[10px] opacity-80 truncate max-w-[90px]">{status.label}</span>
      </span>
    );
  }

  // 2. Pill: Very small for table row or card chip
  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${status.badgeClass} ${className}`}
        title={`${status.countryName}: ${status.formattedTime} (${status.timeDiffString}) • ${status.recommendation}`}
      >
        {renderIcon('h-2.5 w-2.5')}
        <span className="font-mono font-semibold">{status.formattedTime}</span>
        <span className="hidden sm:inline opacity-75">· {status.label}</span>
      </span>
    );
  }

  // 3. Detailed Card: Used in PartnerDetailView
  if (variant === 'detailed') {
    return (
      <div className={`rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-xs ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={status.countryName}>
              {status.flag}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">{status.countryName}</span>
                <span className="text-xs text-slate-400 font-mono">({status.gmtOffsetString})</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {status.formattedDate} • {status.timeDiffString}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${status.badgeClass}`}>
            {renderIcon('h-3.5 w-3.5')}
            <span>{status.label}</span>
          </div>
        </div>

        {/* Digital Clock Display */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {t('clock.detail.title', 'Waktu Lokal Saat Ini')}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900">
                {showSeconds ? status.formattedTimeWithSeconds : status.formattedTime}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {status.timeZone.split('/')[1]?.replace('_', ' ') || 'Local'}
              </span>
            </div>
          </div>

          {/* Working hours indicator pill */}
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('clock.detail.standard', 'Jam Kerja Standar')}
            </div>
            <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
              09:00 - 18:00 ({language === 'en' ? 'Monday - Friday' : 'Senin - Jumat'})
            </div>
          </div>
        </div>

        {/* 24-Hour Visual Timeline */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
            <span>00:00</span>
            <span className="text-emerald-700 font-semibold">09:00 ({language === 'en' ? 'Open' : 'Buka'})</span>
            <span className="text-emerald-700 font-semibold">18:00 ({language === 'en' ? 'Close' : 'Tutup'})</span>
            <span>24:00</span>
          </div>

          <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            {/* Highlighted Working Hours Box (09:00 to 18:00 = 37.5% to 75%) */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-200/70 border-x border-emerald-400"
              style={{ left: '37.5%', width: '37.5%' }}
              title={language === 'en' ? 'Standard business hours (09:00 - 18:00)' : 'Jam kerja resmi (09:00 - 18:00)'}
            />
            {/* Highlighted Lunch Break (12:00 to 13:00 = 50% to 54.1%) */}
            <div
              className="absolute top-0 bottom-0 bg-amber-200/80"
              style={{ left: '50%', width: '4.16%' }}
              title={language === 'en' ? 'Lunch Break (12:00 - 13:00)' : 'Istirahat Siang (12:00 - 13:00)'}
            />
            {/* Current Time Pin */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-slate-900 shadow-sm transition-all duration-300 -translate-x-1/2"
              style={{ left: `${status.dayProgressPercent}%` }}
              title={`${language === 'en' ? 'Current time' : 'Posisi waktu saat ini'}: ${status.formattedTime}`}
            />
          </div>
        </div>

        {/* Actionable BD Recommendation */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/60">
          <div className="shrink-0 mt-0.5">{renderIcon('h-3.5 w-3.5')}</div>
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">{t('clock.detail.recommendation', 'Rekomendasi Kontak')}: </span>
            {status.recommendation}
          </div>
        </div>
      </div>
    );
  }

  // 4. Timeline bar variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs font-bold text-slate-800">{status.formattedTime}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.badgeClass}`}>
        {status.label}
      </span>
    </div>
  );
};
