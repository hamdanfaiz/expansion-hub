import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Activity, ActivityType, ActivityStatus, Partner, Agreement } from '../../types';

export const ActivityModal: React.FC = () => {
  const {
    isAddActivityOpen,
    setIsAddActivityOpen,
    editingActivity,
    setEditingActivity,
    preselectedPartnerIdForActivity,
    setPreselectedPartnerIdForActivity,
    partners,
    markets,
    agreements,
    addActivity,
    updateActivity,
    language,
  } = useApp();

  const [type, setType] = useState<ActivityType>('Meeting');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('Pending');
  const [relatedPartnerId, setRelatedPartnerId] = useState('');
  const [relatedMarketId, setRelatedMarketId] = useState('');
  const [relatedAgreementId, setRelatedAgreementId] = useState('');
  const [owner, setOwner] = useState('Budi Santoso');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingActivity) {
      setType(editingActivity.type);
      setTitle(editingActivity.title);
      setDueDate(editingActivity.dueDate);
      setStatus(editingActivity.status);
      setRelatedPartnerId(editingActivity.relatedPartnerId || '');
      setRelatedMarketId(editingActivity.relatedMarketId || '');
      setRelatedAgreementId(editingActivity.relatedAgreementId || '');
      setOwner(editingActivity.owner);
      setNotes(editingActivity.notes || '');
    } else {
      setType('Meeting');
      setTitle('');
      // Default tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setStatus('Pending');

      const initialPartnerId = preselectedPartnerIdForActivity || partners[0]?.id || '';
      setRelatedPartnerId(initialPartnerId);
      const partnerObj = partners.find((p: Partner) => p.id === initialPartnerId);
      setRelatedMarketId(partnerObj ? partnerObj.marketId : markets[0]?.id || '');
      setOwner(partnerObj ? partnerObj.owner : 'Budi Santoso');
      setRelatedAgreementId('');
      setNotes('');
    }
    setError('');
  }, [editingActivity, isAddActivityOpen, preselectedPartnerIdForActivity, partners, markets]);

  const handlePartnerChange = (partnerId: string) => {
    setRelatedPartnerId(partnerId);
    const p = partners.find((item: Partner) => item.id === partnerId);
    if (p) {
      setRelatedMarketId(p.marketId);
      setOwner(p.owner);
      // If there's an agreement for this partner, we can optionally link it
      const matchAgreements = agreements.filter((a: Agreement) => a.partnerId === partnerId);
      if (matchAgreements.length === 1) {
        setRelatedAgreementId(matchAgreements[0].id);
      }
    }
  };

  if (!isAddActivityOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(language === 'en' ? 'Activity title is required' : 'Judul aktivitas wajib diisi');
      return;
    }
    if (!dueDate) {
      setError(language === 'en' ? 'Due date is required' : 'Tanggal jatuh tempo wajib ditentukan');
      return;
    }

    const activityData = {
      type,
      title: title.trim(),
      dueDate,
      status,
      relatedPartnerId,
      relatedMarketId,
      relatedAgreementId: relatedAgreementId || undefined,
      owner,
      notes: notes.trim(),
    };

    if (editingActivity) {
      updateActivity(editingActivity.id, activityData);
    } else {
      addActivity(activityData);
    }

    setIsAddActivityOpen(false);
    setEditingActivity(null);
    setPreselectedPartnerIdForActivity(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingActivity
                  ? (language === 'en' ? 'Edit Activity Schedule' : 'Edit Jadwal Aktivitas')
                  : (language === 'en' ? 'Log New Activity' : 'Catat Aktivitas Baru')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'en'
                  ? 'Schedule commercial interactions or prospect evaluations'
                  : 'Jadwalkan interaksi komersial atau evaluasi calon mitra'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddActivityOpen(false);
              setEditingActivity(null);
              setPreselectedPartnerIdForActivity(null);
            }}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Activity Type' : 'Jenis Aktivitas'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
              >
                <option value="Meeting">{language === 'en' ? 'Meeting (In-person / Virtual)' : 'Meeting (Tatap Muka / Virtual)'}</option>
                <option value="Call">{language === 'en' ? 'Call (Commercial Call)' : 'Call (Telepon Komersial)'}</option>
                <option value="Email">{language === 'en' ? 'Email (Document Correspondence)' : 'Email (Korespondensi Dokumen)'}</option>
                <option value="Due Diligence">{language === 'en' ? 'Due Diligence (Regulatory Audit)' : 'Due Diligence (Audit Regulasi)'}</option>
                <option value="Site Visit">{language === 'en' ? 'Site Visit (Warehouse/Facility Inspection)' : 'Site Visit (Inspeksi Gudang/Fasilitas)'}</option>
                <option value="Contract Review">{language === 'en' ? 'Contract Review (Clause Review)' : 'Contract Review (Tinjauan Klausul)'}</option>
                <option value="Follow-up">{language === 'en' ? 'Follow-up (Sample / MoQ Follow-up)' : 'Follow-up (Tindak Lanjut Sampel/MoQ)'}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Due Date' : 'Tanggal Jatuh Tempo'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'en' ? 'Activity Title / Agenda' : 'Judul / Agenda Aktivitas'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={language === 'en' ? 'E.g., Final Negotiation on MoQ Clauses & Distributor Margin' : 'Contoh: Negosiasi Final Klausul MoQ & Margin Distributor'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Related Distributor Partner' : 'Mitra Distributor Terkait'}
              </label>
              <select
                value={relatedPartnerId}
                onChange={(e) => handlePartnerChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
              >
                <option value="">{language === 'en' ? '-- Not Linked --' : '-- Tidak Ditautkan --'}</option>
                {partners.map((p: Partner) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName} ({p.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'en' ? 'Owner (PIC)' : 'Owner (PIC)'}
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'en' ? 'Related Distribution Agreement (Optional)' : 'Perjanjian Distribusi Terkait (Opsional)'}
            </label>
            <select
              value={relatedAgreementId}
              onChange={(e) => setRelatedAgreementId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-hidden bg-white"
            >
              <option value="">
                {language === 'en' ? '-- Not Linked to Specific Agreement --' : '-- Tidak Terhubung ke Perjanjian Spesifik --'}
              </option>
              {agreements.map((agr: Agreement) => (
                <option key={agr.id} value={agr.id}>
                  {agr.agreementCode} - {agr.name} ({agr.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'en' ? 'Activity Status' : 'Status Aktivitas'}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Pending"
                  checked={status === 'Pending'}
                  onChange={() => setStatus('Pending')}
                  className="accent-slate-900"
                />
                <span>{language === 'en' ? 'Pending' : 'Menunggu (Pending)'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Completed"
                  checked={status === 'Completed'}
                  onChange={() => setStatus('Completed')}
                  className="accent-emerald-600"
                />
                <span>{language === 'en' ? 'Completed' : 'Sudah Selesai (Completed)'}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'en' ? 'Notes & Outcome Summary' : 'Catatan Hasil & Ringkasan'}
            </label>
            <textarea
              rows={3}
              placeholder={language === 'en' ? 'Meeting notes, agreed volume targets, or next action items...' : 'Catatan hasil pertemuan, kesepakatan target volume, atau langkah tindak lanjut...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddActivityOpen(false);
                setEditingActivity(null);
                setPreselectedPartnerIdForActivity(null);
              }}
              className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs active:scale-98"
            >
              {editingActivity
                ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                : (language === 'en' ? 'Log Activity' : 'Catat Aktivitas')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
