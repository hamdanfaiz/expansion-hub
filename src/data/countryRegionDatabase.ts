/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MasterCountry {
  code: string; // ISO 3166-1 alpha-2 code
  name: string; // Indonesian standard name
  atlasName: string; // World-Atlas GeoJSON name matching countries-110m.json
  region: string; // Standard canonical region
  flag: string; // Flag emoji
  coordinates: [number, number]; // [longitude, latitude] for map pin precision
  defaultCurrency: string;
  phonePrefix: string;
  timeZone: string; // IANA timezone (e.g. 'Asia/Jakarta', 'Asia/Tokyo')
  workDays?: number[]; // [0, 1, 2, 3, 4] for Sun-Thu, [1, 2, 3, 4, 5] for Mon-Fri (default)
}

export const MASTER_REGIONS = [
  'Asia Tenggara',
  'Asia Timur',
  'Asia Selatan',
  'Timur Tengah & Afrika Utara',
  'Eropa Barat',
  'Eropa Timur',
  'Amerika Utara',
  'Amerika Latin',
  'Oseania',
  'Afrika Sub-Sahara',
] as const;

export type MasterRegion = (typeof MASTER_REGIONS)[number];

export const MASTER_COUNTRIES: MasterCountry[] = [
  // Asia Tenggara
  {
    code: 'VN',
    name: 'Vietnam',
    atlasName: 'Vietnam',
    region: 'Asia Tenggara',
    flag: '🇻🇳',
    coordinates: [108.2772, 14.0583],
    defaultCurrency: 'VND',
    phonePrefix: '+84',
    timeZone: 'Asia/Ho_Chi_Minh',
  },
  {
    code: 'PH',
    name: 'Filipina',
    atlasName: 'Philippines',
    region: 'Asia Tenggara',
    flag: '🇵🇭',
    coordinates: [121.774, 12.8797],
    defaultCurrency: 'PHP',
    phonePrefix: '+63',
    timeZone: 'Asia/Manila',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    atlasName: 'Malaysia',
    region: 'Asia Tenggara',
    flag: '🇲🇾',
    coordinates: [101.9758, 4.2105],
    defaultCurrency: 'MYR',
    phonePrefix: '+60',
    timeZone: 'Asia/Kuala_Lumpur',
  },
  {
    code: 'SG',
    name: 'Singapura',
    atlasName: 'Singapore',
    region: 'Asia Tenggara',
    flag: '🇸🇬',
    coordinates: [103.8198, 1.3521],
    defaultCurrency: 'SGD',
    phonePrefix: '+65',
    timeZone: 'Asia/Singapore',
  },
  {
    code: 'TH',
    name: 'Thailand',
    atlasName: 'Thailand',
    region: 'Asia Tenggara',
    flag: '🇹🇭',
    coordinates: [100.9925, 15.87],
    defaultCurrency: 'THB',
    phonePrefix: '+66',
    timeZone: 'Asia/Bangkok',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    atlasName: 'Indonesia',
    region: 'Asia Tenggara',
    flag: '🇮🇩',
    coordinates: [113.9213, -0.7893],
    defaultCurrency: 'IDR',
    phonePrefix: '+62',
    timeZone: 'Asia/Jakarta',
  },
  {
    code: 'KH',
    name: 'Kamboja',
    atlasName: 'Cambodia',
    region: 'Asia Tenggara',
    flag: '🇰🇭',
    coordinates: [104.991, 12.5657],
    defaultCurrency: 'KHR',
    phonePrefix: '+855',
    timeZone: 'Asia/Phnom_Penh',
  },
  {
    code: 'BN',
    name: 'Brunei Darussalam',
    atlasName: 'Brunei',
    region: 'Asia Tenggara',
    flag: '🇧🇳',
    coordinates: [114.7277, 4.5353],
    defaultCurrency: 'BND',
    phonePrefix: '+673',
    timeZone: 'Asia/Brunei',
  },

  // Timur Tengah & Afrika Utara
  {
    code: 'SA',
    name: 'Arab Saudi',
    atlasName: 'Saudi Arabia',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇸🇦',
    coordinates: [45.0792, 23.8859],
    defaultCurrency: 'SAR',
    phonePrefix: '+966',
    timeZone: 'Asia/Riyadh',
    workDays: [0, 1, 2, 3, 4], // Minggu - Kamis
  },
  {
    code: 'AE',
    name: 'Uni Emirat Arab',
    atlasName: 'United Arab Emirates',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇦🇪',
    coordinates: [54.2004, 24.15],
    defaultCurrency: 'AED',
    phonePrefix: '+971',
    timeZone: 'Asia/Dubai',
    workDays: [1, 2, 3, 4, 5], // Senin - Jumat
  },
  {
    code: 'QA',
    name: 'Qatar',
    atlasName: 'Qatar',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇶🇦',
    coordinates: [51.1839, 25.3548],
    defaultCurrency: 'QAR',
    phonePrefix: '+974',
    timeZone: 'Asia/Qatar',
    workDays: [0, 1, 2, 3, 4],
  },
  {
    code: 'KW',
    name: 'Kuwait',
    atlasName: 'Kuwait',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇰🇼',
    coordinates: [47.4818, 29.3117],
    defaultCurrency: 'KWD',
    phonePrefix: '+965',
    timeZone: 'Asia/Kuwait',
    workDays: [0, 1, 2, 3, 4],
  },
  {
    code: 'OM',
    name: 'Oman',
    atlasName: 'Oman',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇴🇲',
    coordinates: [55.9754, 21.4735],
    defaultCurrency: 'OMR',
    phonePrefix: '+968',
    timeZone: 'Asia/Muscat',
    workDays: [0, 1, 2, 3, 4],
  },
  {
    code: 'EG',
    name: 'Mesir',
    atlasName: 'Egypt',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇪🇬',
    coordinates: [30.8025, 26.8206],
    defaultCurrency: 'EGP',
    phonePrefix: '+20',
    timeZone: 'Africa/Cairo',
    workDays: [0, 1, 2, 3, 4],
  },
  {
    code: 'TR',
    name: 'Turki',
    atlasName: 'Turkey',
    region: 'Timur Tengah & Afrika Utara',
    flag: '🇹🇷',
    coordinates: [35.2433, 38.9637],
    defaultCurrency: 'TRY',
    phonePrefix: '+90',
    timeZone: 'Europe/Istanbul',
  },

  // Asia Timur
  {
    code: 'JP',
    name: 'Jepang',
    atlasName: 'Japan',
    region: 'Asia Timur',
    flag: '🇯🇵',
    coordinates: [138.2529, 36.2048],
    defaultCurrency: 'JPY',
    phonePrefix: '+81',
    timeZone: 'Asia/Tokyo',
  },
  {
    code: 'KR',
    name: 'Korea Selatan',
    atlasName: 'South Korea',
    region: 'Asia Timur',
    flag: '🇰🇷',
    coordinates: [127.7669, 35.9078],
    defaultCurrency: 'KRW',
    phonePrefix: '+82',
    timeZone: 'Asia/Seoul',
  },
  {
    code: 'CN',
    name: 'Tiongkok',
    atlasName: 'China',
    region: 'Asia Timur',
    flag: '🇨🇳',
    coordinates: [104.1954, 35.8617],
    defaultCurrency: 'CNY',
    phonePrefix: '+86',
    timeZone: 'Asia/Shanghai',
  },
  {
    code: 'TW',
    name: 'Taiwan',
    atlasName: 'Taiwan',
    region: 'Asia Timur',
    flag: '🇹🇼',
    coordinates: [120.9605, 23.6978],
    defaultCurrency: 'TWD',
    phonePrefix: '+886',
    timeZone: 'Asia/Taipei',
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    atlasName: 'Hong Kong',
    region: 'Asia Timur',
    flag: '🇭🇰',
    coordinates: [114.1694, 22.3193],
    defaultCurrency: 'HKD',
    phonePrefix: '+852',
    timeZone: 'Asia/Hong_Kong',
  },

  // Eropa Barat
  {
    code: 'DE',
    name: 'Jerman',
    atlasName: 'Germany',
    region: 'Eropa Barat',
    flag: '🇩🇪',
    coordinates: [10.4515, 51.1657],
    defaultCurrency: 'EUR',
    phonePrefix: '+49',
    timeZone: 'Europe/Berlin',
  },
  {
    code: 'GB',
    name: 'Inggris',
    atlasName: 'United Kingdom',
    region: 'Eropa Barat',
    flag: '🇬🇧',
    coordinates: [-3.436, 55.3781],
    defaultCurrency: 'GBP',
    phonePrefix: '+44',
    timeZone: 'Europe/London',
  },
  {
    code: 'NL',
    name: 'Belanda',
    atlasName: 'Netherlands',
    region: 'Eropa Barat',
    flag: '🇳🇱',
    coordinates: [5.2913, 52.1326],
    defaultCurrency: 'EUR',
    phonePrefix: '+31',
    timeZone: 'Europe/Amsterdam',
  },
  {
    code: 'FR',
    name: 'Prancis',
    atlasName: 'France',
    region: 'Eropa Barat',
    flag: '🇫🇷',
    coordinates: [2.2137, 46.2276],
    defaultCurrency: 'EUR',
    phonePrefix: '+33',
    timeZone: 'Europe/Paris',
  },
  {
    code: 'IT',
    name: 'Italia',
    atlasName: 'Italy',
    region: 'Eropa Barat',
    flag: '🇮🇹',
    coordinates: [12.5674, 41.8719],
    defaultCurrency: 'EUR',
    phonePrefix: '+39',
    timeZone: 'Europe/Rome',
  },
  {
    code: 'ES',
    name: 'Spanyol',
    atlasName: 'Spain',
    region: 'Eropa Barat',
    flag: '🇪🇸',
    coordinates: [-3.7492, 40.4637],
    defaultCurrency: 'EUR',
    phonePrefix: '+34',
    timeZone: 'Europe/Madrid',
  },

  // Oseania
  {
    code: 'AU',
    name: 'Australia',
    atlasName: 'Australia',
    region: 'Oseania',
    flag: '🇦🇺',
    coordinates: [133.7751, -25.2744],
    defaultCurrency: 'AUD',
    phonePrefix: '+61',
    timeZone: 'Australia/Sydney',
  },
  {
    code: 'NZ',
    name: 'Selandia Baru',
    atlasName: 'New Zealand',
    region: 'Oseania',
    flag: '🇳🇿',
    coordinates: [174.886, -40.9006],
    defaultCurrency: 'NZD',
    phonePrefix: '+64',
    timeZone: 'Pacific/Auckland',
  },

  // Amerika Latin
  {
    code: 'MX',
    name: 'Meksiko',
    atlasName: 'Mexico',
    region: 'Amerika Latin',
    flag: '🇲🇽',
    coordinates: [-102.5528, 23.6345],
    defaultCurrency: 'MXN',
    phonePrefix: '+52',
    timeZone: 'America/Mexico_City',
  },
  {
    code: 'BR',
    name: 'Brasil',
    atlasName: 'Brazil',
    region: 'Amerika Latin',
    flag: '🇧🇷',
    coordinates: [-51.9253, -14.235],
    defaultCurrency: 'BRL',
    phonePrefix: '+55',
    timeZone: 'America/Sao_Paulo',
  },
  {
    code: 'CL',
    name: 'Chili',
    atlasName: 'Chile',
    region: 'Amerika Latin',
    flag: '🇨🇱',
    coordinates: [-71.543, -35.6751],
    defaultCurrency: 'CLP',
    phonePrefix: '+56',
    timeZone: 'America/Santiago',
  },
  {
    code: 'CO',
    name: 'Kolombia',
    atlasName: 'Colombia',
    region: 'Amerika Latin',
    flag: '🇨🇴',
    coordinates: [-74.2973, 4.5709],
    defaultCurrency: 'COP',
    phonePrefix: '+57',
    timeZone: 'America/Bogota',
  },

  // Amerika Utara
  {
    code: 'US',
    name: 'Amerika Serikat',
    atlasName: 'United States of America',
    region: 'Amerika Utara',
    flag: '🇺🇸',
    coordinates: [-95.7129, 37.0902],
    defaultCurrency: 'USD',
    phonePrefix: '+1',
    timeZone: 'America/New_York',
  },
  {
    code: 'CA',
    name: 'Kanada',
    atlasName: 'Canada',
    region: 'Amerika Utara',
    flag: '🇨🇦',
    coordinates: [-106.3468, 56.1304],
    defaultCurrency: 'CAD',
    phonePrefix: '+1',
    timeZone: 'America/Toronto',
  },

  // Asia Selatan
  {
    code: 'IN',
    name: 'India',
    atlasName: 'India',
    region: 'Asia Selatan',
    flag: '🇮🇳',
    coordinates: [78.9629, 20.5937],
    defaultCurrency: 'INR',
    phonePrefix: '+91',
    timeZone: 'Asia/Kolkata',
  },
  {
    code: 'PK',
    name: 'Pakistan',
    atlasName: 'Pakistan',
    region: 'Asia Selatan',
    flag: '🇵🇰',
    coordinates: [69.3451, 30.3753],
    defaultCurrency: 'PKR',
    phonePrefix: '+92',
    timeZone: 'Asia/Karachi',
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    atlasName: 'Bangladesh',
    region: 'Asia Selatan',
    flag: '🇧🇩',
    coordinates: [90.3563, 23.685],
    defaultCurrency: 'BDT',
    phonePrefix: '+880',
    timeZone: 'Asia/Dhaka',
  },

  // Afrika Sub-Sahara
  {
    code: 'ZA',
    name: 'Afrika Selatan',
    atlasName: 'South Africa',
    region: 'Afrika Sub-Sahara',
    flag: '🇿🇦',
    coordinates: [22.9375, -30.5595],
    defaultCurrency: 'ZAR',
    phonePrefix: '+27',
    timeZone: 'Africa/Johannesburg',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    atlasName: 'Nigeria',
    region: 'Afrika Sub-Sahara',
    flag: '🇳🇬',
    coordinates: [8.6753, 9.082],
    defaultCurrency: 'NGN',
    phonePrefix: '+234',
    timeZone: 'Africa/Lagos',
  },
  {
    code: 'KE',
    name: 'Kenya',
    atlasName: 'Kenya',
    region: 'Afrika Sub-Sahara',
    flag: '🇰🇪',
    coordinates: [37.9062, -0.0236],
    defaultCurrency: 'KES',
    phonePrefix: '+254',
    timeZone: 'Africa/Nairobi',
  },
];

