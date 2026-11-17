'use client';

import { SPATIAL_RESOLUTION_METRES, type SpatialResolutionKey } from '@dalashift/shared/constants';
import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { area } from '@turf/turf';
import { AlertCircle, Crosshair, Layers, MapPin, Navigation } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TerraDraw, TerraDrawPolygonMode } from 'terra-draw';
import 'maplibre-gl/dist/maplibre-gl.css';

import { cn } from '../../lib/utilities/cn';
import { formatResolutionShortBadge } from '../../lib/utilities/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MapLibreTerraDrawAdapter } from './terra-draw-maplibre-adapter';

export interface HonestyMapCanvasProps {
  readonly parcels?: readonly Parcel[];
  readonly activeParcelId?: string | null;
  readonly selectedParcelId?: string | null;
  readonly onSelectParcel?: (parcelId: string) => void;
  readonly onCoordinateCapture?: (lon: number, lat: number) => void;
  readonly captureMode?: boolean;
  readonly capturePoint?: { lon: number; lat: number } | null;
  readonly initialResolutionKey?: SpatialResolutionKey;
  /** Enable terra-draw polygon drawing and report the finished geometry. */
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

/** Generic regional view centre (Tofa LGA, Kano State). Used only as an initial
 * camera position. It is never captured as a parcel location. */
const DEFAULT_CENTER: [number, number] = [8.271, 12.05];

function representativePoint(geometry: GeoJSONGeometry): [number, number] | null {
  if (geometry.type === 'Point') {
    const lon = geometry.coordinates[0];
    const lat = geometry.coordinates[1];
    return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
  }
  const ring: readonly (readonly [number, number])[] =
    geometry.type === 'Polygon'
      ? (geometry.coordinates[0] ?? [])
      : (geometry.coordinates[0]?.[0] ?? []);
  if (ring.length === 0) return null;
  let lon = 0;
  let lat = 0;
  for (const point of ring) {
    lon += point[0];
    lat += point[1];
  }
  return [lon / ring.length, lat / ring.length];
}

function closeRing(coordinates: [number, number][][]): [number, number][][] {
  if (coordinates.length === 0) return coordinates;
  const ring = coordinates[0]!;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && first[0] === last[0] && first[1] === last[1]) return coordinates;
  return [[...ring, [first![0], first![1]]]];
}

