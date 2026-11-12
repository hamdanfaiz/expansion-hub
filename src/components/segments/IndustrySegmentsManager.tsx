/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Globe,
  SlidersHorizontal,
  X,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { IndustrySegment } from '../../types';

interface IndustrySegmentsManagerProps {
  onSelectSegment?: (segmentName: string) => void;
  isCompactModal?: boolean;
  onClose?: () => void;
}

export const IndustrySegmentsManager: React.FC<IndustrySegmentsManagerProps> = ({
  onSelectSegment,
  isCompactModal = false,
  onClose,
}) => {
  const {
    industrySegments,
    addIndustrySegment,
    updateIndustrySegment,
    deleteIndustrySegment,
    toggleIndustrySegmentStatus,
    exportIndustrySegmentsCsv,
    markets,
    partners,
    language,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<IndustrySegment | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Usage lookup
  const usageStats = useMemo(() => {
    const stats: Record<string, { marketCount: number; partnerCount: number }> = {};
    industrySegments.forEach((seg) => {
      const segLower = seg.name.toLowerCase();
      const codeLower = seg.code.toLowerCase();

      const mCount = markets.filter(
        (m) =>
          m.segment?.toLowerCase() === segLower ||
          m.segment?.toLowerCase() === codeLower
      ).length;

      const pCount = partners.filter(
        (p) =>
          p.segment?.toLowerCase() === segLower ||
          p.segment?.toLowerCase() === codeLower
      ).length;

      stats[seg.id] = { marketCount: mCount, partnerCount: pCount };
    });
    return stats;
  }, [industrySegments, markets, partners]);

  // Filtered segments
  const filteredSegments = useMemo(() => {
    return industrySegments.filter((seg) => {
      const matchesSearch =
        seg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? seg.isActive
          : !seg.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [industrySegments, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setEditingSegment(null);
    setName('');
    setCode(`SEG-${Date.now().toString().slice(-4)}`);
    setDescription('');
    setTargetAudience('');
    setIsActive(true);
    setErrorMessage('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (seg: IndustrySegment) => {
    setEditingSegment(seg);
    setName(seg.name);
    setCode(seg.code);
    setDescription(seg.description);
    setTargetAudience(seg.targetAudience);
    setIsActive(seg.isActive);
    setErrorMessage('');
    setIsFormModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage(language === 'en' ? 'Industry segment name is required.' : 'Nama segmen industri wajib diisi.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage(language === 'en' ? 'Segment unique code is required.' : 'Kode unik segmen wajib diisi.');
      return;
    }

    // Check duplicate code
    const isCodeTaken = industrySegments.some(
      (s) =>
        s.code.toLowerCase() === code.trim().toLowerCase() &&
        (!editingSegment || s.id !== editingSegment.id)
    );
    if (isCodeTaken) {
      setErrorMessage(
        language === 'en'
          ? `Code "${code.trim().toUpperCase()}" is already used by another segment.`
          : `Kode "${code.trim().toUpperCase()}" sudah digunakan segmen lain.`
      );
      return;
    }

    if (editingSegment) {
      updateIndustrySegment(editingSegment.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        targetAudience: targetAudience.trim(),
        isActive,
      });
      setSuccessNotice(
        language === 'en'
          ? `Segment "${name.trim()}" successfully updated.`
          : `Segmen "${name.trim()}" berhasil diperbarui.`
      );
    } else {
      addIndustrySegment({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        targetAudience: targetAudience.trim(),
        isActive,
      });
      setSuccessNotice(
        language === 'en'
          ? `New segment "${name.trim()}" successfully added.`
          : `Segmen baru "${name.trim()}" berhasil ditambahkan.`
      );
    }

    setIsFormModalOpen(false);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handleDelete = (seg: IndustrySegment) => {
    const stats = usageStats[seg.id];
    if (stats && (stats.marketCount > 0 || stats.partnerCount > 0)) {
      alert(
        language === 'en'
          ? `Segment "${seg.name}" cannot be deleted because it is used by ${stats.marketCount} Markets and ${stats.partnerCount} Partners. Deactivate it instead.`
          : `Segmen "${seg.name}" tidak dapat dihapus karena sedang dipakai oleh ${stats.marketCount} Pasar dan ${stats.partnerCount} Mitra. Nonaktifkan status segmen jika tidak ingin dipakai lagi.`
      );
      return;
    }

    if (
      confirm(
        language === 'en'
          ? `Are you sure you want to delete industry segment "${seg.name}"?`
          : `Apakah Anda yakin ingin menghapus segmen industri "${seg.name}"?`
      )
    ) {
      const res = deleteIndustrySegment(seg.id);
      if (!res.success) {
        alert(res.message);
      } else {
        setSuccessNotice(
          language === 'en'
            ? `Segment "${seg.name}" successfully deleted.`
            : `Segmen "${seg.name}" berhasil dihapus.`
        );
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'en' ? 'Industry Segmentation & Product Focus Master' : 'Master Segmentasi Industri & Sasaran Produk'}
            </h2>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
              {industrySegments.length} {language === 'en' ? 'Registered Segments' : 'Segmen Terdaftar'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {language === 'en'
              ? 'Manage standardized industry segment catalog for target market classification and distributor focus (CRUD)'
              : 'Kelola katalog segmen industri terstandardisasi untuk klasifikasi pasar sasaran dan fokus portofolio distributor (CRUDE)'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportIndustrySegmentsCsv}
            title={language === 'en' ? 'Download Segments Master CSV' : 'Download CSV Master Segmen'}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === 'en' ? 'Export CSV' : 'Ekspor CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-2xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'Add Segment' : 'Tambah Segmen'}</span>
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successNotice && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by segment name, code (e.g. SEG-FMCG), or audience...' : 'Cari berdasarkan nama segmen, kode (e.g. SEG-FMCG), atau audiens...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> {language === 'en' ? 'Status:' : 'Status:'}
          </span>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'en' ? 'All' : 'Semua'} ({industrySegments.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'en' ? 'Active' : 'Aktif'} ({industrySegments.filter((s) => s.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition ${
                statusFilter === 'inactive'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'en' ? 'Inactive' : 'Nonaktif'} ({industrySegments.filter((s) => !s.isActive).length})
            </button>
          </div>
        </div>
      </div>

      {/* Segments Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2.5 px-3">{language === 'en' ? 'Code & Segment Name' : 'Kode & Nama Segmen'}</th>
                <th className="py-2.5 px-3">{language === 'en' ? 'Description & Scope' : 'Deskripsi & Ruang Lingkup'}</th>
                <th className="py-2.5 px-3">{language === 'en' ? 'Target Audience & Channels' : 'Target Audiens & Saluran'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'en' ? 'System Linked' : 'Terkait di Sistem'}</th>
                <th className="py-2.5 px-3 text-center">{language === 'en' ? 'Status' : 'Status'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSegments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {language === 'en'
                      ? 'No industry segments match search criteria.'
                      : 'Tidak ada segmen industri yang sesuai dengan kriteria pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredSegments.map((seg) => {
                  const stat = usageStats[seg.id] || { marketCount: 0, partnerCount: 0 };
                  return (
                    <tr key={seg.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-start gap-2">
                          <Tag className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900 block">{seg.name}</span>
                            <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              {seg.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top max-w-xs">
                        <p className="text-slate-600 text-[11px] line-clamp-2">{seg.description}</p>
                      </td>

                      <td className="py-3 px-3 align-top max-w-xs">
                        <p className="text-slate-600 text-[11px] line-clamp-2">{seg.targetAudience}</p>
                      </td>

                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span
                            title={language === 'en' ? `${stat.marketCount} Target markets` : `${stat.marketCount} Pasar sasaran`}
                            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono"
                          >
                            <Globe className="h-3 w-3 text-slate-400" />
                            {stat.marketCount}
                          </span>
                          <span
                            title={language === 'en' ? `${stat.partnerCount} Distributor partners` : `${stat.partnerCount} Mitra distributor`}
                            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-medium"
                          >
                            <Building2 className="h-3 w-3 text-indigo-400" />
                            {stat.partnerCount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => toggleIndustrySegmentStatus(seg.id)}
                          title={language === 'en' ? 'Click to toggle active/inactive status' : 'Klik untuk ubah status aktif/non-aktif'}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                            seg.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {seg.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              <span>{language === 'en' ? 'Active' : 'Aktif'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-slate-400" />
                              <span>{language === 'en' ? 'Inactive' : 'Nonaktif'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onSelectSegment && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSegment(seg.name);
                                if (onClose) onClose();
                              }}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                            >
                              {language === 'en' ? 'Select' : 'Pilih'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(seg)}
                            title={language === 'en' ? 'Edit Segment' : 'Edit Segmen'}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(seg)}
                            title={language === 'en' ? 'Delete Segment' : 'Hapus Segmen'}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSegment
                    ? (language === 'en' ? 'Edit Industry Segment' : 'Edit Segmen Industri')
                    : (language === 'en' ? 'Add New Industry Segment' : 'Tambah Segmen Industri Baru')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-md bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Industry Segment Name' : 'Nama Segmen Industri'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'E.g., Halal Skincare & Cosmetics' : 'Contoh: Halal Skincare & Cosmetics'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Unique Code' : 'Kode Unik'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="SEG-BEAUTY"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs uppercase font-mono focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Target Audience & Sales Channels' : 'Target Audiens & Saluran Penjualan'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g., Modern pharmacy chains, drugstores, specialty beauty, e-commerce shoppers' : 'Contoh: Modern pharmacy chains, drugstores, specialty beauty, e-commerce shoppers'}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Description & Scope of Commodities' : 'Deskripsi & Ruang Lingkup Komoditas'}
                </label>
                <textarea
                  rows={3}
                  placeholder={language === 'en' ? 'Commodity types explanation, required certifications (Halal/FDA), specifications...' : 'Penjelasan jenis komoditas, sertifikasi yang disyaratkan (Halal/BPOM/FDA), dan spesifikasi...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="segment-active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="segment-active-toggle" className="text-xs font-medium text-slate-700 select-none">
                  {language === 'en'
                    ? 'This segment is active and selectable on Market and Partner forms'
                    : 'Segmen ini aktif dan dapat dipilih pada formulir Pasar dan Mitra'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-md border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs"
                >
                  {editingSegment
                    ? (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')
                    : (language === 'en' ? 'Add Segment' : 'Tambah Segmen')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
