import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAverageScore,
  getScorecardTier,
  isActivityOverdue,
  getOverdueCount,
  calculateDashboardMetrics,
  formatDateId,
  generateAgreementCode,
  getAgreementExpiryStatus,
  calculateAgreementMetrics,
  formatCurrency,
} from './pipeline.ts';
import type { Market, Partner, Activity, Agreement } from '../types/index.ts';

test('calculateAverageScore converts 1-5 criteria into percentage', () => {
  const scorecard = {
    financialStability: 5,
    distributionReach: 5,
    regulatoryCompliance: 5,
    marketReputation: 5,
  };
  assert.equal(calculateAverageScore(scorecard), 100);

  const balancedScorecard = {
    financialStability: 4,
    distributionReach: 3,
    regulatoryCompliance: 4,
    marketReputation: 3,
  };
  // Avg = 3.5 / 5 = 70%
  assert.equal(calculateAverageScore(balancedScorecard), 70);
});

test('getScorecardTier returns proper tier labels', () => {
  assert.equal(getScorecardTier(85).tier, 'Tinggi');
  assert.equal(getScorecardTier(65).tier, 'Menengah');
  assert.equal(getScorecardTier(45).tier, 'Perlu Evaluasi');
});

test('isActivityOverdue detects overdue pending activities properly', () => {
  const refDate = '2026-10-17';
  assert.equal(isActivityOverdue('2026-10-10', 'Pending', refDate), true);
  assert.equal(isActivityOverdue('2026-10-17', 'Pending', refDate), false);
  assert.equal(isActivityOverdue('2026-10-25', 'Pending', refDate), false);
  // Completed activities should not be marked overdue
  assert.equal(isActivityOverdue('2026-10-10', 'Completed', refDate), false);
});

