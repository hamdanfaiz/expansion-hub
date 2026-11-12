import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  generateCombinedMarketPartnerCsv,
  generateIndustrySegmentsCsv,
  generateMarketsOnlyCsv,
  generatePartnersOnlyCsv,
} from './exportDashboardCsv.ts';
import type { Market, Partner } from '../types/index.ts';

const mockMarkets: Market[] = [
  {
    id: 'mkt-test-1',
    country: 'Vietnam',
    region: 'Asia Tenggara',
    segment: 'FMCG',
    priority: 'P1',
    potential: '$12M TAM',
    owner: 'Budi Santoso',
    status: 'Active',
    researchNotes: 'Catatan pasar dengan koma, dan kutip "ganda"',
    createdAt: '2026-05-10',
    updatedAt: '2026-10-12',
  },
];

const mockPartners: Partner[] = [
  {
    id: 'ptr-test-1',
    companyName: 'Saigon Apex =1+2',
    country: 'Vietnam',
    marketId: 'mkt-test-1',
    segment: 'FMCG',
    contactName: 'Nguyen Van Minh',
    contactEmail: 'minh@saigonapex.vn',
    contactPhone: '+84 28 3822 9100',
    owner: 'Budi Santoso',
    pipelineStage: 'Negotiation',
    scorecard: {
      financialStability: 5,
      distributionReach: 4,
      regulatoryCompliance: 4,
      marketReputation: 5,
    },
    notes: 'Prioritas tinggi @Rina',
    nextActivityDate: '2026-10-19',
    createdAt: '2026-08-10',
    updatedAt: '2026-10-16',
  },
];

test('escapeCsvCell escapes quotes and handles special values', () => {
  assert.equal(escapeCsvCell('Normal Text'), '"Normal Text"');
  assert.equal(escapeCsvCell('Text with "quotes"'), '"Text with ""quotes"""');
  assert.equal(escapeCsvCell(null), '""');
  assert.equal(escapeCsvCell(undefined), '""');
});

test('escapeCsvCell mitigates formula injection starting with =, +, -, @', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A5)'), '"\'=SUM(A1:A5)"');
  assert.equal(escapeCsvCell('+44 1234 5678'), '"\'+44 1234 5678"');
  assert.equal(escapeCsvCell('-123'), '"\'-123"');
  assert.equal(escapeCsvCell('@mention'), '"\'@mention"');
});

test('generateCombinedMarketPartnerCsv includes BOM, headers, markets and partners', () => {
  const csv = generateCombinedMarketPartnerCsv(mockMarkets, mockPartners);
  assert.ok(csv.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
  assert.ok(csv.includes('"Tipe Entitas"'), 'Must contain Tipe Entitas header');
  assert.ok(csv.includes('"Market"'), 'Must contain Market row');
  assert.ok(csv.includes('"Partner"'), 'Must contain Partner row');
  assert.ok(csv.includes('"Vietnam"'), 'Must contain country');
  assert.ok(csv.includes('"90%"'), 'Must compute partner scorecard average (18/20 = 90%)');
});

test('generateMarketsOnlyCsv generates accurate market columns', () => {
  const csv = generateMarketsOnlyCsv(mockMarkets);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"ID Pasar"'));
  assert.ok(csv.includes('"mkt-test-1"'));
  assert.ok(csv.includes('"Catatan pasar dengan koma, dan kutip ""ganda"""'));
});

test('generatePartnersOnlyCsv generates partner columns with linked market name', () => {
  const csv = generatePartnersOnlyCsv(mockPartners, mockMarkets);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"ID Mitra"'));
  assert.ok(csv.includes('"Vietnam (mkt-test-1)"'));
  assert.ok(csv.includes('"minh@saigonapex.vn"'));
});

test('generateIndustrySegmentsCsv exports master segments with usage stats', () => {
  const mockSegments: import('../types/index.ts').IndustrySegment[] = [
    {
      id: 'seg-1',
      code: 'SEG-FMCG',
      name: 'FMCG',
      description: 'Consumer goods',
      targetAudience: 'Modern trade',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];
  const csv = generateIndustrySegmentsCsv(mockSegments, mockMarkets, mockPartners);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Kode Segmen"'));
  assert.ok(csv.includes('"SEG-FMCG"'));
  assert.ok(csv.includes('"FMCG"'));
  assert.ok(csv.includes('"Aktif"'));
  assert.ok(csv.includes('"1"')); // marketCount & partnerCount
});
