import React from 'react';
import {
  Building2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  Globe,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateAverageScore,
  formatDateId,
  getScorecardTier,
  getStageColor,
  isActivityOverdue,
} from '../../utils/pipeline';
import { PIPELINE_STAGES, type Partner, type PipelineStage } from '../../types';
import { WorldClockBadge } from '../common/WorldClockBadge';

interface PartnerKanbanBoardProps {
  filteredPartners: Partner[];
}

export const PartnerKanbanBoard: React.FC<PartnerKanbanBoardProps> = ({ filteredPartners }) => {
  const {
    setViewingPartnerId,
    updatePartnerStage,
    setIsAddPartnerOpen,
    getMarketById,
    language,
  } = useApp();

  // Group partners by stage
  const partnersByStage = React.useMemo(() => {
    const map: Record<PipelineStage, Partner[]> = {
      'Target found': [],
      Contacted: [],
      Qualified: [],
      'Due diligence': [],
      Negotiation: [],
      Agreement: [],
      Onboarding: [],
      Active: [],
      'On hold': [],
      Rejected: [],
      'Closed / Lost': [],
    };

    filteredPartners.forEach((p) => {
      if (map[p.pipelineStage]) {
        map[p.pipelineStage].push(p);
      }
    });

    return map;
  }, [filteredPartners]);

  const handleMoveStage = (
    e: React.MouseEvent,
    partnerId: string,
    currentStage: PipelineStage,
    direction: 'prev' | 'next'
  ) => {
    e.stopPropagation();
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    if (direction === 'prev' && currentIndex > 0) {
      updatePartnerStage(partnerId, PIPELINE_STAGES[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < PIPELINE_STAGES.length - 1) {
      updatePartnerStage(partnerId, PIPELINE_STAGES[currentIndex + 1]);
    }
  };

  return (
    <div className="overflow-x-auto pb-4 pt-1">
      <div className="inline-flex gap-4 min-w-full">
        {PIPELINE_STAGES.map((stage, stageIndex) => {
          const stageStyle = getStageColor(stage);
          const stagePartners = partnersByStage[stage] || [];

          return (
            <div
              key={stage}
              className="flex flex-col w-72 shrink-0 rounded-lg border border-slate-200 bg-slate-50/60 shadow-2xs max-h-[calc(100vh-230px)]"
            >
              {/* Column Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 rounded-t-lg">
                <div className="flex items-center gap-2 truncate">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${stageStyle.dot}`} />
                  <span className="font-bold text-xs text-slate-800 truncate" title={stage}>
                    {stage}
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-600">
                  {stagePartners.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[160px]">
                {stagePartners.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400 italic">
                    {language === 'en' ? 'No leads in this stage' : 'Tidak ada prospek pada tahap ini'}
                  </div>
                ) : (
                  stagePartners.map((partner) => {
                    const avgScore = calculateAverageScore(partner.scorecard);
                    const isOverdue = isActivityOverdue(partner.nextActivityDate, 'Pending');
                    const market = getMarketById(partner.marketId);

                    return (
                      <div
                        key={partner.id}
                        onClick={() => setViewingPartnerId(partner.id)}
                        className="group relative cursor-pointer rounded-md border border-slate-200 bg-white p-3 shadow-2xs transition hover:border-slate-300 hover:shadow-md"
                      >
                        {/* Header: Company & Country */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                            {partner.companyName}
                          </h4>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {partner.country}
                          </span>
                        </div>

                        {/* World Clock & Working Hours */}
                        <div className="mt-1.5">
                          <WorldClockBadge countryName={partner.country} variant="pill" />
                        </div>

                        {/* Segment & Market Info */}
                        <p className="mt-1 text-[11px] text-slate-500 truncate">
                          {partner.segment}
                        </p>

                        {/* Authorized Products (Multidist) */}
                        {partner.authorizedProducts && partner.authorizedProducts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {partner.authorizedProducts.slice(0, 2).map((auth) => (
                              <span
                                key={auth.productCategory}
                                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-medium ${
                                  auth.authorityType === 'Exclusive'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : auth.authorityType === 'Co-Exclusive'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                                title={`${auth.productCategory} (${auth.authorityType})`}
                              >
                                <span className="max-w-[85px] truncate">{auth.productCategory}</span>
                                {auth.authorityType === 'Exclusive' && (
                                  <span className="text-[8px] font-bold text-purple-600">★</span>
                                )}
                              </span>
                            ))}
                            {partner.authorizedProducts.length > 2 && (
                              <span className="inline-flex items-center rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium text-slate-500">
                                +{partner.authorizedProducts.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Scorecard and Owner */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                          <div className="flex items-center gap-1 font-mono text-slate-700">
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-semibold">{avgScore}%</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 truncate max-w-[120px]">
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{partner.owner}</span>
                          </div>
                        </div>

                        {/* Next Activity Indicator */}
                        <div
                          className={`mt-2 flex items-center justify-between rounded px-2 py-1 text-[10px] font-medium ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {isOverdue ? (
                              <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                            ) : (
                              <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">
                              {isOverdue ? (language === 'en' ? 'Overdue:' : 'Terlambat:') : 'Next:'} {formatDateId(partner.nextActivityDate, language)}
                            </span>
                          </div>
                        </div>

                        {/* Quick Move Stage Footer */}
                        <div
                          className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-1 text-[10px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            disabled={stageIndex === 0}
                            onClick={(e) => handleMoveStage(e, partner.id, partner.pipelineStage, 'prev')}
                            title={language === 'en' ? 'Move to previous stage' : 'Pindah ke tahap sebelumnya'}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'en' ? `Stage ${stageIndex + 1}/${PIPELINE_STAGES.length}` : `Tahap ${stageIndex + 1}/${PIPELINE_STAGES.length}`}
                          </span>

                          <button
                            disabled={stageIndex === PIPELINE_STAGES.length - 1}
                            onClick={(e) => handleMoveStage(e, partner.id, partner.pipelineStage, 'next')}
                            title={language === 'en' ? 'Move to next stage' : 'Pindah ke tahap berikutnya'}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
