import { z } from 'zod';
import type { FullDatabasePayload } from './sqlExport.ts';

const text = z.string().max(20000);
const short = z.string().max(500);
const required = short.min(1);
const id = z.string().min(1).max(128);
const reference = z.string().max(128);
const date = z.string().max(40).refine((value) => value === '' || Number.isFinite(Date.parse(value)), 'Invalid date');
const timestamps = { createdAt: date, updatedAt: date };
const stage = z.enum(['Target found', 'Contacted', 'Qualified', 'Due diligence', 'Negotiation', 'Agreement', 'Onboarding', 'Active', 'On hold', 'Rejected', 'Closed / Lost']);
const agreementStatus = z.enum(['Draft', 'Internal Review', 'Partner Review', 'Negotiation', 'Signed / Active', 'Expired', 'Terminated']);
const reviewStatus = z.enum(['Not Started', 'Pending', 'Approved', 'Revision Required']);
const score = z.number().int().min(1).max(5);

export const marketSchema = z.object({
  id, country: required, region: short, segment: short, priority: z.enum(['P1', 'P2', 'P3']),
  potential: text, owner: short, status: z.enum(['Exploring', 'Active', 'On Hold', 'Closed']), researchNotes: text, ...timestamps,
}).strict();
export const partnerSchema = z.object({
  id, companyName: required, country: required, marketId: id, segment: short, contactName: short,
  contactEmail: z.string().max(320).refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Invalid email'),
  contactPhone: short.optional(), owner: short, pipelineStage: stage,
  scorecard: z.object({ financialStability: score, distributionReach: score, regulatoryCompliance: score, marketReputation: score, notes: text.optional() }).strict(),
  authorizedProducts: z.array(z.object({ id, productCategory: short, authorityType: z.enum(['Exclusive', 'Non-Exclusive', 'Co-Exclusive', 'Pilot / Trial']), territoryScope: short.optional(), notes: text.optional() }).strict()).max(200).optional(),
  notes: text, nextActivityDate: date, ...timestamps,
}).strict();
export const activitySchema = z.object({
  id, type: z.enum(['Meeting', 'Call', 'Email', 'Due Diligence', 'Site Visit', 'Contract Review', 'Follow-up']),
  title: required, dueDate: date, status: z.enum(['Pending', 'Completed', 'Overdue', 'Cancelled']),
  relatedMarketId: reference, relatedPartnerId: reference, relatedAgreementId: reference.optional(), owner: short, notes: text, createdAt: date,
}).strict();
export const agreementSchema = z.object({
  id, agreementCode: required, name: required, type: z.enum(['Distribution', 'Exclusive Distribution', 'Reseller', 'Agency', 'Pilot/MOU', 'Other']),
  partnerId: id, marketIds: z.array(id).max(300), owner: short, productCategory: short, territory: short, scopeNotes: text, isExclusive: z.boolean(),
  currency: short, annualSalesTarget: z.number().nonnegative().max(1e15), paymentTerms: text, marginDiscount: short, incoterms: short.optional(),
  legalReviewer: short.optional(), legalReviewStatus: reviewStatus, financeReviewer: short.optional(), financeReviewStatus: reviewStatus,
  reviewChecklist: z.object({ commercialTermsApproved: z.boolean(), complianceVerified: z.boolean(), creditLimitApproved: z.boolean(), disputeClauseAgreed: z.boolean() }).strict(),
  signingDate: date.optional(), effectiveDate: date, endDate: date, noticePeriodDays: z.number().int().nonnegative().max(36500),
  renewalType: z.enum(['manual', 'automatic']), version: short, documentRef: text.optional(), status: agreementStatus, internalNotes: text.optional(),
  timeline: z.array(z.object({ id, timestamp: date, author: short, action: short, note: text.optional(), previousStatus: agreementStatus.optional(), newStatus: agreementStatus.optional() }).strict()).max(10000),
  ...timestamps,
}).strict();
export const trainingSchema = z.object({
  id, title: required, category: z.enum(['Product', 'Sales & Channel', 'Operations', 'Regulatory', 'Marketing', 'Other']), partnerId: id, marketId: reference.optional(),
  scheduledDate: date, durationHours: z.number().nonnegative().max(10000), mode: z.enum(['Online', 'On-site', 'Hybrid']), trainer: short,
  status: z.enum(['Planned', 'In Progress', 'Completed', 'Cancelled']), participantCount: z.number().int().nonnegative().max(1e7),
  meetingLink: text.optional(), notes: text.optional(), ...timestamps,
}).strict();
export const industrySegmentSchema = z.object({ id, code: required, name: required, description: text, targetAudience: text, isActive: z.boolean(), ...timestamps }).strict();

export const databaseWriteSchema = z.object({
  markets: z.array(marketSchema).max(10000), partners: z.array(partnerSchema).max(10000), activities: z.array(activitySchema).max(30000),
  agreements: z.array(agreementSchema).max(10000), trainings: z.array(trainingSchema).max(10000), industrySegments: z.array(industrySegmentSchema).max(1000),
}).strict().superRefine((db, ctx) => {
  const ids = Object.fromEntries(Object.entries(db).map(([key, records]) => [key, new Set(records.map((record) => record.id))]));
  for (const [key, records] of Object.entries(db)) {
    const seen = new Set<string>();
    records.forEach((record, index) => {
      if (seen.has(record.id)) ctx.addIssue({ code: 'custom', path: [key, index, 'id'], message: 'Duplicate record ID' });
      seen.add(record.id);
    });
  }
  const check = (collection: string, index: number, field: string, value: string | undefined, target: string) => {
    if (value && !ids[target].has(value)) ctx.addIssue({ code: 'custom', path: [collection, index, field], message: `Unknown ${target} reference` });
  };
  db.partners.forEach((p, i) => check('partners', i, 'marketId', p.marketId, 'markets'));
  db.agreements.forEach((a, i) => { check('agreements', i, 'partnerId', a.partnerId, 'partners'); a.marketIds.forEach((m) => check('agreements', i, 'marketIds', m, 'markets')); });
  db.activities.forEach((a, i) => { check('activities', i, 'relatedMarketId', a.relatedMarketId, 'markets'); check('activities', i, 'relatedPartnerId', a.relatedPartnerId, 'partners'); check('activities', i, 'relatedAgreementId', a.relatedAgreementId, 'agreements'); });
  db.trainings.forEach((t, i) => { check('trainings', i, 'partnerId', t.partnerId, 'partners'); check('trainings', i, 'marketId', t.marketId, 'markets'); });
});

export type DatabaseWritePayload = z.infer<typeof databaseWriteSchema>;
export type StoredDatabasePayload = Omit<FullDatabasePayload, 'meta'> & {
  meta: FullDatabasePayload['meta'] & { revision: number };
};

export function getDatabaseCollections(db: FullDatabasePayload): DatabaseWritePayload {
  return databaseWriteSchema.parse({ markets: db.markets, partners: db.partners, activities: db.activities, agreements: db.agreements, trainings: db.trainings, industrySegments: db.industrySegments });
}
