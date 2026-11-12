import type {
  Activity,
  ActivityStatus,
  Market,
  MarketStatus,
  Partner,
  PartnerScorecard,
  PipelineStage,
  PriorityLevel,
  Agreement,
  AgreementWorkflowStatus,
  ExpiryUrgencyStatus,
} from '../types/index.ts';

/**
 * Calculates the overall weighted score (0 to 100%) from a partner's scorecard (each criterion is 1-5)
 */
export function calculateAverageScore(scorecard: PartnerScorecard): number {
  if (!scorecard) return 0;
  const values = [
    scorecard.financialStability || 0,
    scorecard.distributionReach || 0,
    scorecard.regulatoryCompliance || 0,
    scorecard.marketReputation || 0,
  ];
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avgOn5 = sum / values.length;
  // Convert 1-5 to percentage (1 -> 20%, 5 -> 100%)
  return Math.round((avgOn5 / 5) * 100);
}

/**
 * Evaluates score tier classification
 */
export function getScorecardTier(
  score: number,
  lang: 'id' | 'en' = 'id'
): { label: string; color: string; tier: 'Tinggi' | 'Menengah' | 'Perlu Evaluasi' } {
  if (score >= 80) {
    return {
      label: lang === 'en' ? 'Top Tier Partner' : 'Mitra Unggul',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      tier: 'Tinggi',
    };
  }
  if (score >= 60) {
    return {
      label: lang === 'en' ? 'Qualified' : 'Memenuhi Syarat',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      tier: 'Menengah',
    };
  }
  return {
    label: lang === 'en' ? 'Needs Evaluation' : 'Perlu Evaluasi',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    tier: 'Perlu Evaluasi',
  };
}

/**
 * Checks if an activity is overdue based on reference date (defaulting to current date)
 */
export function isActivityOverdue(
  dueDate: string,
  status: ActivityStatus,
  currentDateStr: string = '2026-10-17'
): boolean {
  if (status === 'Completed' || status === 'Cancelled') {
    return false;
  }
  return dueDate < currentDateStr;
}

/**
 * Counts activities that are overdue
 */
export function getOverdueCount(
  activities: Activity[],
  currentDateStr: string = '2026-10-17'
): number {
  return activities.filter((act) => isActivityOverdue(act.dueDate, act.status, currentDateStr)).length;
}

/**
 * Counts activities due on or after current date and not completed
 */
export function getUpcomingActivities(
  activities: Activity[],
  currentDateStr: string = '2026-10-17'
): Activity[] {
  return activities
    .filter((act) => act.status === 'Pending' && act.dueDate >= currentDateStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Aggregates dashboard operational metrics
 */
export function calculateDashboardMetrics(
  markets: Market[],
  partners: Partner[],
  activities: Activity[],
  currentDateStr: string = '2026-10-17'
) {
  const activeMarketsCount = markets.filter((m) => m.status === 'Active').length;
  const exploringMarketsCount = markets.filter((m) => m.status === 'Exploring').length;

  const activePartnersCount = partners.filter((p) => p.pipelineStage === 'Active').length;
  const inPipelinePartners = partners.filter(
    (p) =>
      p.pipelineStage !== 'Active' &&
      p.pipelineStage !== 'Rejected' &&
      p.pipelineStage !== 'Closed / Lost'
  ).length;

  const dueDiligenceOrNegCount = partners.filter(
    (p) => p.pipelineStage === 'Due diligence' || p.pipelineStage === 'Negotiation' || p.pipelineStage === 'Agreement'
  ).length;

  const overdueActivitiesCount = getOverdueCount(activities, currentDateStr);
  const pendingActivitiesCount = activities.filter((a) => a.status === 'Pending').length;

  // Markets by Priority
  const priorityBreakdown = {
    P1: markets.filter((m) => m.priority === 'P1').length,
    P2: markets.filter((m) => m.priority === 'P2').length,
    P3: markets.filter((m) => m.priority === 'P3').length,
  };

  // Partners by Stage
  const stageBreakdown: Record<PipelineStage, number> = {
    'Target found': 0,
    Contacted: 0,
    Qualified: 0,
    'Due diligence': 0,
    Negotiation: 0,
    Agreement: 0,
    Onboarding: 0,
    Active: 0,
    'On hold': 0,
    Rejected: 0,
    'Closed / Lost': 0,
  };

  partners.forEach((p) => {
    if (stageBreakdown[p.pipelineStage] !== undefined) {
      stageBreakdown[p.pipelineStage]++;
    }
  });

  return {
    totalMarkets: markets.length,
    activeMarketsCount,
    exploringMarketsCount,
    totalPartners: partners.length,
    activePartnersCount,
    inPipelinePartners,
    dueDiligenceOrNegCount,
    overdueActivitiesCount,
    pendingActivitiesCount,
    priorityBreakdown,
    stageBreakdown,
  };
}

/**
 * Visual badge styling for pipeline stages
 */
export function getStageColor(stage: PipelineStage): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (stage) {
    case 'Target found':
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' };
    case 'Contacted':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300', dot: 'bg-sky-500' };
    case 'Qualified':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' };
    case 'Due diligence':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' };
    case 'Negotiation':
      return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' };
    case 'Agreement':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' };
    case 'Onboarding':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300', dot: 'bg-teal-500' };
    case 'Active':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' };
    case 'On hold':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' };
    case 'Rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' };
    case 'Closed / Lost':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' };
  }
}

