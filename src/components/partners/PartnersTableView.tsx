import React, { useState } from 'react';
import {
  Building2,
  ArrowUpDown,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Award,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateAverageScore,
  formatDateId,
  getScorecardTier,
  getStageColor,
  isActivityOverdue,
} from '../../utils/pipeline';
import type { Partner } from '../../types';
import { WorldClockBadge } from '../common/WorldClockBadge';

interface PartnersTableViewProps {
  partners: Partner[];
}

export const PartnersTableView: React.FC<PartnersTableViewProps> = ({ partners }) => {
  const {
    setViewingPartnerId,
    setEditingPartner,
    setIsAddPartnerOpen,
    deletePartner,
    getMarketById,
    t,
    language,
  } = useApp();

  const [sortField, setSortField] = useState<'companyName' | 'country' | 'nextActivityDate' | 'score'>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: 'companyName' | 'country' | 'nextActivityDate' | 'score') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPartners = React.useMemo(() => {
    return [...partners].sort((a, b) => {
      let valA: any = a[sortField as keyof Partner];
      let valB: any = b[sortField as keyof Partner];

      if (sortField === 'score') {
        valA = calculateAverageScore(a.scorecard);
        valB = calculateAverageScore(b.scorecard);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [partners, sortField, sortDirection]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th
                onClick={() => toggleSort('companyName')}
                className="cursor-pointer px-4 py-3 hover:text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('partners.table.company', 'Perusahaan & Kontak')}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('country')}
                className="cursor-pointer px-4 py-3 hover:text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('partners.table.country', 'Negara / Pasar')}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3">{t('partners.table.stage', 'Pipeline Stage')}</th>
              <th
                onClick={() => toggleSort('score')}
                className="cursor-pointer px-4 py-3 hover:text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('partners.table.scorecard', 'Scorecard')}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3">{t('partners.table.owner', 'Owner (PIC)')}</th>
              <th
                onClick={() => toggleSort('nextActivityDate')}
                className="cursor-pointer px-4 py-3 hover:text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <span>{t('partners.table.nextActivity', 'Aktivitas Berikutnya')}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right">{t('partners.table.actions', 'Aksi')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPartners.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">
                    {language === 'en' ? 'No partner records match the current filter' : 'Tidak ada data mitra yang sesuai dengan filter'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedPartners.map((partner) => {
                const stageStyle = getStageColor(partner.pipelineStage);
                const avgScore = calculateAverageScore(partner.scorecard);
                const scoreTier = getScorecardTier(avgScore, language);
                const isOverdue = isActivityOverdue(partner.nextActivityDate, 'Pending');
                const market = getMarketById(partner.marketId);

                return (
                  <tr
                    key={partner.id}
                    onClick={() => setViewingPartnerId(partner.id)}
                    className="group cursor-pointer hover:bg-slate-50/80 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <Building2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900 block group-hover:text-indigo-600 transition">
                            {partner.companyName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {partner.contactName} ({partner.contactEmail})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{partner.country}</span>
                      </div>
                      <div className="mt-1">
                        <WorldClockBadge countryName={partner.country} variant="compact" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {partner.segment}
                      </div>
                      {partner.authorizedProducts && partner.authorizedProducts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {partner.authorizedProducts.slice(0, 2).map((a) => (
                            <span
                              key={a.id}
                              className="inline-block rounded bg-indigo-50 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-700 border border-indigo-100"
                            >
                              {a.productCategory.split('&')[0].trim()} ({a.authorityType === 'Exclusive' ? (language === 'en' ? 'Exclusive' : 'Eksklusif') : a.authorityType})
                            </span>
                          ))}
                          {partner.authorizedProducts.length > 2 && (
                            <span className="text-[9px] font-semibold text-slate-400">
                              +{partner.authorizedProducts.length - 2} {language === 'en' ? 'more' : 'lagi'}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}>
                        {partner.pipelineStage}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-800">{avgScore}%</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${scoreTier.color}`}>
                          {scoreTier.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {partner.owner}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                        <span
                          className={`font-mono text-[11px] font-medium ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {formatDateId(partner.nextActivityDate, language)}
                        </span>
                      </div>
                    </td>

                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingPartner(partner);
                            setIsAddPartnerOpen(true);
                          }}
                          title={language === 'en' ? 'Edit Partner Prospect' : 'Edit Calon Mitra'}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(language === 'en' ? `Delete partner prospect ${partner.companyName}?` : `Hapus prospek mitra ${partner.companyName}?`)) {
                              deletePartner(partner.id);
                            }
                          }}
                          title={language === 'en' ? 'Delete Partner' : 'Hapus Mitra'}
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
  );
};
