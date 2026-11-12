import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPartsInTimezone,
  getPartnerBusinessStatus,
  getActivePartnerCountryClocks,
} from './worldClock';
import type { Partner } from '../types';

test('getPartsInTimezone resolves valid numeric parts', () => {
  const d = new Date('2026-11-06T10:30:00Z');
  const tokyo = getPartsInTimezone(d, 'Asia/Tokyo'); // UTC+9 -> 19:30
  assert.equal(tokyo.hour, 19);
  assert.equal(tokyo.minute, 30);
  assert.equal(tokyo.dayOfWeek, 5); // Friday
});

test('getPartnerBusinessStatus detects working hours', () => {
  // 14:00 in Tokyo (05:00 UTC) on Friday Nov 6, 2026
  const d = new Date('2026-11-06T05:00:00Z');
  const status = getPartnerBusinessStatus('Jepang', d);
  assert.equal(status.category, 'working');
  assert.equal(status.isCurrentlyWorking, true);
  assert.equal(status.formattedTime, '14:00');
});

test('getPartnerBusinessStatus detects deep night', () => {
  // 02:00 in Tokyo (17:00 UTC previous day)
  const d = new Date('2026-11-05T17:00:00Z');
  const status = getPartnerBusinessStatus('Jepang', d);
  assert.equal(status.category, 'deep_night');
  assert.equal(status.isCurrentlyWorking, false);
});

test('getPartnerBusinessStatus detects weekend in Saudi Arabia (Friday is off)', () => {
  // Friday 10:00 in Riyadh (07:00 UTC) -> Friday is weekend for Saudi workDays: [0,1,2,3,4]
  const d = new Date('2026-11-06T07:00:00Z'); // Friday
  const status = getPartnerBusinessStatus('Arab Saudi', d);
  assert.equal(status.category, 'weekend');
  assert.equal(status.isCurrentlyWorking, false);
});

test('getActivePartnerCountryClocks aggregates partner countries', () => {
  const mockPartners: Partner[] = [
    {
      id: 'p1',
      companyName: 'Mekong Pharma',
      country: 'Vietnam',
      marketId: 'm1',
      segment: 'Farmasi & Suplemen',
      contactName: 'Nguyen Van A',
      contactEmail: 'a@mekong.vn',
      owner: 'Budi Santoso',
      pipelineStage: 'Qualified',
      scorecard: { distributionReach: 4, regulatoryCompliance: 5, financialStability: 4, marketReputation: 4 },
      notes: 'Good',
      nextActivityDate: '2026-11-10',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'p2',
      companyName: 'Tokyo Med',
      country: 'Jepang',
      marketId: 'm2',
      segment: 'Alat Kesehatan',
      contactName: 'Kenji Sato',
      contactEmail: 'kenji@tokyomed.jp',
      owner: 'Budi Santoso',
      pipelineStage: 'Active',
      scorecard: { distributionReach: 5, regulatoryCompliance: 5, financialStability: 5, marketReputation: 5 },
      notes: 'Exclusive',
      nextActivityDate: '2026-11-12',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const result = getActivePartnerCountryClocks(mockPartners, new Date('2026-11-06T03:00:00Z'));
  assert.equal(result.totalCountries, 2);
  assert.equal(result.countries.length, 2);
});
