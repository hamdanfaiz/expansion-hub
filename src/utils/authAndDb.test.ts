import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyCredentials,
  createSessionToken,
  verifySessionToken,
} from './authToken.ts';
import {
  escapeSqlString,
  generateMySqlDump,
  type FullDatabasePayload,
} from './sqlExport.ts';
import {
  INITIAL_ACTIVITIES,
  INITIAL_AGREEMENTS,
  INITIAL_INDUSTRY_SEGMENTS,
  INITIAL_MARKETS,
  INITIAL_PARTNERS,
  INITIAL_TRAININGS,
} from '../data/seedData.ts';
import { MASTER_COUNTRIES } from '../data/countryRegionDatabase.ts';

test('verifyCredentials validates primary APP_USERNAME and APP_PASSWORD from environment', () => {
  const customEnv = {
    APP_USERNAME: 'ibd_director',
    APP_PASSWORD: 'MySuperSecretPassword#99',
    APP_USER_NAME: 'Faiz Director',
    APP_USER_ROLE: 'VP International Expansion',
  };

  // Wrong password
  assert.equal(verifyCredentials('ibd_director', 'wrongpass', customEnv), null);
  // Wrong username
  assert.equal(verifyCredentials('admin', 'MySuperSecretPassword#99', customEnv), null);
  // Empty credentials
  assert.equal(verifyCredentials('', '', customEnv), null);

  // Valid match (case-insensitive username, exact password)
  const matched = verifyCredentials('IBD_Director', 'MySuperSecretPassword#99', customEnv);
  assert.deepEqual(matched, {
    username: 'ibd_director',
    displayName: 'Faiz Director',
    role: 'VP International Expansion',
  });
});

test('verifyCredentials supports multi-user APP_USERS environment variable', () => {
  const env = {
    APP_USERNAME: 'admin',
    APP_PASSWORD: 'AdminPassword1!',
    APP_USERS: 'rina:RinaPass22:Rina Wijaya:Regional Manager,tariq:TariqPass33:Tariq Al-Mansoor:MENA Lead',
  };

  const rina = verifyCredentials('rina', 'RinaPass22', env);
  assert.deepEqual(rina, {
    username: 'rina',
    displayName: 'Rina Wijaya',
    role: 'Regional Manager',
  });

  const tariq = verifyCredentials('tariq', 'TariqPass33', env);
  assert.deepEqual(tariq, {
    username: 'tariq',
    displayName: 'Tariq Al-Mansoor',
    role: 'MENA Lead',
  });
});

test('createSessionToken and verifySessionToken sign and validate stateless HMAC tokens', () => {
  const secret = 'test-cpanel-node-secret-999';
  const user = {
    username: 'admin',
    displayName: 'Budi Santoso',
    role: 'Lead International BD',
  };

  const token = createSessionToken(user, secret, 3600);
  const verified = verifySessionToken(token, secret);
  assert.ok(verified);
  assert.equal(verified.username, 'admin');
  assert.equal(verified.displayName, 'Budi Santoso');

  // Tampered signature must fail
  assert.equal(verifySessionToken(`${token}tampered`, secret), null);
  // Wrong secret must fail
  assert.equal(verifySessionToken(token, 'wrong-secret'), null);
  // Expired token must fail
  const futureSec = Math.floor(Date.now() / 1000) + 7200;
  assert.equal(verifySessionToken(token, secret, futureSec), null);
});

test('generateMySqlDump produces complete DDL and DML statements with all dummy data', () => {
  assert.equal(escapeSqlString("O'Reilly & Co"), "'O\\'Reilly & Co'");
  assert.equal(escapeSqlString(true), '1');
  assert.equal(escapeSqlString(null), 'NULL');

  const payload: FullDatabasePayload = {
    meta: {
      product: 'Global Partner Expansion Hub',
      version: '1.0.0',
      schemaVersion: 1,
      updatedAt: '2026-11-08T00:00:00Z',
    },
    markets: INITIAL_MARKETS,
    partners: INITIAL_PARTNERS,
    activities: INITIAL_ACTIVITIES,
    agreements: INITIAL_AGREEMENTS,
    trainings: INITIAL_TRAININGS,
    industrySegments: INITIAL_INDUSTRY_SEGMENTS,
    countries: MASTER_COUNTRIES,
  };

  const sql = generateMySqlDump(payload);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `markets`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `partners`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `activities`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `agreements`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `trainings`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `industry_segments`/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS `countries_master`/);
  assert.match(sql, /INSERT INTO `markets`/);
  assert.match(sql, /INSERT INTO `partners`/);
  assert.match(sql, /Vietnam/);
});
