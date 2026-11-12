import type {
  Activity,
  Agreement,
  IndustrySegment,
  Market,
  Partner,
  Training,
} from '../types/index.ts';
import { MASTER_COUNTRIES, type MasterCountry } from '../data/countryRegionDatabase.ts';

export interface FullDatabasePayload {
  meta: {
    product: string;
    version: string;
    schemaVersion: number;
    updatedAt: string;
  };
  markets: Market[];
  partners: Partner[];
  activities: Activity[];
  agreements: Agreement[];
  trainings: Training[];
  industrySegments: IndustrySegment[];
  countries?: MasterCountry[];
}

/**
 * Safely escapes a string or primitive value for SQL INSERT statements.
 */
export function escapeSqlString(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

/**
 * Generates a complete MySQL / MariaDB compatible SQL script containing
 * DDL table schemas and DML INSERT statements for all database entities and dummy data.
 */
export function generateMySqlDump(db: FullDatabasePayload): string {
  const countries = db.countries && db.countries.length > 0 ? db.countries : MASTER_COUNTRIES;
  const lines: string[] = [
    '-- ============================================================================',
    '-- Global Partner Expansion Hub (IBD Workspace) - Complete MySQL/MariaDB Dump',
    `-- Generated At: ${db.meta.updatedAt}`,
    '-- Compatible with cPanel phpMyAdmin (MySQL 5.7+ / 8.0+ & MariaDB 10.3+)',
    '-- ============================================================================',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
    '-- 1. Table: industry_segments',
    'CREATE TABLE IF NOT EXISTS `industry_segments` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `code` VARCHAR(64) NOT NULL,',
    '  `name` VARCHAR(255) NOT NULL,',
    '  `description` TEXT,',
    '  `target_audience` TEXT,',
    '  `is_active` TINYINT(1) NOT NULL DEFAULT 1,',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  `updated_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
  ];

  for (const seg of db.industrySegments) {
    lines.push(
      `INSERT INTO \`industry_segments\` (\`id\`, \`code\`, \`name\`, \`description\`, \`target_audience\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES (${escapeSqlString(seg.id)}, ${escapeSqlString(seg.code)}, ${escapeSqlString(seg.name)}, ${escapeSqlString(seg.description)}, ${escapeSqlString(seg.targetAudience)}, ${escapeSqlString(seg.isActive)}, ${escapeSqlString(seg.createdAt)}, ${escapeSqlString(seg.updatedAt)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`description\`=VALUES(\`description\`), \`is_active\`=VALUES(\`is_active\`), \`updated_at\`=VALUES(\`updated_at\`);`
    );
  }

  lines.push(
    '',
    '-- 2. Table: countries_master',
    'CREATE TABLE IF NOT EXISTS `countries_master` (',
    '  `code` VARCHAR(16) NOT NULL,',
    '  `name` VARCHAR(128) NOT NULL,',
    '  `atlas_name` VARCHAR(128) NOT NULL,',
    '  `region` VARCHAR(128) NOT NULL,',
    '  `time_zone` VARCHAR(128),',
    '  `default_currency` VARCHAR(16),',
    '  `coordinates_json` VARCHAR(64),',
    '  PRIMARY KEY (`code`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const c of countries) {
    lines.push(
      `INSERT INTO \`countries_master\` (\`code\`, \`name\`, \`atlas_name\`, \`region\`, \`time_zone\`, \`default_currency\`, \`coordinates_json\`) VALUES (${escapeSqlString(c.code)}, ${escapeSqlString(c.name)}, ${escapeSqlString(c.atlasName)}, ${escapeSqlString(c.region)}, ${escapeSqlString(c.timeZone)}, ${escapeSqlString(c.defaultCurrency)}, ${escapeSqlString(c.coordinates)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`region\`=VALUES(\`region\`), \`time_zone\`=VALUES(\`time_zone\`);`
    );
  }

  lines.push(
    '',
    '-- 3. Table: markets',
    'CREATE TABLE IF NOT EXISTS `markets` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `country` VARCHAR(128) NOT NULL,',
    '  `region` VARCHAR(128) NOT NULL,',
    '  `segment` VARCHAR(255) NOT NULL,',
    '  `priority` VARCHAR(16) NOT NULL,',
    '  `potential` VARCHAR(255) NOT NULL,',
    '  `owner` VARCHAR(128) NOT NULL,',
    '  `status` VARCHAR(64) NOT NULL,',
    '  `research_notes` TEXT,',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  `updated_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const m of db.markets) {
    lines.push(
      `INSERT INTO \`markets\` (\`id\`, \`country\`, \`region\`, \`segment\`, \`priority\`, \`potential\`, \`owner\`, \`status\`, \`research_notes\`, \`created_at\`, \`updated_at\`) VALUES (${escapeSqlString(m.id)}, ${escapeSqlString(m.country)}, ${escapeSqlString(m.region)}, ${escapeSqlString(m.segment)}, ${escapeSqlString(m.priority)}, ${escapeSqlString(m.potential)}, ${escapeSqlString(m.owner)}, ${escapeSqlString(m.status)}, ${escapeSqlString(m.researchNotes)}, ${escapeSqlString(m.createdAt)}, ${escapeSqlString(m.updatedAt)}) ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`priority\`=VALUES(\`priority\`), \`potential\`=VALUES(\`potential\`), \`research_notes\`=VALUES(\`research_notes\`), \`updated_at\`=VALUES(\`updated_at\`);`
    );
  }

  lines.push(
    '',
    '-- 4. Table: partners',
    'CREATE TABLE IF NOT EXISTS `partners` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `company_name` VARCHAR(255) NOT NULL,',
    '  `country` VARCHAR(128) NOT NULL,',
    '  `market_id` VARCHAR(64) NOT NULL,',
    '  `segment` VARCHAR(255) NOT NULL,',
    '  `authorized_products_json` JSON,',
    '  `contact_name` VARCHAR(128) NOT NULL,',
    '  `contact_email` VARCHAR(128) NOT NULL,',
    '  `owner` VARCHAR(128) NOT NULL,',
    '  `pipeline_stage` VARCHAR(64) NOT NULL,',
    '  `scorecard_json` JSON NOT NULL,',
    '  `notes` TEXT,',
    '  `next_activity_date` VARCHAR(32),',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  `updated_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const p of db.partners) {
    lines.push(
      `INSERT INTO \`partners\` (\`id\`, \`company_name\`, \`country\`, \`market_id\`, \`segment\`, \`authorized_products_json\`, \`contact_name\`, \`contact_email\`, \`owner\`, \`pipeline_stage\`, \`scorecard_json\`, \`notes\`, \`next_activity_date\`, \`created_at\`, \`updated_at\`) VALUES (${escapeSqlString(p.id)}, ${escapeSqlString(p.companyName)}, ${escapeSqlString(p.country)}, ${escapeSqlString(p.marketId)}, ${escapeSqlString(p.segment)}, ${escapeSqlString(p.authorizedProducts || [])}, ${escapeSqlString(p.contactName)}, ${escapeSqlString(p.contactEmail)}, ${escapeSqlString(p.owner)}, ${escapeSqlString(p.pipelineStage)}, ${escapeSqlString(p.scorecard)}, ${escapeSqlString(p.notes)}, ${escapeSqlString(p.nextActivityDate)}, ${escapeSqlString(p.createdAt)}, ${escapeSqlString(p.updatedAt)}) ON DUPLICATE KEY UPDATE \`pipeline_stage\`=VALUES(\`pipeline_stage\`), \`scorecard_json\`=VALUES(\`scorecard_json\`), \`notes\`=VALUES(\`notes\`), \`next_activity_date\`=VALUES(\`next_activity_date\`), \`updated_at\`=VALUES(\`updated_at\`);`
    );
  }

  lines.push(
    '',
    '-- 5. Table: activities',
    'CREATE TABLE IF NOT EXISTS `activities` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `type` VARCHAR(64) NOT NULL,',
    '  `title` VARCHAR(255) NOT NULL,',
    '  `due_date` VARCHAR(32) NOT NULL,',
    '  `status` VARCHAR(32) NOT NULL,',
    '  `related_market_id` VARCHAR(64),',
    '  `related_partner_id` VARCHAR(64),',
    '  `related_agreement_id` VARCHAR(64),',
    '  `owner` VARCHAR(128) NOT NULL,',
    '  `notes` TEXT,',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const a of db.activities) {
    lines.push(
      `INSERT INTO \`activities\` (\`id\`, \`type\`, \`title\`, \`due_date\`, \`status\`, \`related_market_id\`, \`related_partner_id\`, \`related_agreement_id\`, \`owner\`, \`notes\`, \`created_at\`) VALUES (${escapeSqlString(a.id)}, ${escapeSqlString(a.type)}, ${escapeSqlString(a.title)}, ${escapeSqlString(a.dueDate)}, ${escapeSqlString(a.status)}, ${escapeSqlString(a.relatedMarketId || null)}, ${escapeSqlString(a.relatedPartnerId || null)}, ${escapeSqlString(a.relatedAgreementId || null)}, ${escapeSqlString(a.owner)}, ${escapeSqlString(a.notes)}, ${escapeSqlString(a.createdAt)}) ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`due_date\`=VALUES(\`due_date\`), \`notes\`=VALUES(\`notes\`);`
    );
  }

  lines.push(
    '',
    '-- 6. Table: agreements',
    'CREATE TABLE IF NOT EXISTS `agreements` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `agreement_code` VARCHAR(64) NOT NULL,',
    '  `name` VARCHAR(255) NOT NULL,',
    '  `type` VARCHAR(64) NOT NULL,',
    '  `partner_id` VARCHAR(64) NOT NULL,',
    '  `market_ids_json` JSON NOT NULL,',
    '  `owner` VARCHAR(128) NOT NULL,',
    '  `product_category` VARCHAR(255) NOT NULL,',
    '  `territory` VARCHAR(255) NOT NULL,',
    '  `is_exclusive` TINYINT(1) NOT NULL DEFAULT 0,',
    '  `currency` VARCHAR(16) NOT NULL,',
    '  `annual_sales_target` DECIMAL(18,2) NOT NULL DEFAULT 0,',
    '  `payment_terms` VARCHAR(128),',
    '  `margin_discount` VARCHAR(128),',
    '  `incoterms` VARCHAR(32),',
    '  `status` VARCHAR(64) NOT NULL,',
    '  `signing_date` VARCHAR(32),',
    '  `effective_date` VARCHAR(32) NOT NULL,',
    '  `end_date` VARCHAR(32) NOT NULL,',
    '  `details_json` JSON NOT NULL,',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  `updated_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const agr of db.agreements) {
    lines.push(
      `INSERT INTO \`agreements\` (\`id\`, \`agreement_code\`, \`name\`, \`type\`, \`partner_id\`, \`market_ids_json\`, \`owner\`, \`product_category\`, \`territory\`, \`is_exclusive\`, \`currency\`, \`annual_sales_target\`, \`payment_terms\`, \`margin_discount\`, \`incoterms\`, \`status\`, \`signing_date\`, \`effective_date\`, \`end_date\`, \`details_json\`, \`created_at\`, \`updated_at\`) VALUES (${escapeSqlString(agr.id)}, ${escapeSqlString(agr.agreementCode)}, ${escapeSqlString(agr.name)}, ${escapeSqlString(agr.type)}, ${escapeSqlString(agr.partnerId)}, ${escapeSqlString(agr.marketIds)}, ${escapeSqlString(agr.owner)}, ${escapeSqlString(agr.productCategory)}, ${escapeSqlString(agr.territory)}, ${escapeSqlString(agr.isExclusive)}, ${escapeSqlString(agr.currency)}, ${escapeSqlString(agr.annualSalesTarget)}, ${escapeSqlString(agr.paymentTerms)}, ${escapeSqlString(agr.marginDiscount)}, ${escapeSqlString(agr.incoterms || null)}, ${escapeSqlString(agr.status)}, ${escapeSqlString(agr.signingDate || null)}, ${escapeSqlString(agr.effectiveDate)}, ${escapeSqlString(agr.endDate)}, ${escapeSqlString(agr)}, ${escapeSqlString(agr.createdAt)}, ${escapeSqlString(agr.updatedAt)}) ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`details_json\`=VALUES(\`details_json\`), \`updated_at\`=VALUES(\`updated_at\`);`
    );
  }

  lines.push(
    '',
    '-- 7. Table: trainings',
    'CREATE TABLE IF NOT EXISTS `trainings` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `title` VARCHAR(255) NOT NULL,',
    '  `category` VARCHAR(128) NOT NULL,',
    '  `mode` VARCHAR(64) NOT NULL,',
    '  `status` VARCHAR(64) NOT NULL,',
    '  `partner_id` VARCHAR(64) NOT NULL,',
    '  `market_id` VARCHAR(64),',
    '  `trainer` VARCHAR(128) NOT NULL,',
    '  `scheduled_date` VARCHAR(32) NOT NULL,',
    '  `duration_hours` DECIMAL(6,2) NOT NULL DEFAULT 1,',
    '  `participant_count` INT NOT NULL DEFAULT 0,',
    '  `meeting_link` VARCHAR(255),',
    '  `notes` TEXT,',
    '  `created_at` VARCHAR(32) NOT NULL,',
    '  `updated_at` VARCHAR(32) NOT NULL,',
    '  PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    ''
  );

  for (const t of db.trainings) {
    lines.push(
      `INSERT INTO \`trainings\` (\`id\`, \`title\`, \`category\`, \`mode\`, \`status\`, \`partner_id\`, \`market_id\`, \`trainer\`, \`scheduled_date\`, \`duration_hours\`, \`participant_count\`, \`meeting_link\`, \`notes\`, \`created_at\`, \`updated_at\`) VALUES (${escapeSqlString(t.id)}, ${escapeSqlString(t.title)}, ${escapeSqlString(t.category)}, ${escapeSqlString(t.mode)}, ${escapeSqlString(t.status)}, ${escapeSqlString(t.partnerId)}, ${escapeSqlString(t.marketId || null)}, ${escapeSqlString(t.trainer)}, ${escapeSqlString(t.scheduledDate)}, ${escapeSqlString(t.durationHours)}, ${escapeSqlString(t.participantCount)}, ${escapeSqlString(t.meetingLink || null)}, ${escapeSqlString(t.notes || null)}, ${escapeSqlString(t.createdAt)}, ${escapeSqlString(t.updatedAt)}) ON DUPLICATE KEY UPDATE \`status\`=VALUES(\`status\`), \`participant_count\`=VALUES(\`participant_count\`), \`updated_at\`=VALUES(\`updated_at\`);`
    );
  }

  lines.push('', 'SET FOREIGN_KEY_CHECKS = 1;', '-- End of SQL Dump', '');
  return lines.join('\n');
}