/**
 * Normalizes input name for fuzzy matching (removes accents, trims, lowercases).
 */
function normalizeKey(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Lookup table by Indonesian name and code.
 */
const COUNTRY_LOOKUP_BY_NAME = new Map<string, MasterCountry>();
const COUNTRY_LOOKUP_BY_CODE = new Map<string, MasterCountry>();
const COUNTRY_LOOKUP_BY_ATLAS = new Map<string, MasterCountry>();

MASTER_COUNTRIES.forEach((c) => {
  COUNTRY_LOOKUP_BY_NAME.set(normalizeKey(c.name), c);
  COUNTRY_LOOKUP_BY_CODE.set(c.code.toUpperCase(), c);
  COUNTRY_LOOKUP_BY_ATLAS.set(normalizeKey(c.atlasName), c);
});

// Common synonyms/aliases in Indonesian business context
const COUNTRY_SYNONYMS: Record<string, string> = {
  korea: 'Korea Selatan',
  'south korea': 'Korea Selatan',
  philippines: 'Filipina',
  'saudi arabia': 'Arab Saudi',
  uae: 'Uni Emirat Arab',
  'united arab emirates': 'Uni Emirat Arab',
  germany: 'Jerman',
  japan: 'Jepang',
  singapore: 'Singapura',
  uk: 'Inggris',
  'united kingdom': 'Inggris',
  usa: 'Amerika Serikat',
  'united states': 'Amerika Serikat',
  netherlands: 'Belanda',
  brazil: 'Brasil',
  turkey: 'Turki',
  egypt: 'Mesir',
  china: 'Tiongkok',
};

/**
 * Retrieves master country record by name, alias, or code.
 */
export function getMasterCountry(identifier: string): MasterCountry | undefined {
  if (!identifier) return undefined;
  const clean = normalizeKey(identifier);

  // 1. Direct name lookup
  if (COUNTRY_LOOKUP_BY_NAME.has(clean)) {
    return COUNTRY_LOOKUP_BY_NAME.get(clean);
  }

  // 2. Atlas name lookup
  if (COUNTRY_LOOKUP_BY_ATLAS.has(clean)) {
    return COUNTRY_LOOKUP_BY_ATLAS.get(clean);
  }

  // 3. Synonym lookup
  const synonymTarget = COUNTRY_SYNONYMS[clean];
  if (synonymTarget) {
    return COUNTRY_LOOKUP_BY_NAME.get(normalizeKey(synonymTarget));
  }

  // 4. Code lookup (e.g. 'VN', 'SA')
  const byCode = COUNTRY_LOOKUP_BY_CODE.get(identifier.trim().toUpperCase());
  if (byCode) return byCode;

  return undefined;
}

/**
 * Returns region for a country name. Fallbacks to default if unknown.
 */
export function getRegionForCountry(countryName: string, fallbackRegion = 'Asia Tenggara'): string {
  const match = getMasterCountry(countryName);
  return match ? match.region : fallbackRegion;
}

/**
 * Returns world-atlas GeoJSON name for projection matching.
 */
export function getAtlasNameForCountry(countryName: string): string {
  const match = getMasterCountry(countryName);
  return match ? match.atlasName : countryName;
}

/**
 * Returns coordinates [lng, lat] for pin placement.
 */
export function getCoordinatesForCountry(countryName: string): [number, number] | undefined {
  const match = getMasterCountry(countryName);
  return match ? match.coordinates : undefined;
}

/**
 * Returns the canonical IANA timezone for a country name (e.g. 'Asia/Tokyo').
 */
export function getTimezoneForCountry(countryName: string, fallbackTimezone = 'Asia/Jakarta'): string {
  const match = getMasterCountry(countryName);
  return match?.timeZone || fallbackTimezone;
}

/**
 * Returns the standard work days for a country (e.g. [0,1,2,3,4] for Sun-Thu in Saudi Arabia).
 */
export function getWorkDaysForCountry(countryName: string): number[] {
  const match = getMasterCountry(countryName);
  return match?.workDays || [1, 2, 3, 4, 5]; // Default: Mon-Fri
}

/**
 * Returns list of all supported countries, sorted alphabetically by Indonesian name.
 */
export function getAllMasterCountries(): MasterCountry[] {
  return [...MASTER_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

/**
 * Returns list of countries in a specific region.
 */
export function getCountriesByRegion(region: string): MasterCountry[] {
  return MASTER_COUNTRIES.filter((c) => c.region === region).sort((a, b) =>
    a.name.localeCompare(b.name, 'id')
  );
}

/**
 * Returns list of unique standard regions.
 */
export function getAllMasterRegions(): string[] {
  return [...MASTER_REGIONS];
}