export function HonestyMapCanvas({
  parcels = [],
  activeParcelId,
  selectedParcelId,
  onSelectParcel,
  onCoordinateCapture,
  captureMode = false,
  capturePoint,
  initialResolutionKey = 'smapSoilMoisture',
  interactiveDraw = false,
  onGeometryChange,
  heightClass = 'h-[500px]',
  className,
}: HonestyMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);

  const [selectedGridKey, setSelectedGridKey] =
    useState<SpatialResolutionKey>(initialResolutionKey);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Callbacks are kept in refs so a new inline function from a parent never
  // forces the MapLibre instance to be rebuilt.
  const onSelectParcelRef = useRef(onSelectParcel);
  const onCoordinateCaptureRef = useRef(onCoordinateCapture);
  const onGeometryChangeRef = useRef(onGeometryChange);
  const interactiveDrawRef = useRef(interactiveDraw);
  onSelectParcelRef.current = onSelectParcel;
  onCoordinateCaptureRef.current = onCoordinateCapture;
  onGeometryChangeRef.current = onGeometryChange;
  interactiveDrawRef.current = interactiveDraw;

  const parcelsRef = useRef(parcels);
  parcelsRef.current = parcels;
  const capturePointRef = useRef(capturePoint);
  capturePointRef.current = capturePoint;

  const effectiveParcelId = activeParcelId ?? selectedParcelId;
  const activeParcel = parcels.find((p) => p.id === effectiveParcelId) ?? parcels[0] ?? null;

  const activeGridOption =
    GRID_OVERLAY_OPTIONS.find((opt) => opt.key === selectedGridKey) ?? GRID_OVERLAY_OPTIONS[0]!;

  // Real GeoJSON features: polygons keep their drawn vertices; points stay points.
  const parcelFeatures = useMemo(() => {
    return parcels.map((p) => ({
      type: 'Feature' as const,
      properties: { id: p.id, name: p.name },
      geometry: p.geometry as unknown as GeoJSON.Feature['geometry'],
    }));
  }, [parcels]);

  // Initialise MapLibre once per basemap choice. Parent re-renders do not
  // recreate the map because every dynamic value is read through a ref.
  useEffect(() => {
    let mapInstance: MapLibreMap | null = null;
    let isDisposed = false;

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const { Map } = await import('maplibre-gl');
        if (isDisposed || !mapContainerRef.current) return;

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

        const currentParcels = parcelsRef.current;
        const currentCapturePoint = capturePointRef.current;
        const allCoords: [number, number][] = [];
        for (const parcel of currentParcels) {
          const point = representativePoint(parcel.geometry);
          if (point) allCoords.push(point);
        }
        if (currentCapturePoint) {
          allCoords.push([currentCapturePoint.lon, currentCapturePoint.lat]);
        }

        const centerLng = allCoords.length
          ? allCoords.reduce((sum, pt) => sum + pt[0], 0) / allCoords.length
          : DEFAULT_CENTER[0];
        const centerLat = allCoords.length
          ? allCoords.reduce((sum, pt) => sum + pt[1], 0) / allCoords.length
          : DEFAULT_CENTER[1];

        const map = new Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: [centerLng, centerLat],
          zoom: allCoords.length ? 15.5 : 13.5,
          attributionControl: false,
        });

        mapInstance = map;
        mapInstanceRef.current = map;

        const fitParcels = () => {
          if (allCoords.length < 2) return;
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
        };

        const resizeObserver = new ResizeObserver(() => map.resize());
        if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);

        const resizeTimer = setTimeout(() => map.resize(), 200);
        const loadTimer = setTimeout(() => {
          if (!isDisposed) {
            setMapLoaded(true);
            map.resize();
          }
        }, 1200);

        const setupLayers = () => {
          if (isDisposed) return;
          clearTimeout(loadTimer);
          clearTimeout(resizeTimer);
          setMapLoaded(true);
          map.resize();
          fitParcels();

          if (!map.getSource('parcels-source')) {
            map.addSource('parcels-source', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: parcelFeatures },
            });
            map.addLayer({
              id: 'parcels-fill',
              type: 'fill',
              source: 'parcels-source',
              filter: ['==', ['geometry-type'], 'Polygon'],
              paint: { 'fill-color': '#00b159', 'fill-opacity': 0.3 },
            });
            map.addLayer({
              id: 'parcels-stroke',
              type: 'line',
              source: 'parcels-source',
              filter: ['==', ['geometry-type'], 'Polygon'],
              paint: { 'line-color': '#facc15', 'line-width': 3 },
            });
            map.addLayer({
              id: 'parcels-point-halo',
              type: 'circle',
              source: 'parcels-source',
              filter: ['==', ['geometry-type'], 'Point'],
              paint: {
                'circle-radius': 12,
                'circle-color': '#facc15',
                'circle-opacity': 0.3,
              },
            });
            map.addLayer({
              id: 'parcels-point',
              type: 'circle',
              source: 'parcels-source',
              filter: ['==', ['geometry-type'], 'Point'],
              paint: {
                'circle-radius': 6,
                'circle-color': '#00b159',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });
            map.addLayer({
              id: 'parcels-selected-stroke',
              type: 'line',
              source: 'parcels-source',
              filter: ['==', ['geometry-type'], 'Polygon'],
              paint: { 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 0.85 },
            });

            for (const layerId of ['parcels-fill', 'parcels-point']) {
              map.on('click', layerId, (event: unknown) => {
                const feature = (event as { features?: Array<{ properties?: { id?: string } }> })
                  ?.features?.[0];
                const clickedId = feature?.properties?.id;
                if (clickedId && onSelectParcelRef.current) onSelectParcelRef.current(clickedId);
              });
            }
          }

          if (currentCapturePoint && !map.getSource('capture-point-source')) {
            map.addSource('capture-point-source', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [currentCapturePoint.lon, currentCapturePoint.lat],
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

          if (!map.getSource('footprint-source')) {
            map.addSource('footprint-source', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
              id: 'footprint-fill',
              type: 'fill',
              source: 'footprint-source',
              paint: { 'fill-color': activeGridOption.color, 'fill-opacity': 0.12 },
              layout: { visibility: 'none' },
            });
            map.addLayer({
              id: 'footprint-outline',
              type: 'line',
              source: 'footprint-source',
              paint: {
                'line-color': activeGridOption.color,
                'line-width': 2,
                'line-dasharray': [4, 3],
              },
              layout: { visibility: 'none' },
            });
          }
        };

        map.on('load', setupLayers);

        // Capture clicks only when not drawing a polygon and when a parent wants them.
        map.on('click', (event: unknown) => {
          if (interactiveDrawRef.current) return;
          const evt = event as { lngLat?: { lng: number; lat: number } };
          const capture = onCoordinateCaptureRef.current;
          if (evt.lngLat && capture) {
            capture(Number(evt.lngLat.lng.toFixed(5)), Number(evt.lngLat.lat.toFixed(5)));
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
      drawRef.current?.stop();
      drawRef.current = null;
      if (mapInstance) {
        mapInstance.remove();
        mapInstanceRef.current = null;
      }
    };
    // basemapStyle is the only reason to rebuild the map. Callbacks, parcels,
    // selection and capture state are handled by dedicated effects below.
  }, [basemapStyle]);

  // Keep the rendered parcel geometry in sync with props.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    const source = map.getSource('parcels-source') as { setData?: (data: unknown) => void } | null;
    source?.setData?.({ type: 'FeatureCollection', features: parcelFeatures });
  }, [parcelFeatures, mapLoaded]);

  // Selected parcel changes move the camera to the real parcel geometry.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    const selected = parcels.find((p) => p.id === effectiveParcelId);
    if (!selected) return;
    const point = representativePoint(selected.geometry);
    if (!point) return;

    if (selected.geometry.type === 'Polygon') {
      const coords = selected.geometry.coordinates[0] ?? [];
      if (coords.length >= 2) {
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 70, maxZoom: 17, duration: 800 },
        );
        return;
      }
    }
    map.flyTo({ center: point, zoom: 16, duration: 800 });
  }, [effectiveParcelId, parcels, mapLoaded]);

  // Keep the capture point in sync.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    const source = map.getSource('capture-point-source') as
      { setData?: (data: unknown) => void } | undefined;
    if (source?.setData) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: capturePoint
          ? { type: 'Point', coordinates: [capturePoint.lon, capturePoint.lat] }
          : { type: 'Point', coordinates: [] },
      });
    }
  }, [capturePoint, mapLoaded]);

  // The resolution footprint is a real cell centred on the selected parcel and
  // sized from the selected data source's true spatial resolution.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    const source = map.getSource('footprint-source') as
      { setData?: (data: unknown) => void } | undefined;
    if (!source?.setData) return;

    const point = activeParcel ? representativePoint(activeParcel.geometry) : DEFAULT_CENTER;
    if (!point) return;
    const [lon, lat] = point;
    const latDelta = activeGridOption.metres / 111_320;
    const lonDelta =
      activeGridOption.metres / (111_320 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
    const ring = [
      [lon - lonDelta, lat - latDelta],
      [lon + lonDelta, lat - latDelta],
      [lon + lonDelta, lat + latDelta],
      [lon - lonDelta, lat + latDelta],
      [lon - lonDelta, lat - latDelta],
    ];
    source.setData({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } },
      ],
    });

    for (const layerId of ['footprint-fill', 'footprint-outline']) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', showGridOverlay ? 'visible' : 'none');
      }
    }
    if (map.getLayer('footprint-outline')) {
      map.setPaintProperty('footprint-outline', 'line-color', activeGridOption.color);
    }
    if (map.getLayer('footprint-fill')) {
      map.setPaintProperty('footprint-fill', 'fill-color', activeGridOption.color);
    }
  }, [activeParcel, activeGridOption, showGridOverlay, mapLoaded]);

  // Highlight the selected parcel outline.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !map.getLayer('parcels-selected-stroke')) return;
    map.setFilter('parcels-selected-stroke', [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['==', ['get', 'id'], effectiveParcelId ?? ''],
    ]);
  }, [effectiveParcelId, mapLoaded]);

  // terra-draw polygon mode, started only while drawing is requested.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    if (!interactiveDraw) {
      drawRef.current?.stop();
      drawRef.current = null;
      return;
    }

    const draw = new TerraDraw({
      adapter: new MapLibreTerraDrawAdapter(map),
      modes: [new TerraDrawPolygonMode()],
    });
    drawRef.current = draw;
    draw.on('finish', (featureId) => {
      const feature = draw.getSnapshotFeature(featureId);
      if (!feature || feature.geometry.type !== 'Polygon') return;
      const coordinates = closeRing(
        feature.geometry.coordinates.map((ring) =>
          ring.map((point) => [point[0], point[1]] as [number, number]),
        ),
      );
      const geometry: GeoJSONGeometry = { type: 'Polygon', coordinates };
      const sqm = area({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates },
      });
      onGeometryChangeRef.current?.(geometry, Number((sqm / 10_000).toFixed(2)));
    });
    draw.start();
    draw.setMode('polygon');

    return () => {
      draw.stop();
      if (drawRef.current === draw) drawRef.current = null;
    };
  }, [interactiveDraw, mapLoaded]);

  const handleUseCurrentLocation = () => {
    setLocationError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError(
        'This device cannot provide a location. Place the parcel on the map or enter coordinates manually.',
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lon = Number(position.coords.longitude.toFixed(5));
        const lat = Number(position.coords.latitude.toFixed(5));
        onCoordinateCaptureRef.current?.(lon, lat);
        mapInstanceRef.current?.flyTo({ center: [lon, lat], zoom: 16 });
      },
      () => {
        // Never invent a coordinate when location access is denied.
        setLocationError(
          'Location access was denied or unavailable. Click the map or enter coordinates manually. No location has been captured.',
        );
      },
    );
  };

  return (
    <div
      className={cn(
        'relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#111827] shadow-sm select-none',
        heightClass,
        className,
      )}
    >
      <div
        ref={mapContainerRef}
        className={cn('absolute inset-0 size-full', captureMode && 'cursor-crosshair')}
      />

      {!webglSupported ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f2e22] p-6 text-center text-white">
          <MapPin className="mb-2 size-8 text-[#00b159]" />
          <h4 className="font-display text-sm font-bold">Map preview unavailable</h4>
          <p className="mt-1 max-w-sm text-xs text-white/70">
            Your browser could not start the interactive map. Enter parcel coordinates using the
            fields below instead. No location has been captured automatically.
          </p>
        </div>
      ) : null}

      {!mapLoaded && webglSupported ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/70 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="size-2 animate-ping rounded-full bg-[#00b159]" />
            <span>Loading satellite land imagery...</span>
          </div>
        </div>
      ) : null}

      {captureMode ? (
        <div className="relative z-20 m-3 flex flex-col gap-2 rounded-xl border border-white/20 bg-[#111827]/90 px-3.5 py-2 text-xs text-white shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="size-4 text-[#facc15]" />
              <span className="font-semibold">
                {interactiveDraw
                  ? 'Draw the parcel boundary on the map'
                  : 'Click the map to capture a parcel location'}
              </span>
            </div>
            {!interactiveDraw ? (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-1.5 rounded-lg bg-[#00b159] px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#00964b] cursor-pointer"
              >
                <Navigation className="size-3" />
                <span>Use My GPS</span>
              </button>
            ) : null}
          </div>
          {locationError ? (
            <p role="alert" className="flex items-start gap-1.5 text-[11px] text-[#fca5a5]">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {locationError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 m-2 sm:m-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111827]/85 p-1.5 text-xs text-white shadow-lg backdrop-blur-md">
          <Layers className="ml-1.5 size-4 text-[#c26e4a]" />
          <span className="hidden sm:inline text-[11px] font-medium text-white/70">
            Data layer:
          </span>
          <Select
            value={selectedGridKey}
            onValueChange={(value) => setSelectedGridKey(value as SpatialResolutionKey)}
          >
            <SelectTrigger
              aria-label="Satellite data layer resolution overlay"
              className="h-auto w-auto rounded-lg border-white/20 bg-[#111827]/85 px-2 py-1 text-xs font-semibold text-white hover:border-white/30 focus-visible:ring-offset-[#111827]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-[#111827] text-white">
              {GRID_OVERLAY_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key} className="text-white">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setShowGridOverlay((value) => !value)}
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

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/85 px-3 py-2 text-[11px] text-white/80 shadow-lg backdrop-blur-md">
          <span className="hidden sm:inline">Cell footprint:</span>
          <span className="font-semibold text-white">
            {activeGridOption.source} · {formatResolutionShortBadge(activeGridOption.metres)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#111827]/85 p-1 text-xs text-white shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setBasemapStyle('satellite')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              basemapStyle === 'satellite'
                ? 'bg-[#0a4232] font-semibold text-white'
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
                ? 'bg-[#0a4232] font-semibold text-white'
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
