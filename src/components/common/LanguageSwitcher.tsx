/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Languages } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LanguageSwitcherProps {
  variant?: 'header' | 'sidebar' | 'inline';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, t } = useApp();

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center justify-between rounded-lg bg-slate-100 p-1.5 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-1">
          <Languages className="h-3.5 w-3.5 text-slate-500" />
          <span>{t('header.lang.switch', 'Bahasa')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLanguage('id')}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all ${
              language === 'id'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🇮🇩</span>
            <span>ID</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🇬🇧</span>
            <span>EN</span>
          </button>
        </div>
      </div>
    );
  }

  // Default 'header' variant
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-100/80 p-0.5 text-xs font-semibold shadow-2xs ${className}`}
      title={language === 'id' ? 'Ganti bahasa ke English (EN)' : 'Switch language to Bahasa Indonesia (ID)'}
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all ${
          language === 'id'
            ? 'bg-white text-slate-950 font-bold shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="Bahasa Indonesia"
      >
        <span className="text-xs">🇮🇩</span>
        <span className="font-mono text-[11px]">ID</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-all ${
          language === 'en'
            ? 'bg-white text-slate-950 font-bold shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-label="English"
      >
        <span className="text-xs">🇬🇧</span>
        <span className="font-mono text-[11px]">EN</span>
      </button>
    </div>
  );
};
