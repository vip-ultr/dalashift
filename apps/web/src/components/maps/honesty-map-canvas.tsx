'use client';

import { SPATIAL_RESOLUTION_METRES, type SpatialResolutionKey } from '@dalashift/shared/constants';
import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { Layers } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import React, { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { cn } from '../../lib/utilities/cn';
import { formatResolutionShortBadge } from '../../lib/utilities/format';

export interface HonestyMapCanvasProps {
  readonly parcels: readonly Parcel[];
  readonly activeParcelId?: string | null;
  readonly selectedParcelId?: string | null;
  readonly onSelectParcel?: (parcelId: string) => void;
  readonly initialResolutionKey?: SpatialResolutionKey;
  readonly interactiveDraw?: boolean;
  readonly onGeometryChange?: (geometry: GeoJSONGeometry, previewAreaHa: number) => void;
  readonly heightClass?: string;
  readonly className?: string;
}

const GRID_OVERLAY_OPTIONS: readonly {
  readonly key: SpatialResolutionKey;
  readonly label: string;
  readonly source: string;
  readonly metres: number;
  readonly color: string;
}[] = [
  {
    key: 'smapSoilMoisture',
    label: 'SMAP Soil Moisture (9 km cell)',
    source: 'NASA SMAP L3',
    metres: SPATIAL_RESOLUTION_METRES.smapSoilMoisture,
    color: '#76a1c2',
  },
  {
    key: 'chirps',
    label: 'CHIRPS Rainfall (5.5 km cell)',
    source: 'CHIRPS v3',
    metres: SPATIAL_RESOLUTION_METRES.chirps,
    color: '#2c5282',
  },
  {
    key: 'soilGrids',
    label: 'ISRIC SoilGrids (250 m cell)',
    source: 'SoilGrids 2.0',
    metres: SPATIAL_RESOLUTION_METRES.soilGrids,
    color: '#c26e4a',
  },
  {
    key: 'landsat',
    label: 'Landsat Reflectance (30 m pixel)',
    source: 'NASA/USGS Landsat C2',
    metres: SPATIAL_RESOLUTION_METRES.landsat,
    color: '#0a4232',
  },
  {
    key: 'powerLatitude',
    label: 'NASA POWER Climate (~55 km cell)',
    source: 'NASA POWER',
    metres: SPATIAL_RESOLUTION_METRES.powerLatitude,
    color: '#b45309',
  },
];

export function HonestyMapCanvas({
  parcels,
  activeParcelId,
  selectedParcelId,
  onSelectParcel,
  initialResolutionKey = 'smapSoilMoisture',
  heightClass = 'h-[500px]',
  className,
}: HonestyMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedGridKey, setSelectedGridKey] =
    useState<SpatialResolutionKey>(initialResolutionKey);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);

  const effectiveParcelId = activeParcelId ?? selectedParcelId;
  const activeParcel = parcels.find((p) => p.id === effectiveParcelId) ?? parcels[0] ?? null;

  const activeGridOption =
    GRID_OVERLAY_OPTIONS.find((opt) => opt.key === selectedGridKey) ?? GRID_OVERLAY_OPTIONS[0]!;

  // Client-side MapLibre initialization
  useEffect(() => {
    let mapInstance: MapLibreMap | null = null;
    let isDisposed = false;

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const { Map } = await import('maplibre-gl');
        if (isDisposed || !mapContainerRef.current) return;

        // ESRI World Imagery or OpenStreetMap
        const satelliteTiles =
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        const streetTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

        const mapStyle = {
          version: 8 as const,
          sources: {
            'raster-tiles': {
              type: 'raster' as const,
              tiles: [basemapStyle === 'satellite' ? satelliteTiles : streetTiles],
              tileSize: 256,
              attribution:
                basemapStyle === 'satellite'
                  ? '© Esri, Maxar, Earthstar Geographics'
                  : '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster' as const,
              source: 'raster-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };

        // All coordinates across parcels to compute center and bounding box
        const allCoords: [number, number][] = [];
        for (const p of parcels) {
          if (p.geometry.type === 'Polygon') {
            for (const ring of p.geometry.coordinates) {
              for (const pt of ring) {
                if (typeof pt[0] === 'number' && typeof pt[1] === 'number') {
                  allCoords.push([pt[0], pt[1]]);
                }
              }
            }
          } else if (p.geometry.type === 'Point') {
            const pt = p.geometry.coordinates;
            if (typeof pt[0] === 'number' && typeof pt[1] === 'number') {
              allCoords.push([pt[0], pt[1]]);
            }
          }
        }

        const centerLng =
          allCoords.length > 0
            ? allCoords.reduce((sum, pt) => sum + pt[0], 0) / allCoords.length
            : 8.271;
        const centerLat =
          allCoords.length > 0
            ? allCoords.reduce((sum, pt) => sum + pt[1], 0) / allCoords.length
            : 12.05;

        const map = new Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: [centerLng, centerLat],
          zoom: 15.5,
          attributionControl: false,
        });
        mapInstance = map;

        // ResizeObserver to ensure map canvas adjusts when container appears
        const resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }

        map.on('load', () => {
          if (isDisposed) return;
          setMapLoaded(true);
          map.resize();

          // Auto-fit bounding box of parcels with padding
          if (allCoords.length > 1) {
            const minLng = Math.min(...allCoords.map((c) => c[0]));
            const minLat = Math.min(...allCoords.map((c) => c[1]));
            const maxLng = Math.max(...allCoords.map((c) => c[0]));
            const maxLat = Math.max(...allCoords.map((c) => c[1]));
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 50, maxZoom: 16.5 },
            );
          }

          // Convert all parcels (Polygons and Points) to Features
          const features = parcels.map((p) => {
            if (p.geometry.type === 'Point') {
              const [lng, lat] = p.geometry.coordinates;
              const delta = 0.0006;
              return {
                type: 'Feature' as const,
                properties: { id: p.id, name: p.name },
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [
                    [
                      [lng - delta, lat - delta],
                      [lng + delta, lat - delta],
                      [lng + delta, lat + delta],
                      [lng - delta, lat + delta],
                      [lng - delta, lat - delta],
                    ],
                  ],
                },
              };
            }
            return {
              type: 'Feature' as const,
              properties: { id: p.id, name: p.name },
              geometry: p.geometry,
            };
          });

          map.addSource('parcels-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: features as unknown as GeoJSON.Feature[],
            },
          });

          map.addLayer({
            id: 'parcels-fill',
            type: 'fill',
            source: 'parcels-source',
            paint: {
              'fill-color': '#00b159',
              'fill-opacity': 0.3,
            },
          });

          map.addLayer({
            id: 'parcels-stroke',
            type: 'line',
            source: 'parcels-source',
            paint: {
              'line-color': '#facc15',
              'line-width': 3,
            },
          });

          map.on('click', 'parcels-fill', (e: unknown) => {
            const feature = (e as { features?: Array<{ properties?: { id?: string } }> })
              ?.features?.[0];
            const clickedId = feature?.properties?.id;
            if (clickedId && onSelectParcel) {
              onSelectParcel(clickedId);
            }
          });
        });
      } catch {
        // Fallback gracefully to vector preview
      }
    }

    void initMap();

    return () => {
      isDisposed = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [basemapStyle, parcels, onSelectParcel]);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#111827] shadow-sm select-none',
        heightClass,
        className,
      )}
    >
      {/* MapLibre WebGL DOM Container */}
      <div ref={mapContainerRef} className="absolute inset-0 size-full" />

      {/* Loading state indicator */}
      {!mapLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/70 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="size-2 animate-ping rounded-full bg-[#00b159]" />
            <span>Loading satellite land imagery...</span>
          </div>
        </div>
      ) : null}

      {/* Fallback Vector Overlay / Click-to-draw Layer */}
      <svg viewBox="0 0 800 500" className="pointer-events-none absolute inset-0 size-full">
        {/* Active Satellite Resolution Honesty Footprint */}
        {showGridOverlay ? (
          <g className="transition-all duration-300">
            <rect
              x="260"
              y="110"
              width="280"
              height="280"
              rx="8"
              fill={`${activeGridOption.color}15`}
              stroke={activeGridOption.color}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <rect x="270" y="120" width="260" height="22" rx="4" fill="rgba(17, 24, 39, 0.85)" />
            <text
              x="280"
              y="135"
              fill="#ffffff"
              fontSize="11"
              fontFamily="sans-serif"
              fontWeight="600"
            >
              {activeGridOption.label} · {formatResolutionShortBadge(activeGridOption.metres)}
            </text>
          </g>
        ) : null}
      </svg>

      {/* Floating Top Left HUD: Satellite Layer Selector */}
      <div className="relative z-10 m-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111827]/85 p-1.5 text-xs text-white shadow-lg backdrop-blur-md">
          <Layers className="ml-1.5 size-4 text-[#c26e4a]" />
          <span className="text-[11px] font-medium text-white/70">Satellite Layer:</span>
          <select
            value={selectedGridKey}
            aria-label="Satellite data layer resolution overlay"
            onChange={(e) => setSelectedGridKey(e.target.value as SpatialResolutionKey)}
            className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white outline-none cursor-pointer"
          >
            {GRID_OVERLAY_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key} className="bg-[#111827] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={cn(
              'rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
              showGridOverlay
                ? 'bg-[#0a4232] text-white'
                : 'bg-white/10 text-white/60 hover:text-white',
            )}
          >
            {showGridOverlay ? 'Footprint On' : 'Footprint Off'}
          </button>
        </div>
      </div>

      {/* Floating Bottom HUD: Field Context & Basemap Switcher */}
      <div className="relative z-10 m-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md">
          <span className="font-semibold text-white">
            {activeParcel ? activeParcel.name : 'Field Parcel'}
          </span>
          <span className="text-white/40">·</span>
          <span className="tabular text-white/80">
            {activeParcel?.areaHa
              ? `${activeParcel.areaHa.toFixed(2)} ha`
              : activeParcel?.geometry.type === 'Point'
                ? 'GPS Point'
                : 'Mapped Parcel'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111827]/85 p-1 text-xs text-white shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setBasemapStyle('satellite')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              basemapStyle === 'satellite'
                ? 'bg-[#0a4232] text-white font-semibold'
                : 'text-white/70 hover:text-white',
            )}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setBasemapStyle('street')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              basemapStyle === 'street'
                ? 'bg-[#0a4232] text-white font-semibold'
                : 'text-white/70 hover:text-white',
            )}
          >
            Streets
          </button>
        </div>
      </div>
    </div>
  );
}