/**
 * Visual badge for Market Priority
 */
export function getPriorityBadge(
  priority: PriorityLevel,
  lang: 'id' | 'en' = 'id'
): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (priority) {
    case 'P1':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: lang === 'en' ? 'P1 - Strategic' : 'P1 - Strategis',
      };
    case 'P2':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: lang === 'en' ? 'P2 - Potential' : 'P2 - Potensial',
      };
    case 'P3':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: lang === 'en' ? 'P3 - Secondary' : 'P3 - Sekunder',
      };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: priority };
  }
}

/**
 * Visual badge for Market Status
 */
export function getStatusBadge(
  status: MarketStatus,
  lang: 'id' | 'en' = 'id'
): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'Active':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: lang === 'en' ? 'Active' : 'Aktif',
      };
    case 'Exploring':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        label: lang === 'en' ? 'Exploring' : 'Eksplorasi',
      };
    case 'On Hold':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: lang === 'en' ? 'On Hold' : 'Ditunda',
      };
    case 'Closed':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: lang === 'en' ? 'Closed' : 'Ditutup',
      };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: status };
  }
}

/**
 * Format date nicely in Indonesian/English format
 */
export function formatDateId(dateStr?: string, lang: 'id' | 'en' = 'id'): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthsId = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const monthsEn = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const year = parts[0];

      if (lang === 'en') {
        return `${monthsEn[monthIdx] || parts[1]} ${day}, ${year}`;
      }
      return `${day} ${monthsId[monthIdx] || parts[1]} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Formats monetary value according to standard currency code in Indonesian business format
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString('id-ID')}`;
  }
}

/**
 * Generate a collision-safe unique Agreement Code (e.g. AGR-2026-0001)
 */
