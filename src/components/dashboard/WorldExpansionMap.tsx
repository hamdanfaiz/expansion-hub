import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';
import {
  Globe,
  Users,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Building2,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import type { Market, Partner } from '../../types';
import { getPriorityBadge, getStageColor, getStatusBadge } from '../../utils/pipeline';
import {
  getAtlasNameForCountry,
  getCoordinatesForCountry,
} from '../../data/countryRegionDatabase';
import { useApp } from '../../context/AppContext';

interface WorldExpansionMapProps {
  markets: Market[];
  partners: Partner[];
  onSelectMarket: (marketId: string) => void;
  onSelectRegion?: (region: string) => void;
}

type MapDisplayMode = 'density' | 'priority' | 'status';

// Mapping Indonesian country names in markets to world-atlas country names
const COUNTRY_NAME_MAP: Record<string, string> = {
  Vietnam: 'Vietnam',
  Filipina: 'Philippines',
  'Arab Saudi': 'Saudi Arabia',
  'Uni Emirat Arab': 'United Arab Emirates',
  Jerman: 'Germany',
  Jepang: 'Japan',
  Australia: 'Australia',
  Meksiko: 'Mexico',
  Singapura: 'Singapore',
  Malaysia: 'Malaysia',
  Thailand: 'Thailand',
  Inggris: 'United Kingdom',
  'Amerika Serikat': 'United States of America',
  Belanda: 'Netherlands',
  Korea: 'South Korea',
  'Korea Selatan': 'South Korea',
  India: 'India',
  Brasil: 'Brazil',
};

// Canonical coordinates for country pin placement [longitude, latitude]
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  Vietnam: [108.2772, 14.0583],
  Filipina: [121.774, 12.8797],
  'Arab Saudi': [45.0792, 23.8859],
  'Uni Emirat Arab': [54.2004, 24.15],
  Jerman: [10.4515, 51.1657],
  Jepang: [138.2529, 36.2048],
  Australia: [133.7751, -25.2744],
  Meksiko: [-102.5528, 23.6345],
  Singapura: [103.8198, 1.3521],
  Malaysia: [101.9758, 4.2105],
  Thailand: [100.9925, 15.87],
};

const SVG_WIDTH = 960;
const SVG_HEIGHT = 480;

