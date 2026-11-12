import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ResetConfirmModal: React.FC = () => {
  const { isResetModalOpen, setIsResetModalOpen, resetToSeedData, language } = useApp();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isResetModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'en' ? 'Replace All Shared Server Data?' : 'Ganti Seluruh Data Server Bersama?'}
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              {language === 'en'
                ? 'This replaces markets, partners, activities, agreements, training and industry segments with sample data for every user. Export a server backup first.'
                : 'Tindakan ini mengganti pasar, mitra, aktivitas, perjanjian, pelatihan, dan segmen industri dengan data sampel untuk semua pengguna. Ekspor cadangan server terlebih dahulu.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {language === 'en'
                ? 'The server disables this operation by default in production.'
                : 'Server menonaktifkan operasi ini secara default di produksi.'}
            </p>
          </div>
        </div>
        <label className="mt-4 block text-xs font-semibold text-slate-700">
          {language === 'en' ? 'Type RESET to confirm' : 'Ketik RESET untuk mengonfirmasi'}
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 block w-full rounded border border-slate-300 p-2 font-mono" />
        </label>
        {error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => { setIsResetModalOpen(false); setConfirmation(''); setError(''); }}
            className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            disabled={confirmation !== 'RESET' || busy}
            onClick={async () => {
              setBusy(true); setError('');
              const ok = await resetToSeedData();
              setBusy(false);
              if (ok) setConfirmation('');
              else setError(language === 'en' ? 'Reset was not confirmed. It may be disabled, your session may have expired, or server data changed. Check the server status.' : 'Reset belum dikonfirmasi. Operasi mungkin dinonaktifkan, sesi berakhir, atau data server berubah. Periksa status server.');
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs transition disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Yes, Reset Sample Data' : 'Ya, Reset Data Sampel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
