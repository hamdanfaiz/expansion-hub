/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getMasterCountry,
  getTimezoneForCountry,
  getWorkDaysForCountry,
} from '../data/countryRegionDatabase';
import type { Partner } from '../types';

export type BusinessHoursCategory =
  | 'working' // 🟢 Sedang Jam Kerja (e.g. 09:00 - 17:00)
  | 'lunch' // 🟡 Istirahat Siang (e.g. 12:00 - 13:00)
  | 'opening_soon' // 🟠 Pagi / Menjelang Buka (e.g. 07:30 - 09:00)
  | 'closing_soon' // 🟡 Sore / Menjelang Tutup (e.g. 17:00 - 18:00)
  | 'after_hours' // 🌙 Di Luar Jam Kantor / Malam (e.g. 18:00 - 22:00)
  | 'deep_night' // 💤 Tengah Malam / Dini Hari (e.g. 22:00 - 07:30)
  | 'weekend'; // 🏖️ Akhir Pekan / Libur Kerja

export interface PartnerBusinessStatus {
  category: BusinessHoursCategory;
  label: string;
  badgeClass: string;
  dotColor: string;
  iconType: 'sun' | 'moon' | 'coffee' | 'clock' | 'calendar';
  isCurrentlyWorking: boolean;
  recommendation: string;
  formattedTime: string;
  formattedTimeWithSeconds?: string;
  formattedDate: string;
  timeDiffString: string;
  gmtOffsetString: string;
  timeZone: string;
  countryName: string;
  flag: string;
  hour: number;
  minute: number;
  dayProgressPercent: number; // 0-100% through the 24h day
}

/**
 * Extracts numeric date parts in target IANA timezone safely.
 */
export function getPartsInTimezone(
  date: Date,
  timeZone: string
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0: Sun, 1: Mon, ..., 6: Sat
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const lookup: Record<string, string> = {};
    for (const p of parts) {
      lookup[p.type] = p.value;
    }

    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return {
      year: parseInt(lookup.year || '2026', 10),
      month: parseInt(lookup.month || '1', 10),
      day: parseInt(lookup.day || '1', 10),
      hour: parseInt(lookup.hour || '0', 10),
      minute: parseInt(lookup.minute || '0', 10),
      second: parseInt(lookup.second || '0', 10),
      dayOfWeek: weekdayMap[lookup.weekday || 'Mon'] ?? 1,
    };
  } catch {
    // Fallback if timezone not recognized
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay(),
    };
  }
}

/**
 * Computes difference in whole or half hours between target timezone and user's local timezone.
 */
