import type { IndustrySegment, Market, Partner } from '../types/index.ts';
import { calculateAverageScore } from './pipeline.ts';

/**
 * Escapes a cell value for CSV formatting, adhering to RFC 4180
 * and preventing formula injection attacks in spreadsheet tools.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);
  // Protect against CSV formula injection in spreadsheet applications (=, +, -, @, tab, cr)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates a comprehensive combined CSV of Market and Partner records.
 */
export function generateCombinedMarketPartnerCsv(
  markets: Market[],
  partners: Partner[]
): string {
  const marketMap = new Map(markets.map((m) => [m.id, m]));
  const rows: string[][] = [
    [
      'Tipe Entitas',
      'ID',
      'Nama / Perusahaan',
      'Negara',
      'Wilayah',
      'Segmen Produk',
      'Status / Tahap Pipeline',
      'Prioritas Pasar',
      'Potensi Pasar (TAM)',
      'Nama Kontak Utama',
      'Email Kontak',
      'Telepon',
      'Skor Kemitraan (%)',
      'PIC Internal (Owner)',
      'Aktivitas Berikutnya',
      'Catatan',
      'Terakhir Diperbarui',
    ],
  ];

  // 1. Markets
  markets.forEach((m) => {
    rows.push([
      'Market',
      m.id,
      m.country,
      m.country,
      m.region,
      m.segment,
      m.status,
      m.priority,
      m.potential,
      '-',
      '-',
      '-',
      '-',
      m.owner,
      '-',
      m.researchNotes,
      m.updatedAt,
    ]);
  });

  // 2. Partners
  partners.forEach((p) => {
    const linkedMarket = marketMap.get(p.marketId);
    const score = calculateAverageScore(p.scorecard);
    rows.push([
      'Partner',
      p.id,
      p.companyName,
      p.country,
      linkedMarket?.region || '-',
      p.segment,
      p.pipelineStage,
      linkedMarket?.priority || '-',
      linkedMarket?.potential || '-',
      p.contactName || '-',
      p.contactEmail || '-',
      p.contactPhone || '-',
      `${score}%`,
      p.owner,
      p.nextActivityDate || '-',
      p.notes,
      p.updatedAt,
    ]);
  });

  // UTF-8 BOM so Excel, Google Sheets, & Numbers interpret Indonesian text properly
  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates a detailed CSV dedicated solely to Market records.
 */
export function generateMarketsOnlyCsv(markets: Market[]): string {
  const rows: string[][] = [
    [
      'ID Pasar',
      'Negara',
      'Wilayah Geografis',
      'Segmen Produk',
      'Tingkat Prioritas',
      'Potensi Pasar (TAM)',
      'Status Operasional',
      'PIC Internal (Owner)',
      'Catatan Riset Pasar',
      'Tanggal Dibuat',
      'Tanggal Diperbarui',
    ],
  ];

  markets.forEach((m) => {
    rows.push([
      m.id,
      m.country,
      m.region,
      m.segment,
      m.priority,
      m.potential,
      m.status,
      m.owner,
      m.researchNotes,
      m.createdAt,
      m.updatedAt,
    ]);
  });

  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates a detailed CSV dedicated solely to Partner records with scorecard breakdown.
 */
export function generatePartnersOnlyCsv(partners: Partner[], markets: Market[]): string {
  const marketMap = new Map(markets.map((m) => [m.id, m]));
  const rows: string[][] = [
    [
      'ID Mitra',
      'Nama Perusahaan',
      'Negara',
      'Pasar Terkait',
      'Wilayah',
      'Segmen Industri',
      'Tahap Pipeline',
      'Nama Kontak Utama',
      'Email Kontak',
      'Telepon',
      'Stabilitas Finansial (1-5)',
      'Jangkauan Distribusi (1-5)',
      'Kepatuhan Regulasi (1-5)',
      'Reputasi Pasar (1-5)',
      'Rata-rata Skor (%)',
      'PIC Internal (Owner)',
      'Jadwal Aktivitas Berikutnya',
      'Catatan Kemitraan',
      'Tanggal Dibuat',
      'Tanggal Diperbarui',
    ],
  ];

  partners.forEach((p) => {
    const linkedMarket = marketMap.get(p.marketId);
    const score = calculateAverageScore(p.scorecard);
    rows.push([
      p.id,
      p.companyName,
      p.country,
      linkedMarket ? `${linkedMarket.country} (${linkedMarket.id})` : p.marketId,
      linkedMarket?.region || '-',
      p.segment,
      p.pipelineStage,
      p.contactName,
      p.contactEmail,
      p.contactPhone || '-',
      String(p.scorecard?.financialStability || 0),
      String(p.scorecard?.distributionReach || 0),
      String(p.scorecard?.regulatoryCompliance || 0),
      String(p.scorecard?.marketReputation || 0),
      `${score}%`,
      p.owner,
      p.nextActivityDate || '-',
      p.notes,
      p.createdAt,
      p.updatedAt,
    ]);
  });

  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates an export-ready CSV for master industry segments with usage counts.
 */
export function generateIndustrySegmentsCsv(
  segments: IndustrySegment[],
  markets: Market[] = [],
  partners: Partner[] = []
): string {
  const rows: string[][] = [
    [
      'ID',
      'Kode Segmen',
      'Nama Segmen Industri',
      'Status Operasional',
      'Target Audiens & Saluran',
      'Jumlah Pasar Terkait',
      'Jumlah Mitra Terkait',
      'Deskripsi & Cakupan Komoditas',
      'Tanggal Dibuat',
      'Terakhir Diperbarui',
    ],
  ];

  segments.forEach((seg) => {
    const marketCount = markets.filter(
      (m) =>
        m.segment?.toLowerCase() === seg.name.toLowerCase() ||
        m.segment?.toLowerCase() === seg.code.toLowerCase()
    ).length;
    const partnerCount = partners.filter(
      (p) =>
        p.segment?.toLowerCase() === seg.name.toLowerCase() ||
        p.segment?.toLowerCase() === seg.code.toLowerCase()
    ).length;

    rows.push([
      seg.id,
      seg.code,
      seg.name,
      seg.isActive ? 'Aktif' : 'Non-Aktif',
      seg.targetAudience,
      String(marketCount),
      String(partnerCount),
      seg.description,
      seg.createdAt,
      seg.updatedAt,
    ]);
  });

  return '\uFEFF' + rows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Triggers a browser file download of CSV content with proper UTF-8 charset.
 */
export function downloadCsvFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
