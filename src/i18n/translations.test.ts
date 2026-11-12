import test from 'node:test';
import assert from 'node:assert/strict';
import { getTranslation, TRANSLATIONS, type Language } from './translations';

test('getTranslation returns accurate translation for ID and EN', () => {
  assert.equal(getTranslation('id', 'header.btn.createNew'), 'Buat Baru');
  assert.equal(getTranslation('en', 'header.btn.createNew'), 'Create New');
  assert.equal(getTranslation('id', 'dashboard.title'), 'Workspace Overview');
  assert.equal(getTranslation('en', 'clock.status.working'), 'In Business Hours');
});

test('getTranslation falls back gracefully when key missing', () => {
  assert.equal(getTranslation('en', 'non.existent.key', 'Default Value'), 'Default Value');
});

test('both languages have identical primary key sets', () => {
  const idKeys = Object.keys(TRANSLATIONS.id).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  assert.deepEqual(idKeys, enKeys);
});
