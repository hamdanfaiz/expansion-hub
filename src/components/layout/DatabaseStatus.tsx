import React from 'react';
import { useApp } from '../../context/AppContext';

export const DatabaseStatus: React.FC = () => {
  const { syncState, language, retryServerSave, reloadServerDatabase, downloadUnsavedDraft } = useApp();
  const en = language === 'en';
  const problem = syncState.status === 'error' || syncState.status === 'conflict';
  let message = en ? 'Saved to server' : 'Tersimpan di server';
  if (syncState.status === 'loading') message = en ? 'Loading server data…' : 'Memuat data server…';
  if (syncState.status === 'saving') message = en ? 'Saving…' : 'Menyimpan…';
  if (syncState.status === 'pending') message = en ? 'Changes are not saved yet' : 'Perubahan belum tersimpan';
  if (syncState.status === 'conflict') message = en
    ? 'Server data changed in another session. Download your draft, then reload and reapply your edits.'
    : 'Data server berubah di sesi lain. Unduh draf, lalu muat ulang dan terapkan kembali perubahan Anda.';
  if (syncState.status === 'error') {
    message = syncState.message === 'SESSION_EXPIRED'
      ? en ? 'Session expired. Your edits remain here. Sign in in another tab, then retry saving.'
        : 'Sesi berakhir. Perubahan Anda tetap di sini. Masuk di tab lain, lalu coba simpan lagi.'
      : syncState.message === 'INVALID_DATABASE'
        ? en ? 'Some fields or linked records are invalid. Correct your latest edit, then retry saving. You can download a draft first.'
          : 'Ada kolom atau relasi record yang tidak valid. Perbaiki perubahan terakhir, lalu coba simpan lagi. Anda dapat mengunduh draf terlebih dahulu.'
      : syncState.message === 'RESET_DISABLED'
        ? en ? 'Sample-data reset is disabled on this server.' : 'Reset data sampel dinonaktifkan di server ini.'
        : en ? 'The server has not confirmed your data. Keep this page open, download a draft, and retry.'
          : 'Server belum mengonfirmasi data Anda. Biarkan halaman terbuka, unduh draf, lalu coba lagi.';
  }

  return <div role={problem ? 'alert' : 'status'} aria-live="polite"
    className={`flex w-full flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[11px] ${problem ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
    <span>{message}</span>
    <div className="flex flex-wrap items-center gap-3 font-semibold">
      {(problem || syncState.status === 'pending' || syncState.status === 'saving') && <button type="button" onClick={downloadUnsavedDraft} className="underline">{en ? 'Download draft' : 'Unduh draf'}</button>}
      {syncState.status === 'error' && <button type="button" onClick={() => void retryServerSave()} className="underline">{en ? 'Retry' : 'Coba lagi'}</button>}
      <button type="button" onClick={() => void reloadServerDatabase()} disabled={syncState.status === 'saving' || syncState.status === 'loading'} className="underline disabled:opacity-40">
        {en ? 'Reload server data' : 'Muat ulang data server'}
      </button>
    </div>
  </div>;
};