export function generateAgreementCode(existingCodes: string[], year: number = new Date().getFullYear()): string {
  const prefix = `AGR-${year}-`;
  let maxSeq = 0;

  existingCodes.forEach((code) => {
    if (code && code.startsWith(prefix)) {
      const numPart = parseInt(code.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days remaining from reference date to target date
 */
export function getDaysRemaining(targetDate: string, referenceDateStr: string = getLocalDateString()): number {
  if (!targetDate) return 999;
  const target = new Date(targetDate);
  const ref = new Date(referenceDateStr);
  const diffTime = target.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates validity expiry badge independently from workflow status
 */
export function getAgreementExpiryStatus(
  endDate: string,
  status: AgreementWorkflowStatus,
  currentDateStr: string = getLocalDateString(),
  lang: 'id' | 'en' = 'id'
): {
  status: ExpiryUrgencyStatus;
  label: string;
  daysLeft: number;
  badgeColor: string;
  isWarning: boolean;
} {
  if (!endDate || status === 'Draft' || status === 'Internal Review') {
    return {
      status: 'not_applicable',
      label: lang === 'en' ? 'Not Effective Yet' : 'Belum Berlaku',
      daysLeft: 999,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      isWarning: false,
    };
  }

  const daysLeft = getDaysRemaining(endDate, currentDateStr);

  if (daysLeft < 0) {
    return {
      status: 'expired',
      label: lang === 'en' ? `Expired (${Math.abs(daysLeft)} d ago)` : `Kedaluwarsa (${Math.abs(daysLeft)} hr lalu)`,
      daysLeft,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      isWarning: true,
    };
  }

  if (daysLeft <= 30) {
    return {
      status: 'expiring_30',
      label: lang === 'en' ? `Expires in ${daysLeft} days` : `Berakhir dlm ${daysLeft} hari`,
      daysLeft,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold',
      isWarning: true,
    };
  }

  if (daysLeft <= 60) {
    return {
      status: 'expiring_60',
      label: lang === 'en' ? `Expires in ${daysLeft} days` : `Berakhir dlm ${daysLeft} hari`,
      daysLeft,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      isWarning: true,
    };
  }

  if (daysLeft <= 90) {
    return {
      status: 'expiring_90',
      label: lang === 'en' ? `Expires in ${daysLeft} days` : `Berakhir dlm ${daysLeft} hari`,
      daysLeft,
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      isWarning: true,
    };
  }

  return {
    status: 'safe',
    label: lang === 'en' ? `Safe (${daysLeft} d left)` : `Aman (${daysLeft} hr lagi)`,
    daysLeft,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isWarning: false,
  };
}

/**
 * Visual styling and label for Agreement Workflow Status
 */
export function getAgreementStatusBadge(
  status: AgreementWorkflowStatus,
  lang: 'id' | 'en' = 'id'
): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case 'Draft':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: 'Draft',
      };
    case 'Internal Review':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        label: 'Internal Review',
      };
    case 'Partner Review':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Partner Review',
      };
    case 'Negotiation':
      return {
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        border: 'border-violet-200',
        dot: 'bg-violet-500',
        label: lang === 'en' ? 'Negotiation' : 'Negosiasi',
      };
    case 'Signed / Active':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Signed / Active',
      };
    case 'Expired':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        label: lang === 'en' ? 'Expired' : 'Kedaluwarsa',
      };
    case 'Terminated':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        dot: 'bg-red-600',
        label: lang === 'en' ? 'Terminated' : 'Diterminasi',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: status,
      };
  }
}

/**
 * Calculates operational metrics for Agreements
 */
export function calculateAgreementMetrics(
  agreements: Agreement[],
  currentDateStr: string = getLocalDateString()
) {
  const draftOrReview = agreements.filter(
    (a) =>
      a.status === 'Draft' ||
      a.status === 'Internal Review' ||
      a.status === 'Partner Review' ||
      a.status === 'Negotiation'
  ).length;

  const signedActive = agreements.filter((a) => a.status === 'Signed / Active').length;

  const expiringIn90Days = agreements.filter((a) => {
    if (a.status === 'Terminated' || a.status === 'Draft') return false;
    const days = getDaysRemaining(a.endDate, currentDateStr);
    return days >= 0 && days <= 90;
  }).length;

  const expiredOrTerminated = agreements.filter((a) => {
    if (a.status === 'Expired' || a.status === 'Terminated') return true;
    const days = getDaysRemaining(a.endDate, currentDateStr);
    return days < 0 && a.status === 'Signed / Active';
  }).length;

  return {
    total: agreements.length,
    draftOrReview,
    signedActive,
    expiringIn90Days,
    expiredOrTerminated,
  };
}