export function computeHourDifference(targetTz: string, refDate: Date = new Date()): number {
  try {
    const userParts = getPartsInTimezone(refDate, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const targetParts = getPartsInTimezone(refDate, targetTz);

    // Compute epoch approximations for comparison
    const userUtc = Date.UTC(
      userParts.year,
      userParts.month - 1,
      userParts.day,
      userParts.hour,
      userParts.minute
    );
    const targetUtc = Date.UTC(
      targetParts.year,
      targetParts.month - 1,
      targetParts.day,
      targetParts.hour,
      targetParts.minute
    );

    const diffMinutes = Math.round((targetUtc - userUtc) / (1000 * 60));
    return diffMinutes / 60;
  } catch {
    return 0;
  }
}

/**
 * Returns human-readable GMT offset string (e.g. 'GMT+7', 'GMT-5').
 */
export function getGmtOffsetString(timeZone: string, refDate: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(refDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : 'GMT';
  } catch {
    return 'GMT';
  }
}

/**
 * Evaluates full partner business hours status, local time, and recommendations.
 */
export function getPartnerBusinessStatus(
  countryName: string,
  refDate: Date = new Date(),
  lang: 'id' | 'en' = 'id'
): PartnerBusinessStatus {
  const master = getMasterCountry(countryName);
  const timeZone = getTimezoneForCountry(countryName);
  const workDays = getWorkDaysForCountry(countryName);
  const flag = master?.flag || '🌐';
  const canonicalCountry = master?.name || countryName;

  const parts = getPartsInTimezone(refDate, timeZone);
  const hour = parts.hour;
  const minute = parts.minute;
  const second = parts.second;
  const dayOfWeek = parts.dayOfWeek;
  const timeDecimal = hour + minute / 60;

  // Day progress percent (00:00 = 0%, 24:00 = 100%)
  const dayProgressPercent = Math.min(100, Math.max(0, Math.round((timeDecimal / 24) * 100)));

  // Formatted 24h time strings
  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(hour)}:${pad(minute)}`;
  const formattedTimeWithSeconds = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  // Formatted date in bilingual
  const isEn = lang === 'en';
  const monthNames = isEn
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dayNames = isEn
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const formattedDate = `${dayNames[dayOfWeek]}, ${parts.day} ${monthNames[parts.month - 1]}`;

  // Time difference relative to user
  const diffHours = computeHourDifference(timeZone, refDate);
  let timeDiffString = isEn ? 'Same time as you' : 'Waktu sama dengan Anda';
  if (diffHours > 0) {
    const formattedDiff = Number.isInteger(diffHours) ? diffHours : diffHours.toFixed(1);
    timeDiffString = isEn ? `+${formattedDiff}h from you` : `+${formattedDiff} jam dari Anda`;
  } else if (diffHours < 0) {
    const formattedDiff = Number.isInteger(diffHours) ? Math.abs(diffHours) : Math.abs(diffHours).toFixed(1);
    timeDiffString = isEn ? `-${formattedDiff}h from you` : `-${formattedDiff} jam dari Anda`;
  }

  const gmtOffsetString = getGmtOffsetString(timeZone, refDate);

  // Business hours evaluation
  const isWorkDay = workDays.includes(dayOfWeek);

  if (!isWorkDay) {
    return {
      category: 'weekend',
      label: isEn ? 'Weekend' : 'Akhir Pekan',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dotColor: 'bg-amber-500',
      iconType: 'calendar',
      isCurrentlyWorking: false,
      recommendation: isEn
        ? 'Official office holiday in this country. Schedule communication for the next business day.'
        : 'Hari libur kantor di negara ini. Disarankan jadwalkan komunikasi pada hari kerja berikutnya.',
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: Deep night (22:00 - 07:00)
  if (timeDecimal >= 22 || timeDecimal < 7) {
    return {
      category: 'deep_night',
      label: isEn ? 'Deep Night / Off-Hours' : 'Tengah Malam / Dini Hari',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotColor: 'bg-indigo-400',
      iconType: 'moon',
      isCurrentlyWorking: false,
      recommendation: isEn
        ? 'Partner is resting for the night. Avoid urgent phone calls; use async email.'
        : 'Partner sedang istirahat malam. Hindari panggilan telepon mendesak; gunakan email asinkron.',
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: Opening soon (07:00 - 09:00)
  if (timeDecimal >= 7 && timeDecimal < 9) {
    const minutesLeft = Math.round((9 - timeDecimal) * 60);
    return {
      category: 'opening_soon',
      label: isEn ? 'Opening Soon' : 'Menjelang Buka',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      dotColor: 'bg-sky-500',
      iconType: 'clock',
      isCurrentlyWorking: false,
      recommendation: isEn
        ? `Morning; office will open in ~${minutesLeft} mins. Prepare meeting topics.`
        : `Pagi hari; kantor akan buka dalam ~${minutesLeft} menit. Siapkan bahan diskusi.`,
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: Lunch break (12:00 - 13:00)
  if (timeDecimal >= 12 && timeDecimal < 13) {
    return {
      category: 'lunch',
      label: isEn ? 'Lunch Break' : 'Istirahat Siang',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-500',
      iconType: 'coffee',
      isCurrentlyWorking: true,
      recommendation: isEn
        ? 'Lunch break hours. Partner response may be slightly delayed.'
        : 'Jam istirahat makan siang. Partner mungkin merespons sedikit lebih lambat.',
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: Closing soon (17:00 - 18:00)
  if (timeDecimal >= 17 && timeDecimal < 18) {
    return {
      category: 'closing_soon',
      label: isEn ? 'Closing Soon' : 'Menjelang Tutup',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotColor: 'bg-emerald-500',
      iconType: 'clock',
      isCurrentlyWorking: true,
      recommendation: isEn
        ? 'Late afternoon approaching closing time. Conduct quick calls or brief confirmations.'
        : 'Sore hari mendekati jam tutup kantor. Lakukan panggilan singkat atau konfirmasi cepat.',
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: Core Working Hours (09:00 - 17:00)
  if (timeDecimal >= 9 && timeDecimal < 17) {
    return {
      category: 'working',
      label: isEn ? 'In Business Hours' : 'Sedang Jam Kerja',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotColor: 'bg-emerald-500',
      iconType: 'sun',
      isCurrentlyWorking: true,
      recommendation: isEn
        ? 'Partner office is currently operating. Optimal time for direct calls and coordination.'
        : 'Kantor distributor sedang beroperasi penuh. Waktu ideal untuk panggilan dan koordinasi langsung.',
      formattedTime,
      formattedTimeWithSeconds,
      formattedDate,
      timeDiffString,
      gmtOffsetString,
      timeZone,
      countryName: canonicalCountry,
      flag,
      hour,
      minute,
      dayProgressPercent,
    };
  }

  // Workday: After hours (18:00 - 22:00)
  return {
    category: 'after_hours',
    label: isEn ? 'After Hours' : 'Di Luar Jam Kerja',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    iconType: 'moon',
    isCurrentlyWorking: false,
    recommendation: isEn
      ? 'Office has closed for the day. Consider sending a summary email.'
      : 'Kantor telah tutup hari ini. Pertimbangkan mengirimkan pesan ringkasan/email.',
    formattedTime,
    formattedTimeWithSeconds,
    formattedDate,
    timeDiffString,
    gmtOffsetString,
    timeZone,
    countryName: canonicalCountry,
    flag,
    hour,
    minute,
    dayProgressPercent,
  };
}

export interface CountryClockSummary {
  countryName: string;
  flag: string;
  region: string;
  partnerCount: number;
  partners: { id: string; companyName: string }[];
  status: PartnerBusinessStatus;
}

/**
 * Summarizes world clocks for countries where active partners exist.
 */
export function getActivePartnerCountryClocks(
  partners: Partner[],
  refDate: Date = new Date(),
  lang: 'id' | 'en' = 'id'
): {
  workingCount: number;
  totalCountries: number;
  countries: CountryClockSummary[];
} {
  const map = new Map<string, { count: number; partners: { id: string; companyName: string }[] }>();

  partners.forEach((p) => {
    const existing = map.get(p.country) || { count: 0, partners: [] };
    existing.count += 1;
    existing.partners.push({ id: p.id, companyName: p.companyName });
    map.set(p.country, existing);
  });

  const countryList: CountryClockSummary[] = [];
  let workingCount = 0;

  map.forEach((val, country) => {
    const master = getMasterCountry(country);
    const status = getPartnerBusinessStatus(country, refDate, lang);
    if (status.isCurrentlyWorking) {
      workingCount += 1;
    }

    countryList.push({
      countryName: master?.name || country,
      flag: master?.flag || '🌐',
      region: master?.region || 'Lainnya',
      partnerCount: val.count,
      partners: val.partners,
      status,
    });
  });

  // Sort: working countries first, then by partner count desc
  countryList.sort((a, b) => {
    if (a.status.isCurrentlyWorking !== b.status.isCurrentlyWorking) {
      return a.status.isCurrentlyWorking ? -1 : 1;
    }
    return b.partnerCount - a.partnerCount;
  });

  return {
    workingCount,
    totalCountries: countryList.length,
    countries: countryList,
  };
}