export const WorldExpansionMap: React.FC<WorldExpansionMapProps> = ({
  markets,
  partners,
  onSelectMarket,
}) => {
  const { language } = useApp();
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('density');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [hoveredMarket, setHoveredMarket] = useState<Market | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Group partners by marketId
  const partnersByMarket = useMemo(() => {
    const map: Record<string, Partner[]> = {};
    partners.forEach((p) => {
      if (!map[p.marketId]) {
        map[p.marketId] = [];
      }
      map[p.marketId].push(p);
    });
    return map;
  }, [partners]);

  // Unique regions
  const availableRegions = useMemo(() => {
    const list = Array.from(new Set(markets.map((m) => m.region)));
    return ['all', ...list];
  }, [markets]);

  // Filter markets by region
  const filteredMarkets = useMemo(() => {
    if (selectedRegion === 'all') return markets;
    return markets.filter((m) => m.region === selectedRegion);
  }, [markets, selectedRegion]);

  // Aggregate regional density metrics
  const regionMetrics = useMemo(() => {
    const data: Record<
      string,
      {
        marketCount: number;
        partnerCount: number;
        activePartnerCount: number;
        topCountry: string;
      }
    > = {};

    markets.forEach((m) => {
      const pList = partnersByMarket[m.id] || [];
      const activeCount = pList.filter((p) => p.pipelineStage === 'Active').length;

      if (!data[m.region]) {
        data[m.region] = {
          marketCount: 0,
          partnerCount: 0,
          activePartnerCount: 0,
          topCountry: m.country,
        };
      }

      data[m.region].marketCount += 1;
      data[m.region].partnerCount += pList.length;
      data[m.region].activePartnerCount += activeCount;
    });

    return Object.entries(data).sort((a, b) => b[1].partnerCount - a[1].partnerCount);
  }, [markets, partnersByMarket]);

  // D3 Projection and Path Generator
  const { countriesGeo, pathGenerator, graticulePath, spherePath, projection } = useMemo(() => {
    const proj = d3
      .geoNaturalEarth1()
      .scale(168)
      .translate([SVG_WIDTH / 2, SVG_HEIGHT / 2 + 15]);

    const pathGen = d3.geoPath().projection(proj);

    // Convert TopoJSON to GeoJSON FeatureCollection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = worldData as any;
    const countries = topojson.feature(topo, topo.objects.countries) as any;

    const graticule = d3.geoGraticule10();
    const gratPath = pathGen(graticule);
    const sphPath = pathGen({ type: 'Sphere' });

    return {
      countriesGeo: countries.features || [],
      pathGenerator: pathGen,
      graticulePath: gratPath,
      spherePath: sphPath,
      projection: proj,
    };
  }, []);

  // Quick lookup from atlas country name to market
  const countryNameToMarket = useMemo(() => {
    const lookup: Record<string, Market> = {};
    markets.forEach((m) => {
      const atlasName = getAtlasNameForCountry(m.country) || COUNTRY_NAME_MAP[m.country] || m.country;
      lookup[atlasName.toLowerCase()] = m;
      lookup[m.country.toLowerCase()] = m;
    });
    return lookup;
  }, [markets]);

  // Project coordinates for each market
  const marketCoordinates = useMemo(() => {
    const coords: Record<string, [number, number] | null> = {};

    markets.forEach((m) => {
      // 1. Check standardized coordinates from Master Database
      let coord = getCoordinatesForCountry(m.country) || COUNTRY_COORDINATES[m.country];

      // 2. Fallback to country polygon centroid in GeoJSON
      if (!coord) {
        const atlasName = getAtlasNameForCountry(m.country) || COUNTRY_NAME_MAP[m.country] || m.country;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feature = countriesGeo.find(
          (f: any) =>
            f.properties?.name?.toLowerCase() === atlasName.toLowerCase() ||
            f.properties?.name?.toLowerCase() === m.country.toLowerCase()
        );
        if (feature) {
          coord = d3.geoCentroid(feature) as [number, number];
        }
      }

      if (coord) {
        const projected = projection(coord);
        coords[m.id] = projected ? [projected[0], projected[1]] : null;
      } else {
        coords[m.id] = null;
      }
    });

    return coords;
  }, [markets, countriesGeo, projection]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.3, 2.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.3, 0.8));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Helper colors for display modes
  const getMarketVisualProps = (m: Market, partnerList: Partner[]) => {
    const count = partnerList.length;

    if (displayMode === 'density') {
      if (count >= 3) {
        return {
          fill: '#4f46e5', // indigo-600
          border: '#3730a3',
          ring: 'rgba(79, 70, 229, 0.3)',
          radius: 14,
          labelBg: 'bg-indigo-900',
          labelText: 'text-indigo-100',
          densityDesc: language === 'en' ? `${count} Partners (High Density)` : `${count} Mitra (Kepadatan Tinggi)`,
        };
      }
      if (count === 2) {
        return {
          fill: '#0284c7', // sky-600
          border: '#0369a1',
          ring: 'rgba(2, 132, 199, 0.3)',
          radius: 12,
          labelBg: 'bg-sky-900',
          labelText: 'text-sky-100',
          densityDesc: language === 'en' ? `${count} Partners (Medium Density)` : `${count} Mitra (Kepadatan Sedang)`,
        };
      }
      return {
        fill: '#0d9488', // teal-600
        border: '#0f766e',
        ring: 'rgba(13, 148, 136, 0.3)',
        radius: 10,
        labelBg: 'bg-teal-900',
        labelText: 'text-teal-100',
        densityDesc: language === 'en' ? `${count} Partner (Initial Expansion)` : `${count} Mitra (Ekspansi Baru)`,
      };
    }

    if (displayMode === 'priority') {
      if (m.priority === 'P1') {
        return {
          fill: '#e11d48', // rose-600
          border: '#be123c',
          ring: 'rgba(225, 29, 72, 0.3)',
          radius: 13,
          labelBg: 'bg-rose-900',
          labelText: 'text-rose-100',
          densityDesc: language === 'en' ? 'P1 Strategic Priority' : 'P1 Prioritas Strategis',
        };
      }
      if (m.priority === 'P2') {
        return {
          fill: '#d97706', // amber-600
          border: '#b45309',
          ring: 'rgba(217, 119, 6, 0.3)',
          radius: 11,
          labelBg: 'bg-amber-900',
          labelText: 'text-amber-100',
          densityDesc: language === 'en' ? 'P2 Medium Potential' : 'P2 Potensial Menengah',
        };
      }
      return {
        fill: '#3b82f6', // blue-500
        border: '#1d4ed8',
        ring: 'rgba(59, 130, 246, 0.3)',
        radius: 10,
        labelBg: 'bg-blue-900',
        labelText: 'text-blue-100',
        densityDesc: language === 'en' ? 'P3 Emerging Market' : 'P3 Pasar Berkembang',
      };
    }

    // Status mode
    if (m.status === 'Active') {
      return {
        fill: '#16a34a', // emerald-600
        border: '#15803d',
        ring: 'rgba(22, 163, 74, 0.3)',
        radius: 13,
        labelBg: 'bg-emerald-900',
        labelText: 'text-emerald-100',
        densityDesc: language === 'en' ? 'Active Operating Market' : 'Pasar Aktif Beroperasi',
      };
    }
    if (m.status === 'Exploring') {
      return {
        fill: '#8b5cf6', // violet-500
        border: '#7c3aed',
        ring: 'rgba(139, 92, 246, 0.3)',
        radius: 11,
        labelBg: 'bg-violet-900',
        labelText: 'text-violet-100',
        densityDesc: language === 'en' ? 'Research & Initial Outreach' : 'Riset & Penjajakan Awal',
      };
    }
    return {
      fill: '#64748b', // slate-500
      border: '#475569',
      ring: 'rgba(100, 116, 139, 0.3)',
      radius: 10,
      labelBg: 'bg-slate-800',
      labelText: 'text-slate-100',
      densityDesc: language === 'en' ? 'On Hold Status' : 'Status Ditunda (On Hold)',
    };
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header bar: Title, view mode toggle, zoom controls */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-indigo-600 p-2 text-white shadow-xs">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'en' ? 'Global Penetration Map & Partner Density' : 'Peta Penetrasi Global & Kepadatan Mitra'}
              </h2>
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 font-mono">
                {markets.length} {language === 'en' ? 'Markets' : 'Pasar'} • {partners.length} {language === 'en' ? 'Partners Distributed' : 'Mitra Tersebar'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Geographic distribution visualization of international distributor prospects and IBD market penetration status'
                : 'Visualisasi distribusi geografis calon distributor internasional dan status penetrasi pasar IBD'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Zoom tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode switch */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs text-xs">
            <button
              onClick={() => setDisplayMode('density')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition ${
                displayMode === 'density'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Partner Density' : 'Kepadatan Mitra'}</span>
            </button>
            <button
              onClick={() => setDisplayMode('priority')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition ${
                displayMode === 'priority'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Priority P1-P3' : 'Prioritas P1-P3'}</span>
            </button>
            <button
              onClick={() => setDisplayMode('status')}
              className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition ${
                displayMode === 'status'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Operational Status' : 'Status Operasional'}</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={handleZoomIn}
              title={language === 'en' ? 'Zoom In' : 'Perbesar Peta'}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title={language === 'en' ? 'Zoom Out' : 'Perkecil Peta'}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title={language === 'en' ? 'Reset View' : 'Reset Tampilan'}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Region quick filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-2 text-xs scrollbar-none bg-slate-50/30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Compass className="h-3.5 w-3.5" />
          {language === 'en' ? 'Filter Region:' : 'Filter Wilayah:'}
        </span>
        {availableRegions.map((region) => {
          const isSelected = selectedRegion === region;
          const label = region === 'all' ? (language === 'en' ? 'All Regions' : 'Semua Wilayah') : region;
          const count =
            region === 'all'
              ? markets.length
              : markets.filter((m) => m.region === region).length;

          return (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 transition font-medium text-[11px] ${
                isSelected
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1 text-[10px] ${
                  isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Map Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-2 overflow-hidden select-none"
        style={{ minHeight: '380px' }}
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:16px_16px]" />

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto max-h-[500px] transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Defs for gradients & glowing filters */}
          <defs>
            <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="ocean-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="active-land-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#312e81" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Ocean Sphere background */}
          {spherePath && (
            <path
              d={spherePath}
              fill="url(#ocean-gradient)"
              stroke="#1e293b"
              strokeWidth="1.2"
              className="drop-shadow-sm"
            />
          )}

          {/* Graticule 10-degree coordinate lines */}
          {graticulePath && (
            <path
              d={graticulePath}
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="2,3"
              opacity="0.35"
            />
          )}

          {/* Base Countries Landmasses */}
          <g className="countries-layer">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {countriesGeo.map((feature: any, idx: number) => {
              const name = feature.properties?.name || '';
              const market = countryNameToMarket[name.toLowerCase()];
              const isMarketActive = Boolean(market);
              const isSelectedInFilter =
                isMarketActive &&
                (selectedRegion === 'all' || market.region === selectedRegion);

              // SVG Path d attribute
              const d = pathGenerator(feature);
              if (!d) return null;

              let fillColor = '#1e293b'; // slate-800 default for non-target land
              let strokeColor = '#334155'; // slate-700
              let opacity = 0.85;

              if (isMarketActive) {
                if (isSelectedInFilter) {
                  fillColor = '#3730a3'; // indigo-800
                  strokeColor = '#818cf8'; // indigo-400
                  opacity = 1;
                } else {
                  fillColor = '#1e1b4b'; // subtle dimmed
                  strokeColor = '#4338ca';
                  opacity = 0.45;
                }
              }

              return (
                <path
                  key={`land-${feature.id || idx}`}
                  d={d}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isMarketActive && isSelectedInFilter ? 1 : 0.4}
                  opacity={opacity}
                  className={`transition-colors duration-200 ${
                    isMarketActive ? 'cursor-pointer hover:fill-indigo-700' : ''
                  }`}
                  onClick={() => {
                    if (market) {
                      onSelectMarket(market.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (market) {
                      setHoveredMarket(market);
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }
                  }}
                  onMouseMove={(e) => {
                    if (market) {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredMarket(null);
                    setTooltipPos(null);
                  }}
                />
              );
            })}
          </g>

          {/* Active Market Pins & Density Rings Layer */}
          <g className="pins-layer">
            {filteredMarkets.map((m) => {
              const pos = marketCoordinates[m.id];
              if (!pos) return null;
              const [x, y] = pos;

              const pList = partnersByMarket[m.id] || [];
              const visual = getMarketVisualProps(m, pList);
              const isHovered = hoveredMarket?.id === m.id;

              return (
                <g
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${language === 'en' ? 'Market' : 'Pasar'} ${m.country}`}
                  data-market-pin={m.country}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform duration-200 outline-none focus:scale-125"
                  onClick={() => onSelectMarket(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectMarket(m.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    setHoveredMarket(m);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredMarket(null);
                    setTooltipPos(null);
                  }}
                >
                  {/* Outer pulsating ring for P1 or high-density markets */}
                  {(m.priority === 'P1' || pList.length >= 2) && (
                    <circle
                      r={visual.radius + 6}
                      fill="none"
                      stroke={visual.fill}
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Density Area Halo */}
                  <circle
                    r={visual.radius + 4}
                    fill={visual.ring}
                    stroke={visual.border}
                    strokeWidth="1"
                    opacity={isHovered ? 0.9 : 0.6}
                  />

                  {/* Core Pin Circle */}
                  <circle
                    r={visual.radius}
                    fill={visual.fill}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="url(#map-glow)"
                    className="transition-transform duration-150 hover:scale-125"
                  />

                  {/* Pin label inside: count of partners */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {pList.length}
                  </text>

                  {/* Country Name Tag under pin */}
                  <g transform={`translate(0, ${visual.radius + 12})`}>
                    <rect
                      x="-38"
                      y="-8"
                      width="76"
                      height="16"
                      rx="3"
                      fill="#0f172a"
                      fillOpacity="0.85"
                      stroke={visual.fill}
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {m.country}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip when hovering over a market */}
        {hoveredMarket && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl text-xs text-white backdrop-blur-md transition-all duration-75 max-w-xs"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x + 12, 10), (containerRef.current?.clientWidth || 400) - 270)}px`,
              top: `${Math.min(Math.max(tooltipPos.y - 40, 10), (containerRef.current?.clientHeight || 400) - 180)}px`,
            }}
          >
            {/* Header: Country, region, priority badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  {hoveredMarket.country}
                </span>
                <span className="text-[11px] text-slate-400 block">{hoveredMarket.region}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    getPriorityBadge(hoveredMarket.priority, language).bg
                  } ${getPriorityBadge(hoveredMarket.priority, language).text}`}
                >
                  {hoveredMarket.priority}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    getStatusBadge(hoveredMarket.status, language).bg
                  } ${getStatusBadge(hoveredMarket.status, language).text}`}
                >
                  {getStatusBadge(hoveredMarket.status, language).label}
                </span>
              </div>
            </div>

            {/* Potential & PIC */}
            <div className="mt-2 space-y-1 text-[11px]">
              <div className="text-slate-300">
                <span className="text-slate-400 font-medium">
                  {language === 'en' ? 'TAM Potential: ' : 'Potensi TAM: '}
                </span>
                {hoveredMarket.potential}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400 font-medium">PIC IBD: </span>
                {hoveredMarket.owner}
              </div>
            </div>

            {/* Partner Breakdown */}
            <div className="mt-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-indigo-400" />
                  {language === 'en' ? 'Partner Density' : 'Kepadatan Mitra'} ({partnersByMarket[hoveredMarket.id]?.length || 0})
                </span>
              </div>

              {partnersByMarket[hoveredMarket.id] &&
              partnersByMarket[hoveredMarket.id].length > 0 ? (
                <div className="space-y-1">
                  {partnersByMarket[hoveredMarket.id].map((p) => {
                    const stColor = getStageColor(p.pipelineStage);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between bg-slate-800/80 rounded px-1.5 py-1 text-[10px]"
                      >
                        <span className="truncate max-w-[130px] font-medium text-slate-200">
                          {p.companyName}
                        </span>
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-semibold ${stColor.bg} ${stColor.text}`}
                        >
                          {p.pipelineStage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  {language === 'en'
                    ? 'No distributor partners registered in this market yet.'
                    : 'Belum ada mitra distributor terdata di pasar ini.'}
                </p>
              )}
            </div>

            {/* Click to open action hint */}
            <div className="mt-2.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-indigo-300">
              <span>{language === 'en' ? 'Open market detail sheet' : 'Buka lembar detail pasar'}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Map Legend Overlay in bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 rounded-md border border-slate-700/80 bg-slate-900/90 p-2.5 text-xs text-white backdrop-blur-sm shadow-lg max-w-[210px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            {displayMode === 'density'
              ? (language === 'en' ? 'Partner Density Indicators' : 'Indikator Kepadatan Mitra')
              : displayMode === 'priority'
              ? (language === 'en' ? 'Market Priority Indicators' : 'Indikator Prioritas Pasar')
              : (language === 'en' ? 'Market Penetration Status' : 'Status Penetrasi Pasar')}
          </span>

          {displayMode === 'density' && (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-600 border border-white text-[9px] font-bold text-center leading-3">
                  3
                </span>
                <span className="text-slate-300">
                  {language === 'en' ? '≥ 3 Partners (High)' : '≥ 3 Mitra (Tinggi)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500 border border-white text-[8px] font-bold text-center leading-2.5">
                  2
                </span>
                <span className="text-slate-300">
                  {language === 'en' ? '2 Partners (Medium)' : '2 Mitra (Sedang)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 border border-white text-[8px] font-bold text-center leading-2">
                  1
                </span>
                <span className="text-slate-300">
                  {language === 'en' ? '1 Partner (Initial Entry)' : '1 Mitra (Penetrasi Awal)'}
                </span>
              </div>
            </div>
          )}

          {displayMode === 'priority' && (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-300">
                  {language === 'en' ? 'P1 - Strategic Priority' : 'P1 - Prioritas Strategis'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">
                  {language === 'en' ? 'P2 - Medium Potential' : 'P2 - Potensial Menengah'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">
                  {language === 'en' ? 'P3 - Emerging Market' : 'P3 - Pasar Berkembang'}
                </span>
              </div>
            </div>
          )}

          {displayMode === 'status' && (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">
                  {language === 'en' ? 'Active (Operating)' : 'Active (Resmi Berjalan)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                <span className="text-slate-300">
                  {language === 'en' ? 'Exploring (Outreach)' : 'Exploring (Penjajakan)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <span className="text-slate-300">
                  {language === 'en' ? 'On Hold' : 'On Hold (Ditunda)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Help label in bottom-right */}
        <div className="absolute bottom-3 right-3 z-10 hidden sm:block text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          {language === 'en'
            ? 'Click a market pin to open the workspace detail'
            : 'Klik pin pasar untuk membuka detail lembar kerja'}
        </div>
      </div>

      {/* Regional Density Summary Cards Bar (Bottom strip) */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'en' ? 'Regional Distributor Density Summary' : 'Ringkasan Kepadatan Distributor per Wilayah'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {language === 'en'
              ? 'Sorted by number of registered distributor partners'
              : 'Diurutkan berdasarkan jumlah mitra distributor terdaftar'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {regionMetrics.map(([region, stat]) => {
            const isSelected = selectedRegion === region;
            return (
              <div
                key={region}
                onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
                className={`cursor-pointer rounded-lg border p-2.5 transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate text-[11px]">
                    {region}
                  </span>
                  <span
                    className={`rounded font-mono px-1.5 py-0.2 text-[10px] font-bold ${
                      stat.partnerCount >= 2
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stat.partnerCount} {language === 'en' ? 'Partners' : 'Mitra'}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between text-[11px] text-slate-600">
                  <span>{stat.marketCount} {language === 'en' ? 'Markets' : 'Pasar'}</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {stat.activePartnerCount} {language === 'en' ? 'Active' : 'Aktif'}
                  </span>
                </div>

                <div className="mt-1.5 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{
                      width: `${Math.min((stat.partnerCount / (partners.length || 1)) * 100 * 2, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
