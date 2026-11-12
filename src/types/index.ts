export type PriorityLevel = 'P1' | 'P2' | 'P3';

export type MarketStatus = 'Exploring' | 'Active' | 'On Hold' | 'Closed';

export interface Market {
  id: string;
  country: string;
  region: string;
  segment: string;
  priority: PriorityLevel;
  potential: string;
  owner: string;
  status: MarketStatus;
  researchNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage =
  | 'Target found'
  | 'Contacted'
  | 'Qualified'
  | 'Due diligence'
  | 'Negotiation'
  | 'Agreement'
  | 'Onboarding'
  | 'Active'
  | 'On hold'
  | 'Rejected'
  | 'Closed / Lost';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Target found',
  'Contacted',
  'Qualified',
  'Due diligence',
  'Negotiation',
  'Agreement',
  'Onboarding',
  'Active',
  'On hold',
  'Rejected',
  'Closed / Lost',
];

export interface IndustrySegment {
  id: string;
  code: string; // e.g. "SEG-FMCG"
  name: string; // e.g. "FMCG & Consumer Goods"
  description: string;
  targetAudience: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductAuthorityType =
  | 'Exclusive'
  | 'Non-Exclusive'
  | 'Co-Exclusive'
  | 'Pilot / Trial';

export const PRODUCT_AUTHORITY_TYPES: ProductAuthorityType[] = [
  'Exclusive',
  'Non-Exclusive',
  'Co-Exclusive',
  'Pilot / Trial',
];

export interface PartnerProductAuthorization {
  id: string;
  productCategory: string; // e.g. "Halal Skincare & Cosmetics", "Personal Care & Body Care"
  authorityType: ProductAuthorityType;
  territoryScope?: string; // e.g. "Wilayah Selatan (HCMC)", "Nasional - Modern Trade", "Seluruh Negara"
  notes?: string;
}

export const DISTRIBUTABLE_PRODUCT_CATEGORIES: string[] = [
  'Personal Care & Body Care',
  'Halal Skincare & Cosmetics',
  'Hair Care & Styling',
  'Health Supplements & Vitamins',
  'Packaged Food & Healthy Snacks',
  'Specialty Tea & Coffee Beverages',
  'Herbal & Traditional Wellness',
  'Mother & Baby Care',
  'Oral Care & Hygiene',
  'OTC Healthcare & First Aid',
];

export interface PartnerScorecard {
  financialStability: number; // 1-5
  distributionReach: number; // 1-5
  regulatoryCompliance: number; // 1-5
  marketReputation: number; // 1-5
  notes?: string;
}

export interface Partner {
  id: string;
  companyName: string;
  country: string;
  marketId: string;
  segment: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  owner: string;
  pipelineStage: PipelineStage;
  scorecard: PartnerScorecard;
  authorizedProducts?: PartnerProductAuthorization[]; // Multi-distributor product authority allocations
  notes: string;
  nextActivityDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'Meeting'
  | 'Call'
  | 'Email'
  | 'Due Diligence'
  | 'Site Visit'
  | 'Contract Review'
  | 'Follow-up';

export type ActivityStatus = 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: ActivityStatus;
  relatedMarketId: string;
  relatedPartnerId: string;
  relatedAgreementId?: string;
  owner: string;
  notes: string;
  createdAt: string;
}

export type NavigationModule =
  | 'overview'
  | 'markets'
  | 'partners'
  | 'activities'
  | 'agreements'
  | 'training'
  | 'reports'
  | 'settings';

export type AgreementType =
  | 'Distribution'
  | 'Exclusive Distribution'
  | 'Reseller'
  | 'Agency'
  | 'Pilot/MOU'
  | 'Other';

export const AGREEMENT_TYPES: AgreementType[] = [
  'Distribution',
  'Exclusive Distribution',
  'Reseller',
  'Agency',
  'Pilot/MOU',
  'Other',
];

export type AgreementWorkflowStatus =
  | 'Draft'
  | 'Internal Review'
  | 'Partner Review'
  | 'Negotiation'
  | 'Signed / Active'
  | 'Expired'
  | 'Terminated';

export const AGREEMENT_STATUSES: AgreementWorkflowStatus[] = [
  'Draft',
  'Internal Review',
  'Partner Review',
  'Negotiation',
  'Signed / Active',
  'Expired',
  'Terminated',
];

export type ReviewStatus = 'Not Started' | 'Pending' | 'Approved' | 'Revision Required';

export interface AgreementReviewChecklist {
  commercialTermsApproved: boolean;
  complianceVerified: boolean;
  creditLimitApproved: boolean;
  disputeClauseAgreed: boolean;
}

export interface AgreementTimelineEvent {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  note?: string;
  previousStatus?: AgreementWorkflowStatus;
  newStatus?: AgreementWorkflowStatus;
}

export type ExpiryUrgencyStatus =
  | 'expired'
  | 'expiring_30'
  | 'expiring_60'
  | 'expiring_90'
  | 'safe'
  | 'not_applicable';

export interface Agreement {
  id: string;
  agreementCode: string;
  name: string;
  type: AgreementType;
  partnerId: string;
  marketIds: string[];
  owner: string;

  // Cakupan (Scope)
  productCategory: string;
  territory: string;
  scopeNotes: string;
  isExclusive: boolean;

  // Ketentuan Komersial
  currency: string;
  annualSalesTarget: number;
  paymentTerms: string;
  marginDiscount: string;
  incoterms?: string;

  // Review Internal
  legalReviewer?: string;
  legalReviewStatus: ReviewStatus;
  financeReviewer?: string;
  financeReviewStatus: ReviewStatus;
  reviewChecklist: AgreementReviewChecklist;

  // Masa Berlaku & Versi
  signingDate?: string;
  effectiveDate: string;
  endDate: string;
  noticePeriodDays: number;
  renewalType: 'manual' | 'automatic';
  version: string;
  documentRef?: string;

  // Status Workflow
  status: AgreementWorkflowStatus;

  // Catatan & Audit
  internalNotes?: string;
  timeline: AgreementTimelineEvent[];

  createdAt: string;
  updatedAt: string;
}


export type TrainingStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
export type TrainingMode = 'Online' | 'On-site' | 'Hybrid';
export type TrainingCategory = 'Product' | 'Sales & Channel' | 'Operations' | 'Regulatory' | 'Marketing' | 'Other';

export interface Training {
  id: string;
  title: string;
  category: TrainingCategory;
  partnerId: string;
  marketId?: string;
  scheduledDate: string;
  durationHours: number;
  mode: TrainingMode;
  trainer: string;
  status: TrainingStatus;
  participantCount: number;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
