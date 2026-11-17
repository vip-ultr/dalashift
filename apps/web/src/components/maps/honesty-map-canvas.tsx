'use client';

import { SPATIAL_RESOLUTION_METRES, type SpatialResolutionKey } from '@dalashift/shared/constants';
import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { Crosshair, Layers, MapPin, Navigation } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { cn } from '../../lib/utilities/cn';
import { formatResolutionShortBadge } from '../../lib/utilities/format';

export interface HonestyMapCanvasProps {
  readonly parcels?: readonly Parcel[];
  readonly activeParcelId?: string | null;
  readonly selectedParcelId?: string | null;
  readonly onSelectParcel?: (parcelId: string) => void;
  readonly onCoordinateCapture?: (lon: number, lat: number) => void;
  readonly captureMode?: boolean;
  readonly capturePoint?: { lon: number; lat: number } | null;
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
  parcels = [],
  activeParcelId,
  selectedParcelId,
  onSelectParcel,
  onCoordinateCapture,
  captureMode = false,
  capturePoint,
  initialResolutionKey = 'smapSoilMoisture',
  heightClass = 'h-[500px]',
  className,
}: HonestyMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  const [selectedGridKey, setSelectedGridKey] =
    useState<SpatialResolutionKey>(initialResolutionKey);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  const effectiveParcelId = activeParcelId ?? selectedParcelId;
  const activeParcel = parcels.find((p) => p.id === effectiveParcelId) ?? parcels[0] ?? null;

  const activeGridOption =
    GRID_OVERLAY_OPTIONS.find((opt) => opt.key === selectedGridKey) ?? GRID_OVERLAY_OPTIONS[0]!;

  // Build GeoJSON features for current parcels
  const parcelFeatures = useMemo(() => {
    return parcels.map((p) => {
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
  }, [parcels]);

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

        // All coordinates across parcels + capturePoint to compute center and bounding box
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

        if (capturePoint) {
          allCoords.push([capturePoint.lon, capturePoint.lat]);
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
          zoom: allCoords.length > 0 ? 15.5 : 14.5,
          attributionControl: false,
        });

        mapInstance = map;
        mapInstanceRef.current = map;

        // Auto-fit bounding box of parcels with padding if more than one coordinate
        const fitParcels = () => {
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
        };

        // Resize handling
        const resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }

        // Staged resizes to handle tab transitions and modal animations
        setTimeout(() => map.resize(), 100);
        setTimeout(() => map.resize(), 500);

        // Safety fallback timer so loading overlay never gets stuck
        const loadTimer = setTimeout(() => {
          if (!isDisposed) {
            setMapLoaded(true);
            map.resize();
          }
        }, 1200);

        const setupLayers = () => {
          if (isDisposed) return;
          clearTimeout(loadTimer);
          setMapLoaded(true);
          map.resize();
          fitParcels();

          // Add parcels source
          if (!map.getSource('parcels-source')) {
            map.addSource('parcels-source', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: parcelFeatures as unknown as GeoJSON.Feature[],
              },
            });

            map.addLayer({
              id: 'parcels-fill',
              type: 'fill',
              source: 'parcels-source',
              paint: {
                'fill-color': '#00b159',
                'fill-opacity': 0.32,
              },
            });

            map.addLayer({
              id: 'parcels-stroke',
              type: 'line',
              source: 'parcels-source',
              paint: {
                'line-color': '#facc15',
                'line-width': 3.5,
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
          }

          // Add capture point source if capturePoint exists
          if (capturePoint && !map.getSource('capture-point-source')) {
            map.addSource('capture-point-source', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [capturePoint.lon, capturePoint.lat],
                },
              },
            });

            map.addLayer({
              id: 'capture-circle-halo',
              type: 'circle',
              source: 'capture-point-source',
              paint: {
                'circle-radius': 16,
                'circle-color': '#facc15',
                'circle-opacity': 0.35,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });

            map.addLayer({
              id: 'capture-circle-dot',
              type: 'circle',
              source: 'capture-point-source',
              paint: {
                'circle-radius': 6.5,
                'circle-color': '#00b159',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });
          }
        };

        map.on('load', setupLayers);

        // Click on map to capture coordinates
        map.on('click', (e: unknown) => {
          const evt = e as { lngLat?: { lng: number; lat: number } };
          if (evt.lngLat && onCoordinateCapture) {
            const lon = Number(evt.lngLat.lng.toFixed(5));
            const lat = Number(evt.lngLat.lat.toFixed(5));
            onCoordinateCapture(lon, lat);
          }
        });
      } catch {
        setWebglSupported(false);
        setMapLoaded(true);
      }
    }

    void initMap();

    return () => {
      isDisposed = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [basemapStyle, onSelectParcel, onCoordinateCapture]);

  // Keep parcels source updated dynamically when parcels change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    try {
      const source = map.getSource('parcels-source') as {
        setData?: (data: unknown) => void;
      } | null;
      if (source?.setData) {
        source.setData({
          type: 'FeatureCollection',
          features: parcelFeatures,
        });
      }
    } catch {
      // Ignore if source not ready
    }
  }, [parcelFeatures, mapLoaded]);

  // Keep capture point updated dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !capturePoint) return;
    try {
      const source = map.getSource('capture-point-source') as {
        setData?: (data: unknown) => void;
      } | null;
      if (source?.setData) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [capturePoint.lon, capturePoint.lat],
          },
        });
      }
    } catch {
      // Ignore if source not ready
    }
  }, [capturePoint, mapLoaded]);

  // Geolocation helper
  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lon = Number(pos.coords.longitude.toFixed(5));
          const lat = Number(pos.coords.latitude.toFixed(5));
          if (onCoordinateCapture) {
            onCoordinateCapture(lon, lat);
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: [lon, lat],
              zoom: 16,
            });
          }
        },
        () => {
          // Fallback to central Northern Nigeria if location is denied
          if (onCoordinateCapture) {
            onCoordinateCapture(8.271, 12.05);
          }
        },
      );
    }
  };

  return (
    <div
      className={cn(
        'relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#111827] shadow-sm select-none',
        heightClass,
        className,
      )}
    >
      {/* MapLibre WebGL DOM Container */}
      <div
        ref={mapContainerRef}
        className={cn('absolute inset-0 size-full', captureMode && 'cursor-crosshair')}
      />

      {/* Fallback when WebGL is not supported */}
      {!webglSupported ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (onCoordinateCapture) {
              const rect = e.currentTarget.getBoundingClientRect();
              const xRatio = (e.clientX - rect.left) / rect.width;
              const yRatio = (e.clientY - rect.top) / rect.height;
              // Map click ratio to Northern Nigeria coordinates
              const lon = Number((8.265 + xRatio * 0.012).toFixed(5));
              const lat = Number((12.055 - yRatio * 0.01).toFixed(5));
              onCoordinateCapture(lon, lat);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onCoordinateCapture) {
              onCoordinateCapture(8.271, 12.05);
            }
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2e22] to-[#1c3d2e] p-6 text-center text-white cursor-pointer"
        >
          <MapPin className="mb-2 size-8 text-[#00b159]" />
          <h4 className="font-display text-sm font-bold">Interactive Land Parcel Canvas</h4>
          <p className="mt-1 max-w-sm text-xs text-white/70">
            {captureMode
              ? 'Click anywhere on this canvas to capture your parcel coordinates.'
              : 'Satellite boundary viewer. Click to frame parcel.'}
          </p>
          {capturePoint ? (
            <div className="mt-3 rounded-lg bg-black/40 px-3 py-1.5 font-mono text-xs text-[#00b159]">
              Captured: {capturePoint.lon.toFixed(4)}°E, {capturePoint.lat.toFixed(4)}°N
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Loading state indicator */}
      {!mapLoaded && webglSupported ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/70 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="size-2 animate-ping rounded-full bg-[#00b159]" />
            <span>Loading satellite land imagery...</span>
          </div>
        </div>
      ) : null}

      {/* Capture Mode Guidance Banner */}
      {captureMode ? (
        <div className="relative z-20 m-3 flex items-center justify-between rounded-xl border border-white/20 bg-[#111827]/90 px-3.5 py-2 text-xs text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Crosshair className="size-4 text-[#facc15] animate-pulse" />
            <span className="font-semibold text-white">Click map to capture parcel location</span>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1.5 rounded-lg bg-[#00b159] px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#00964b] cursor-pointer"
          >
            <Navigation className="size-3" />
            <span>Use My GPS</span>
          </button>
        </div>
      ) : null}

      {/* Fallback Vector Overlay */}
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
      <div className="relative z-10 m-2 sm:m-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111827]/85 p-1.5 text-xs text-white shadow-lg backdrop-blur-md">
          <Layers className="ml-1.5 size-4 text-[#c26e4a]" />
          <span className="hidden sm:inline text-[11px] font-medium text-white/70">
            Satellite Layer:
          </span>
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
      <div className="relative z-10 m-2 sm:m-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md">
          <span className="font-semibold text-white">
            {capturePoint
              ? `${capturePoint.lon.toFixed(4)}°E, ${capturePoint.lat.toFixed(4)}°N`
              : activeParcel
                ? activeParcel.name
                : 'Interactive Field Map'}
          </span>
          <span className="text-white/40">·</span>
          <span className="tabular text-white/80">
            {activeParcel?.areaHa
              ? `${activeParcel.areaHa.toFixed(2)} ha`
              : activeParcel?.geometry.type === 'Point'
                ? 'GPS Point'
                : captureMode
                  ? 'Click to capture'
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