test('calculateDashboardMetrics aggregates counts correctly', () => {
  const mockMarkets: Market[] = [
    {
      id: 'm1',
      country: 'Vietnam',
      region: 'Asia Tenggara',
      segment: 'FMCG',
      priority: 'P1',
      potential: 'Tier 1',
      owner: 'Budi',
      status: 'Active',
      researchNotes: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'm2',
      country: 'Arab Saudi',
      region: 'Timur Tengah',
      segment: 'Cosmetics',
      priority: 'P2',
      potential: 'Tier 2',
      owner: 'Rina',
      status: 'Exploring',
      researchNotes: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockPartners: Partner[] = [
    {
      id: 'p1',
      companyName: 'Saigon Trade Ltd',
      country: 'Vietnam',
      marketId: 'm1',
      segment: 'FMCG',
      contactName: 'Nguyen Van A',
      contactEmail: 'a@saigon.vn',
      owner: 'Budi',
      pipelineStage: 'Negotiation',
      scorecard: { financialStability: 4, distributionReach: 4, regulatoryCompliance: 4, marketReputation: 4 },
      notes: '',
      nextActivityDate: '2026-10-20',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'p2',
      companyName: 'Al-Madina Logistics',
      country: 'Arab Saudi',
      marketId: 'm2',
      segment: 'Cosmetics',
      contactName: 'Ahmed',
      contactEmail: 'ahmed@almadina.sa',
      owner: 'Rina',
      pipelineStage: 'Active',
      scorecard: { financialStability: 5, distributionReach: 5, regulatoryCompliance: 5, marketReputation: 5 },
      notes: '',
      nextActivityDate: '2026-10-22',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 'a1',
      type: 'Meeting',
      title: 'Review kontrak',
      dueDate: '2026-10-10', // overdue compared to 2026-10-17
      status: 'Pending',
      relatedMarketId: 'm1',
      relatedPartnerId: 'p1',
      owner: 'Budi',
      notes: '',
      createdAt: '2026-10-01',
    },
    {
      id: 'a2',
      type: 'Call',
      title: 'Follow-up distributor',
      dueDate: '2026-10-20',
      status: 'Pending',
      relatedMarketId: 'm2',
      relatedPartnerId: 'p2',
      owner: 'Rina',
      notes: '',
      createdAt: '2026-10-01',
    },
  ];

  const metrics = calculateDashboardMetrics(mockMarkets, mockPartners, mockActivities, '2026-10-17');
  assert.equal(metrics.totalMarkets, 2);
  assert.equal(metrics.activeMarketsCount, 1);
  assert.equal(metrics.exploringMarketsCount, 1);
  assert.equal(metrics.totalPartners, 2);
  assert.equal(metrics.activePartnersCount, 1);
  assert.equal(metrics.inPipelinePartners, 1);
  assert.equal(metrics.dueDiligenceOrNegCount, 1);
  assert.equal(metrics.overdueActivitiesCount, 1);
  assert.equal(metrics.priorityBreakdown.P1, 1);
  assert.equal(metrics.priorityBreakdown.P2, 1);
});

test('formatDateId formats YYYY-MM-DD into readable Indonesian format', () => {
  assert.equal(formatDateId('2026-10-17'), '17 Okt 2026');
  assert.equal(formatDateId('2026-01-05'), '5 Jan 2026');
  assert.equal(formatDateId(''), '-');
});

test('generateAgreementCode produces collision-free sequential codes', () => {
  const existing = ['AGR-2026-0001', 'AGR-2026-0002', 'AGR-2026-0005'];
  const next = generateAgreementCode(existing, 2026);
  assert.equal(next, 'AGR-2026-0006');

  // Empty list starts at 0001
  assert.equal(generateAgreementCode([], 2026), 'AGR-2026-0001');
});

test('getAgreementExpiryStatus computes urgency independently without modifying status', () => {
  const refDate = '2026-10-17';

  // Draft should be not_applicable
  const draftStatus = getAgreementExpiryStatus('2026-11-01', 'Draft', refDate);
  assert.equal(draftStatus.status, 'not_applicable');

  // Expired (past date)
  const expiredStatus = getAgreementExpiryStatus('2026-10-14', 'Signed / Active', refDate);
  assert.equal(expiredStatus.status, 'expired');
  assert.equal(expiredStatus.isWarning, true);

  // Expiring in 20 days (<= 30 days)
  const expiring30 = getAgreementExpiryStatus('2026-11-06', 'Signed / Active', refDate);
  assert.equal(expiring30.status, 'expiring_30');
  assert.equal(expiring30.isWarning, true);

  // Expiring in 50 days (<= 60 days)
  const expiring60 = getAgreementExpiryStatus('2026-12-06', 'Signed / Active', refDate);
  assert.equal(expiring60.status, 'expiring_60');
  assert.equal(expiring60.isWarning, true);

  // Expiring in 80 days (<= 90 days)
  const expiring90 = getAgreementExpiryStatus('2027-01-05', 'Signed / Active', refDate);
  assert.equal(expiring90.status, 'expiring_90');
  assert.equal(expiring90.isWarning, true);

  // Safe (> 90 days)
  const safeStatus = getAgreementExpiryStatus('2027-08-31', 'Signed / Active', refDate);
  assert.equal(safeStatus.status, 'safe');
  assert.equal(safeStatus.isWarning, false);
});

test('calculateAgreementMetrics computes breakdown accurately', () => {
  const mockAgreements: Agreement[] = [
    {
      id: 'a1',
      agreementCode: 'AGR-2026-0001',
      name: 'Kontrak 1',
      type: 'Distribution',
      partnerId: 'p1',
      marketIds: ['m1'],
      owner: 'Budi',
      productCategory: 'FMCG',
      territory: 'Vietnam',
      scopeNotes: '',
      isExclusive: true,
      currency: 'USD',
      annualSalesTarget: 1000000,
      paymentTerms: 'Net 30',
      marginDiscount: '30%',
      legalReviewStatus: 'Approved',
      financeReviewStatus: 'Approved',
      reviewChecklist: { commercialTermsApproved: true, complianceVerified: true, creditLimitApproved: true, disputeClauseAgreed: true },
      effectiveDate: '2026-01-01',
      endDate: '2027-08-31', // > 90 days (approx 318 days)
      noticePeriodDays: 30,
      renewalType: 'manual',
      version: 'v1.0',
      status: 'Signed / Active',
      timeline: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'a2',
      agreementCode: 'AGR-2026-0002',
      name: 'Kontrak 2',
      type: 'Reseller',
      partnerId: 'p2',
      marketIds: ['m2'],
      owner: 'Rina',
      productCategory: 'Beauty',
      territory: 'Filipina',
      scopeNotes: '',
      isExclusive: false,
      currency: 'USD',
      annualSalesTarget: 500000,
      paymentTerms: 'Net 45',
      marginDiscount: '25%',
      legalReviewStatus: 'Pending',
      financeReviewStatus: 'Not Started',
      reviewChecklist: { commercialTermsApproved: false, complianceVerified: false, creditLimitApproved: false, disputeClauseAgreed: false },
      effectiveDate: '2026-11-01',
      endDate: '2026-11-30', // < 90 days from 2026-10-17
      noticePeriodDays: 30,
      renewalType: 'manual',
      version: 'v1.0',
      status: 'Internal Review',
      timeline: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'a3',
      agreementCode: 'AGR-2026-0003',
      name: 'Kontrak 3',
      type: 'Pilot/MOU',
      partnerId: 'p3',
      marketIds: ['m3'],
      owner: 'Tariq',
      productCategory: 'Food',
      territory: 'Saudi',
      scopeNotes: '',
      isExclusive: false,
      currency: 'USD',
      annualSalesTarget: 300000,
      paymentTerms: 'Net 15',
      marginDiscount: '20%',
      legalReviewStatus: 'Approved',
      financeReviewStatus: 'Approved',
      reviewChecklist: { commercialTermsApproved: true, complianceVerified: true, creditLimitApproved: true, disputeClauseAgreed: true },
      effectiveDate: '2025-10-01',
      endDate: '2026-10-10', // past date
      noticePeriodDays: 30,
      renewalType: 'manual',
      version: 'v1.0',
      status: 'Expired',
      timeline: [],
      createdAt: '2025-10-01',
      updatedAt: '2026-10-11',
    },
  ];

  const metrics = calculateAgreementMetrics(mockAgreements, '2026-10-17');
  assert.equal(metrics.total, 3);
  assert.equal(metrics.draftOrReview, 1);
  assert.equal(metrics.signedActive, 1);
  assert.equal(metrics.expiringIn90Days, 1); // a2 ends 2026-11-30
  assert.equal(metrics.expiredOrTerminated, 1); // a3 is Expired
});

test('bilingual output for pipeline utilities', () => {
  // Scorecard tier
  assert.equal(getScorecardTier(85, 'id').label, 'Mitra Unggul');
  assert.equal(getScorecardTier(85, 'en').label, 'Top Tier Partner');
  assert.equal(getScorecardTier(65, 'en').label, 'Qualified');
  assert.equal(getScorecardTier(45, 'en').label, 'Needs Evaluation');

  // Date formatting
  assert.equal(formatDateId('2026-10-17', 'id'), '17 Okt 2026');
  assert.equal(formatDateId('2026-10-17', 'en'), 'Oct 17, 2026');
  assert.equal(formatDateId('2026-01-05', 'en'), 'Jan 5, 2026');

  // Agreement expiry status
  const refDate = '2026-10-17';
  const expiring30Id = getAgreementExpiryStatus('2026-11-06', 'Signed / Active', refDate, 'id');
  const expiring30En = getAgreementExpiryStatus('2026-11-06', 'Signed / Active', refDate, 'en');
  assert.match(expiring30Id.label, /Berakhir dlm \d+ hari/);
  assert.match(expiring30En.label, /Expires in \d+ days/);

  const expiredEn = getAgreementExpiryStatus('2026-10-10', 'Signed / Active', refDate, 'en');
  assert.equal(expiredEn.label, 'Expired (7 d ago)');
});


