import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  Building2,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDateId,
  isActivityOverdue,
} from '../../utils/pipeline';
import type { Activity, ActivityType, ActivityStatus } from '../../types';

export const ActivitiesView: React.FC = () => {
  const {
    activities,
    partners,
    markets,
    toggleActivityStatus,
    deleteActivity,
    setIsAddActivityOpen,
    setEditingActivity,
    setViewingPartnerId,
    setActiveTab,
    language,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  const uniqueOwners = Array.from(new Set(activities.map((a) => a.owner))).filter(Boolean);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const q = searchQuery.toLowerCase().trim();
      const partner = partners.find((p) => p.id === act.relatedPartnerId);
      const market = markets.find((m) => m.id === act.relatedMarketId);

      const matchesSearch =
        q === '' ||
        act.title.toLowerCase().includes(q) ||
        act.notes.toLowerCase().includes(q) ||
        act.owner.toLowerCase().includes(q) ||
        (partner && partner.companyName.toLowerCase().includes(q)) ||
        (market && market.country.toLowerCase().includes(q));

      const isOverdue = isActivityOverdue(act.dueDate, act.status);

      let matchesStatus = true;
      if (statusFilter === 'Pending') matchesStatus = act.status === 'Pending' && !isOverdue;
      else if (statusFilter === 'Overdue') matchesStatus = isOverdue && act.status !== 'Completed';
      else if (statusFilter === 'Completed') matchesStatus = act.status === 'Completed';

      const matchesType = typeFilter === 'ALL' || act.type === typeFilter;
      const matchesOwner = ownerFilter === 'ALL' || act.owner === ownerFilter;

      return matchesSearch && matchesStatus && matchesType && matchesOwner;
    });
  }, [activities, partners, markets, searchQuery, statusFilter, typeFilter, ownerFilter]);

  const overdueCount = activities.filter((a) => isActivityOverdue(a.dueDate, a.status)).length;
  const pendingCount = activities.filter((a) => a.status === 'Pending' && !isActivityOverdue(a.dueDate, a.status)).length;
  const completedCount = activities.filter((a) => a.status === 'Completed').length;

  return (
    <div className="space-y-5 pb-12">
      {/* Header and Add Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {language === 'en' ? 'IBD Operations' : 'Operasional IBD'}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
              {activities.length} {language === 'en' ? 'Activities' : 'Aktivitas'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {language === 'en' ? 'Team Activity Schedule & Log' : 'Daftar & Jadwal Aktivitas Tim'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {language === 'en'
              ? 'Monitor commercial meetings, partner due diligence, sample shipments, and contract reviews.'
              : 'Monitor jadwal pertemuan komersial, due diligence mitra, pengiriman sampel, dan review kontrak.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingActivity(null);
            setIsAddActivityOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition active:scale-98 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'en' ? 'Log New Activity' : 'Catat Aktivitas Baru'}</span>
        </button>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium border transition ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {language === 'en' ? 'All' : 'Semua'} ({activities.length})
        </button>
        <button
          onClick={() => setStatusFilter('Overdue')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition ${
            statusFilter === 'Overdue'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{language === 'en' ? 'Overdue' : 'Terlambat'} ({overdueCount})</span>
        </button>
        <button
          onClick={() => setStatusFilter('Pending')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium border transition ${
            statusFilter === 'Pending'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          {language === 'en' ? 'Upcoming' : 'Mendatang'} ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('Completed')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium border transition ${
            statusFilter === 'Completed'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          {language === 'en' ? 'Completed' : 'Selesai'} ({completedCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search activity title, partner, country, notes, or PIC...' : 'Cari judul aktivitas, nama mitra, negara, catatan, atau PIC...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All Activity Types' : 'Semua Jenis Aktivitas'}</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="Due Diligence">Due Diligence</option>
              <option value="Site Visit">Site Visit</option>
              <option value="Contract Review">Contract Review</option>
              <option value="Follow-up">Follow-up</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-slate-400"
            >
              <option value="ALL">{language === 'en' ? 'All PICs' : 'Semua PIC'}</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            {(searchQuery || typeFilter !== 'ALL' || ownerFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setOwnerFilter('ALL');
                }}
                className="text-xs font-semibold text-rose-600 hover:underline px-1"
              >
                {language === 'en' ? 'Reset Filters' : 'Reset Filter'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activities Working List */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 w-10">Status</th>
                <th className="px-4 py-3">{language === 'en' ? 'Activity Type & Title' : 'Jenis & Judul Aktivitas'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Related Partner / Market' : 'Mitra Terkait / Pasar'}</th>
                <th className="px-4 py-3">{language === 'en' ? 'Due Date' : 'Jatuh Tempo'}</th>
                <th className="px-4 py-3">PIC (Owner)</th>
                <th className="px-4 py-3">{language === 'en' ? 'Notes / Details' : 'Catatan / Detail'}</th>
                <th className="px-4 py-3 text-right">{language === 'en' ? 'Actions' : 'Aksi'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">
                      {language === 'en' ? 'No activities found' : 'Tidak ada aktivitas yang ditemukan'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const partner = partners.find((p) => p.id === act.relatedPartnerId);
                  const market = markets.find((m) => m.id === act.relatedMarketId);
                  const isOverdue = isActivityOverdue(act.dueDate, act.status);
                  const isCompleted = act.status === 'Completed';

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCompleted ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActivityStatus(act.id)}
                          title={isCompleted ? (language === 'en' ? 'Mark Incomplete' : 'Tandai Belum Selesai') : (language === 'en' ? 'Mark Completed' : 'Tandai Selesai')}
                          className={`rounded p-1 transition ${
                            isCompleted
                              ? 'text-emerald-600 hover:text-slate-400'
                              : 'text-slate-300 hover:text-emerald-600'
                          }`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                            {act.type}
                          </span>
                          <span
                            className={`font-semibold ${
                              isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {act.title}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {partner ? (
                          <button
                            onClick={() => {
                              setActiveTab('partners');
                              setViewingPartnerId(partner.id);
                            }}
                            className="font-medium text-indigo-600 hover:underline text-left block"
                          >
                            {partner.companyName}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {partner.country}
                            </span>
                          </button>
                        ) : market ? (
                          <span className="text-slate-600 font-medium">{market.country}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          {isOverdue && !isCompleted && (
                            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                          )}
                          <span
                            className={
                              isOverdue && !isCompleted
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {formatDateId(act.dueDate, language)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700">
                        {act.owner}
                      </td>

                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {act.notes || <span className="text-slate-400 italic">-</span>}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingActivity(act);
                              setIsAddActivityOpen(true);
                            }}
                            title={language === 'en' ? 'Edit Activity' : 'Edit Aktivitas'}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMsg = language === 'en'
                                ? 'Delete this activity schedule?'
                                : 'Hapus jadwal aktivitas ini?';
                              if (confirm(confirmMsg)) {
                                deleteActivity(act.id);
                              }
                            }}
                            title={language === 'en' ? 'Delete Activity' : 'Hapus Aktivitas'}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
    </div>
  );
};
