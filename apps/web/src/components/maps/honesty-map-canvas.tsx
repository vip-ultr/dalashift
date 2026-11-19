'use client';

import { SPATIAL_RESOLUTION_METRES, type SpatialResolutionKey } from '@dalashift/shared/constants';
import { searchKanoPlaces } from '@dalashift/shared/geo';
import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { area, length } from '@turf/turf';
import {
  ChevronDown,
  Layers3,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  PenLine,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TerraDraw,
  TerraDrawModeUndoRedo,
  TerraDrawPolygonMode,
  type GeoJSONStoreFeatures,
} from 'terra-draw';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
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

type GridOverlayOption = {
  readonly key: SpatialResolutionKey;
  readonly label: string;
  readonly source: string;
  readonly metres: number;
  readonly color: string;
};

function getGridOverlayOptions(
  t: (id: string, vars?: Record<string, string | number>) => string,
): readonly GridOverlayOption[] {
  return [
    {
      key: 'smapSoilMoisture',
      label: t('map.gridSmap'),
      source: 'NASA SMAP L3',
      metres: SPATIAL_RESOLUTION_METRES.smapSoilMoisture,
      color: '#76a1c2',
    },
    {
      key: 'chirps',
      label: t('map.gridChirps'),
      source: 'CHIRPS v3',
      metres: SPATIAL_RESOLUTION_METRES.chirps,
      color: '#2c5282',
    },
    {
      key: 'soilGrids',
      label: t('map.gridSoilGrids'),
      source: 'SoilGrids 2.0',
      metres: SPATIAL_RESOLUTION_METRES.soilGrids,
      color: '#c26e4a',
    },
    {
      key: 'landsat',
      label: t('map.gridLandsat'),
      source: 'NASA/USGS Landsat C2',
      metres: SPATIAL_RESOLUTION_METRES.landsat,
      color: '#0a4232',
    },
    {
      key: 'powerLatitude',
      label: t('map.gridPower'),
      source: 'NASA POWER',
      metres: SPATIAL_RESOLUTION_METRES.powerLatitude,
      color: '#b45309',
    },
  ];
}

/** Generic regional view centre (Tofa LGA, Kano State). Used only as an initial
 * camera position. It is never captured as a parcel location. */
const DEFAULT_CENTER: [number, number] = [8.271, 12.05];

/** The three user facing modes the touch toolbar switches between. `select`
 * is simply the absence of drawing or capture and needs no special state. */
type MapMode = 'select' | 'draw' | 'capture';

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

/** Area of a terra-draw feature in hectares, or null when the shape is not yet
 * a real polygon. Used only for the live "about X hectares" chip. */
function polygonAreaHa(feature: GeoJSONStoreFeatures): number | null {
  if (feature.geometry.type !== 'Polygon') return null;
  const ring = feature.geometry.coordinates[0];
  if (!ring || ring.length < 3) return null;
  const coords = ring
    .filter((c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map((c) => [c[0]!, c[1]!] as [number, number]);
  if (coords.length < 3) return null;
  try {
    const closed = closeRing([coords])[0]!;
    const sqm = area({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [closed] },
    });
    return Number.isFinite(sqm) && sqm > 0 ? sqm / 10_000 : null;
  } catch {
    return null;
  }
}

/** Perimeter of a terra-draw feature in metres, or null until it is a real
 * polygon. Used only for the live measurement pill shown while drawing. */
function polygonPerimeterM(feature: GeoJSONStoreFeatures): number | null {
  if (feature.geometry.type !== 'Polygon') return null;
  const ring = feature.geometry.coordinates[0];
  if (!ring || ring.length < 2) return null;
  const coords = ring
    .filter((c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
    .map((c) => [c[0]!, c[1]!] as [number, number]);
  if (coords.length < 2) return null;
  try {
    const closed = closeRing([coords])[0]!;
    // Turf returns length in kilometres; the measurement chip shows metres.
    const kilometres = length({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: closed },
    });
    const metres = kilometres * 1000;
    return Number.isFinite(metres) && metres > 0 ? metres : null;
  } catch {
    return null;
  }
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
  const { t } = useLanguage();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);

  const [selectedGridKey, setSelectedGridKey] =
    useState<SpatialResolutionKey>(initialResolutionKey);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showMapDetails, setShowMapDetails] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);

  // The toolbar owns a local mode so Done / Cancel / Select can leave draw or
  // capture without new props. Props still seed and re-drive the mode when the
  // parent changes them.
  const [mode, setMode] = useState<MapMode>(() =>
    captureMode ? 'capture' : interactiveDraw ? 'draw' : 'select',
  );
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    const seen = new Set<string>();
    return searchKanoPlaces(searchQuery, 8).filter((place) => {
      const key = place.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [searchQuery]);
  const [previewAreaHa, setPreviewAreaHa] = useState<number | null>(null);
  const [previewPerimeterM, setPreviewPerimeterM] = useState<number | null>(null);
  const [chooser, setChooser] = useState<{
    x: number;
    y: number;
    options: { id: string; name: string }[];
  } | null>(null);

  const drawActive = mode === 'draw';

  // Callbacks and dynamic values are kept in refs so a new inline function
  // from a parent never forces the MapLibre instance to be rebuilt.
  const onSelectParcelRef = useRef(onSelectParcel);
  const onCoordinateCaptureRef = useRef(onCoordinateCapture);
  const onGeometryChangeRef = useRef(onGeometryChange);
  const drawActiveRef = useRef(drawActive);
  onSelectParcelRef.current = onSelectParcel;
  onCoordinateCaptureRef.current = onCoordinateCapture;
  onGeometryChangeRef.current = onGeometryChange;
  drawActiveRef.current = drawActive;

  const parcelsRef = useRef(parcels);
  parcelsRef.current = parcels;
  const capturePointRef = useRef(capturePoint);
  capturePointRef.current = capturePoint;

  // Mirror parent driven capture/draw changes into the local mode. Only react
  // to an actual prop change so a local Cancel is not immediately undone.
  const previousControlsRef = useRef({ captureMode, interactiveDraw });
  useEffect(() => {
    const previous = previousControlsRef.current;
    if (captureMode !== previous.captureMode) {
      setMode(captureMode ? 'capture' : 'select');
    } else if (interactiveDraw !== previous.interactiveDraw) {
      setMode(interactiveDraw ? 'draw' : 'select');
    }
    previousControlsRef.current = { captureMode, interactiveDraw };
  }, [captureMode, interactiveDraw]);

  const effectiveParcelId = activeParcelId ?? selectedParcelId;
  const effectiveParcelIdRef = useRef(effectiveParcelId);
  effectiveParcelIdRef.current = effectiveParcelId;
  const activeParcel = parcels.find((p) => p.id === effectiveParcelId) ?? parcels[0] ?? null;

  const gridOverlayOptions = useMemo(() => getGridOverlayOptions(t), [t]);
  const activeGridOption =
    gridOverlayOptions.find((opt) => opt.key === selectedGridKey) ?? gridOverlayOptions[0]!;

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
    setTileError(false);

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const { Map, setWorkerUrl } = await import('maplibre-gl');
        // MapLibre v6 uses a dedicated worker to parse and render vector and
        // GeoJSON sources, including the field polygons drawn with terra-draw.
        // With webpack/Next the default worker URL cannot be resolved, so the
        // worker fails to load and drawn geometry never appears on screen. Point
        // it at the self-contained worker copied into public/ at build time.
        setWorkerUrl('/maplibre-gl-worker.mjs');
        if (isDisposed || !mapContainerRef.current) return;

        const satelliteTiles =
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        const streetTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

        // Both basemaps below document zoom 19 as their deepest real tile
        // level. Declaring it on the source makes MapLibre overzoom the last
        // real tile instead of requesting tiles that do not exist, which was
        // leaving blank imagery at high zoom. Recheck this limit if the tile
        // provider changes.
        const BASEMAP_MAX_ZOOM = 19;

        const mapStyle = {
          version: 8 as const,
          sources: {
            'raster-tiles': {
              type: 'raster' as const,
              tiles: [basemapStyle === 'satellite' ? satelliteTiles : streetTiles],
              tileSize: 256,
              maxzoom: BASEMAP_MAX_ZOOM,
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
              maxzoom: BASEMAP_MAX_ZOOM,
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
          // Keep basemap attribution on the map at all times. The global
          // footer carries the data attribution as well.
          attributionControl: { compact: true },
          // Above the provider limit MapLibre scales the last real tile.
          maxZoom: 22,
        });

        mapInstance = map;
        mapInstanceRef.current = map;

        map.on('error', (event: unknown) => {
          // Only tile failures surface a note. Raw error text never reaches
          // the screen and the farmer's polygon stays drawn underneath it.
          const detail = event as { sourceId?: string; error?: { message?: string } };
          const message = detail.error?.message ?? '';
          const isTileFailure =
            detail.sourceId === 'raster-tiles' ||
            /tile|imagery|fetch|network|http|load/i.test(message);
          if (isTileFailure) setTileError(true);
        });

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
              paint: { 'fill-color': '#0a4232', 'fill-opacity': 0.3 },
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
                'circle-color': '#0a4232',
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
                if (drawActiveRef.current) return;
                const clickEvent = event as {
                  features?: Array<{ properties?: { id?: string; name?: string } }>;
                  point?: { x: number; y: number };
                };
                const matches = (clickEvent.features ?? [])
                  .map((feature) => ({
                    id: feature.properties?.id,
                    name: feature.properties?.name ?? t('map.unnamedField'),
                  }))
                  .filter((item): item is { id: string; name: string } => Boolean(item.id));
                const unique = matches.filter(
                  (item, index, list) => list.findIndex((other) => other.id === item.id) === index,
                );
                if (unique.length === 0) return;
                if (unique.length === 1) {
                  setChooser(null);
                  onSelectParcelRef.current?.(unique[0]!.id);
                } else {
                  // Overlapping fields: let the farmer pick instead of
                  // silently taking the first hit.
                  setChooser({
                    x: clickEvent.point?.x ?? 0,
                    y: clickEvent.point?.y ?? 0,
                    options: unique,
                  });
                }
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
                'circle-color': '#0a4232',
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
          setChooser(null);
          if (drawActiveRef.current) return;
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
      // Reset the load flag so every sync effect (parcels, selection, capture,
      // footprint and drawing) re-runs against the new map after a basemap
      // switch. Without this the effects kept pointing at the removed map.
      setMapLoaded(false);
      drawRef.current?.stop();
      drawRef.current = null;
      if (mapInstance) {
        mapInstance.remove();
        mapInstanceRef.current = null;
      }
    };
    // basemapStyle is the only reason to rebuild the map. Callbacks, parcels,
    // selection, capture and drawing state are handled by dedicated effects.
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

  // Highlight the edited parcel with a thick white outline and dim the rest.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !map.getLayer('parcels-selected-stroke')) return;
    const editedId = effectiveParcelId ?? '';
    map.setFilter('parcels-selected-stroke', [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['==', ['get', 'id'], editedId],
    ]);
    map.setPaintProperty('parcels-selected-stroke', 'line-width', 6);
    map.setPaintProperty('parcels-selected-stroke', 'line-opacity', 1);
    map.setPaintProperty('parcels-fill', 'fill-opacity', [
      'case',
      ['==', ['get', 'id'], editedId],
      0.32,
      0.1,
    ]);
    map.setPaintProperty('parcels-stroke', 'line-opacity', [
      'case',
      ['==', ['get', 'id'], editedId],
      1,
      0.35,
    ]);
  }, [effectiveParcelId, mapLoaded]);

  // terra-draw polygon mode, started only while drawing is requested.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    if (!drawActive) {
      drawRef.current?.stop();
      drawRef.current = null;
      setPreviewAreaHa(null);
      setPreviewPerimeterM(null);
      return;
    }

    // The adapter paints the outline terracotta by default. Override it on the
    // live draw layer so the field reads clearly over dark satellite imagery.
    // The vertex dots are already painted white with a green ring by the adapter.
    const paintDrawWhite = () => {
      if (map.getLayer('terra-draw-polygon-outline')) {
        map.setPaintProperty('terra-draw-polygon-outline', 'line-color', '#ffffff');
      }
    };

    const draw = new TerraDraw({
      adapter: new MapLibreTerraDrawAdapter(map),
      // Coordinate points put a real vertex marker at every placed corner, not
      // just the two closing handles. The adapter paints them as warm-white
      // dots with a green ring so the growing shape is legible on imagery.
      modes: [new TerraDrawPolygonMode({ showCoordinatePoints: true })],
      // Without a mode-level history stack, draw.undo() is a no-op and the
      // Undo button silently fails while a polygon is being drawn.
      undoRedo: { modeLevel: new TerraDrawModeUndoRedo() },
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
      // Leave draw mode once the shape is saved. Otherwise the dark drawing
      // bar stays on screen and Done appears to do nothing, and a second
      // tap on the map starts another polygon unexpectedly. The finished
      // outline is rendered from the parcels prop, not from TerraDraw.
      draw.setMode('static');
      setMode('select');
    });
    draw.on('change', () => {
      paintDrawWhite();
      const snapshot = draw.getSnapshot();
      const inProgress =
        snapshot.find(
          (feature) =>
            feature.geometry.type === 'Polygon' && feature.properties?.currentlyDrawing === true,
        ) ?? snapshot.find((feature) => feature.geometry.type === 'Polygon');
      setPreviewAreaHa(inProgress ? polygonAreaHa(inProgress) : null);
      setPreviewPerimeterM(inProgress ? polygonPerimeterM(inProgress) : null);
    });
    draw.start();
    draw.setMode('polygon');
    paintDrawWhite();

    return () => {
      draw.stop();
      if (drawRef.current === draw) drawRef.current = null;
      setPreviewAreaHa(null);
      setPreviewPerimeterM(null);
    };
  }, [drawActive, mapLoaded]);

  /**
   * Finish the in-progress polygon from the Done control. Polygon mode closes
   * the shape on its configured finish key, so replay that key on the map
   * canvas: the same public path a farmer gets from pressing Enter, which
   * fires the normal 'finish' event and reports geometry through
   * onGeometryChange. A synthetic click on the first vertex was unreliable
   * because the adapter's drag threshold and closing hit area can swallow it.
   */
  const handleDoneDrawing = () => {
    const map = mapInstanceRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;
    const inProgress = draw
      .getSnapshot()
      .find(
        (feature) =>
          feature.geometry.type === 'Polygon' && feature.properties?.currentlyDrawing === true,
      );
    // close() needs at least three placed corners; keep drawing until then.
    if (
      !inProgress ||
      inProgress.geometry.type !== 'Polygon' ||
      (inProgress.geometry.coordinates[0]?.length ?? 0) < 5
    ) {
      return;
    }
    map
      .getCanvas()
      .dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
  };

  const handleUndoDrawing = () => {
    drawRef.current?.undo();
  };

  const handleClearDrawing = () => {
    const draw = drawRef.current;
    if (!draw) return;
    // draw.clear() alone only clears the adapter's rendering. Restarting the
    // mode runs its cleanUp(), which removes the in-progress feature from the
    // store and resets the vertex counter, then clear() empties any residue.
    draw.setMode('polygon');
    draw.clear();
    setPreviewAreaHa(null);
    setPreviewPerimeterM(null);
  };

  const handleUseCurrentLocation = () => {
    setLocationError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError(t('map.locationUnsupported'));
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
        setLocationError(t('map.locationDenied'));
      },
    );
  };

  const exitMode = () => {
    setMode('select');
  };

  const pillBase =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-card/70 px-2.5 text-[13px] font-medium leading-none text-ink shadow-sm backdrop-blur-sm transition-colors duration-150 motion-reduce:transition-none touch-manipulation sm:h-10';
  const roundControl =
    'flex size-11 items-center justify-center rounded-full border border-border bg-surface-card/70 text-ink shadow-sm backdrop-blur-sm transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-card/90 touch-manipulation';
  const statusAction =
    'min-h-7 rounded-md border border-white/20 bg-white/10 px-2 text-xs font-medium leading-none text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-white/20 touch-manipulation cursor-pointer';

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
        className={cn('absolute inset-0 size-full', mode === 'capture' && 'cursor-crosshair')}
      />

      {!webglSupported ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f2e22] p-6 text-center text-white">
          <MapPin className="mb-2 size-5 text-[#0a4232]" />
          <h4 className="font-display text-sm font-bold">{t('map.previewUnavailable')}</h4>
          <p className="mt-1 max-w-sm text-xs text-white/70">{t('map.previewUnavailableBody')}</p>
        </div>
      ) : null}

      {!mapLoaded && webglSupported ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/60 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-white/80">
            <span className="size-2 animate-ping rounded-full bg-[#0a4232]" />
            <span>{t('map.loadingImagery')}</span>
          </div>
        </div>
      ) : null}

      {tileError && mapLoaded && webglSupported && showMapDetails && mode === 'select' ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center px-3">
          <p
            role="status"
            className="max-w-[62%] rounded-lg border border-surface-border bg-surface-card/70 px-3 py-1.5 text-center text-xs leading-snug text-ink-muted shadow-sm backdrop-blur-sm"
          >
            {t('map.imageryUnavailable')}
          </p>
        </div>
      ) : null}

      {/* Top-left field pill: name and area only, no solid card. */}
      {showMapDetails && mode === 'select' ? (
        <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[62%] sm:left-3 sm:top-3">
          <div className={pillBase}>
            <span className="min-w-0 max-w-[120px] truncate font-semibold sm:max-w-[180px]">
              {capturePoint
                ? `${capturePoint.lon.toFixed(4)}°E, ${capturePoint.lat.toFixed(4)}°N`
                : activeParcel
                  ? activeParcel.name
                  : t('map.fieldMap')}
            </span>
            {activeParcel?.areaHa ? (
              <span className="shrink-0 font-normal text-ink-muted">
                {activeParcel.areaHa.toFixed(2)} ha
              </span>
            ) : null}
            <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          </div>
        </div>
      ) : null}

      {/* Top-right controls: offline Kano place search and map layers. */}
      <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-start gap-1.5 sm:right-3 sm:top-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setLayersOpen(false);
              setSearchOpen((open) => !open);
            }}
            aria-label={t('map.searchAria')}
            title={t('map.searchAria')}
            aria-expanded={searchOpen}
            aria-controls="map-place-search"
            className={cn(pillBase, 'pointer-events-auto cursor-pointer')}
          >
            <Search className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchOpen(false);
            setLayersOpen((open) => !open);
          }}
          aria-label={t('map.layersTitle')}
          title={t('map.layersTitle')}
          aria-pressed={layersOpen}
          className={cn(pillBase, 'pointer-events-auto cursor-pointer')}
        >
          <Layers3 className="size-[18px]" aria-hidden="true" />
          <span className="hidden sm:inline">{t('map.layers')}</span>
        </button>
      </div>

      {/* The panel is a sibling of the controls so its width follows the map,
          not the viewport. On phones the map is narrower than the screen. */}
      {searchOpen ? (
        <div
          id="map-place-search"
          className="pointer-events-auto absolute inset-x-2 top-12 z-40 rounded-lg border border-border bg-surface-card/85 p-2 shadow-sm backdrop-blur-sm sm:inset-x-auto sm:right-3 sm:w-80"
        >
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('map.searchPlaceholder')}
            aria-label={t('map.searchAria')}
            className="w-full rounded-md border border-border bg-surface-card/70 px-2 py-1.5 text-xs text-ink placeholder:text-ink-muted/70 placeholder:opacity-80 focus:border-brand-primary focus:outline-none"
          />
          <p className="mt-1 px-1 text-xs leading-snug text-ink-muted">{t('map.searchHint')}</p>
          <ul className="mt-1 max-h-40 overflow-y-auto">
            {searchResults.map((place) => (
              <li key={`${place.kind}-${place.name}`}>
                <button
                  type="button"
                  onClick={() => {
                    mapInstanceRef.current?.flyTo({
                      center: [place.lon, place.lat],
                      zoom: 13,
                      duration: 1200,
                    });
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex min-h-9 w-full items-center rounded-md px-2 text-left text-xs text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
                >
                  {place.name}
                </button>
              </li>
            ))}
            {searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
              <li className="px-2 py-1.5 text-xs leading-snug text-ink-muted">
                {t('map.searchNoResults')}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {/* Right-edge map controls: zoom, zoom out, my location. */}
      <div className="pointer-events-none absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 sm:right-3">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label={t('map.zoomIn')}
          title={t('map.zoomIn')}
          className={cn(roundControl, 'pointer-events-auto cursor-pointer')}
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label={t('map.zoomOut')}
          title={t('map.zoomOut')}
          className={cn(roundControl, 'pointer-events-auto cursor-pointer')}
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          aria-label={t('map.myLocation')}
          title={t('map.myLocation')}
          className={cn(roundControl, 'pointer-events-auto cursor-pointer')}
        >
          <LocateFixed className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Compact draw entry so the map keeps its Select / Draw / Location tools
          without a wide bottom toolbar. Props still seed the starting mode. */}
      {mode !== 'draw' ? (
        <div className="pointer-events-none absolute bottom-2 left-2 z-20 sm:bottom-3 sm:left-3">
          <button
            type="button"
            onClick={() => setMode('draw')}
            aria-label={t('map.drawBoundary')}
            title={t('map.drawField')}
            className={cn(pillBase, 'pointer-events-auto cursor-pointer')}
          >
            <PenLine className="size-[18px]" aria-hidden="true" />
            <span className="hidden sm:inline">{t('map.drawField')}</span>
          </button>
        </div>
      ) : null}

      {/* Compact status line while drawing or capturing. */}
      {(mode === 'draw' || mode === 'capture') && !searchOpen && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center p-1.5 sm:p-2">
          <div className="pointer-events-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-md border border-white/10 bg-[#111827]/70 px-2 py-1 text-white shadow-sm backdrop-blur-sm">
            <p className="text-xs font-medium leading-tight">
              {mode === 'draw' ? t('map.tapEachCorner') : t('map.tapToPlaceField')}
            </p>
            <div className="flex items-center gap-1.5">
              {mode === 'draw' ? (
                <>
                  <button type="button" onClick={handleDoneDrawing} className={statusAction}>
                    {t('map.done')}
                  </button>
                  <button type="button" onClick={handleUndoDrawing} className={statusAction}>
                    {t('map.undo')}
                  </button>
                  <button type="button" onClick={handleClearDrawing} className={statusAction}>
                    {t('map.clear')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className={cn(statusAction, 'inline-flex items-center gap-1.5')}
                >
                  <Navigation className="size-3.5" aria-hidden="true" />
                  {t('map.useGps')}
                </button>
              )}
              <button
                type="button"
                onClick={exitMode}
                aria-label={t('map.cancelAria')}
                className="min-h-7 rounded-md px-1 text-xs font-medium leading-none text-white/80 transition-colors duration-150 motion-reduce:transition-none hover:text-white touch-manipulation cursor-pointer"
              >
                {t('map.cancel')}
              </button>
            </div>
          </div>
          {locationError ? (
            <p
              role="alert"
              className="mt-1.5 max-w-md rounded-lg border border-white/10 bg-[#111827]/70 px-2.5 py-1.5 text-center text-xs leading-snug text-white/90 backdrop-blur-sm"
            >
              {locationError}
            </p>
          ) : null}
        </div>
      )}

      {/* Bottom-centre live measurement, only while drawing. */}
      {mode === 'draw' && !layersOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-3 sm:bottom-3">
          <div
            role="status"
            aria-live="polite"
            className="rounded-full border border-white/10 bg-[#111827]/70 px-3 py-1.5 text-[13px] font-medium tabular-nums text-white shadow-sm backdrop-blur-sm"
          >
            {previewAreaHa != null && previewPerimeterM != null
              ? t('map.areaPerimeter', {
                  area: previewAreaHa.toFixed(2),
                  perimeter: Math.round(previewPerimeterM),
                })
              : previewAreaHa != null
                ? t('map.areaOnly', { area: previewAreaHa.toFixed(2) })
                : t('map.tapCornersMeasure')}
          </div>
        </div>
      ) : null}

      {/* Overlapping-field chooser. */}
      {chooser ? (
        <div
          className="absolute z-40"
          style={{ left: chooser.x, top: chooser.y, transform: 'translate(-50%, -110%)' }}
        >
          <div className="w-max max-w-[220px] rounded-lg border border-border bg-surface-card/80 p-1 shadow-sm backdrop-blur-sm">
            <p className="px-2 py-1 text-xs text-ink-muted">{t('map.whichField')}</p>
            {chooser.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelectParcelRef.current?.(option.id);
                  setChooser(null);
                }}
                className="block min-h-11 w-full rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Layers bottom sheet. It may be wider than the edge pills only while open. */}
      {layersOpen ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-2 z-40 px-2 sm:bottom-3 sm:px-3">
          <div className="mx-auto max-h-[70%] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface-card/80 p-2.5 shadow-sm backdrop-blur-sm sm:max-h-[calc(100%-1rem)] sm:p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{t('map.layersTitle')}</h3>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                aria-label={t('map.closeLayers')}
                className="flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint hover:text-brand-primary touch-manipulation cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label htmlFor="map-data-layer" className="block text-xs font-medium text-ink-muted">
              {t('map.dataLayer')}
            </label>
            <Select
              value={selectedGridKey}
              onValueChange={(value) => setSelectedGridKey(value as SpatialResolutionKey)}
            >
              <SelectTrigger
                id="map-data-layer"
                aria-label={t('map.dataLayerAria')}
                className="mt-1"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gridOverlayOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label
              htmlFor="map-cell-footprint"
              className="mt-1 flex min-h-9 cursor-pointer items-center justify-between gap-2 touch-manipulation"
            >
              <span className="text-xs text-ink">{t('map.showFootprint')}</span>
              <Switch
                id="map-cell-footprint"
                checked={showGridOverlay}
                onCheckedChange={setShowGridOverlay}
                aria-label={t('map.showFootprint')}
              />
            </label>
            <label
              htmlFor="map-hide-details"
              className="flex min-h-9 cursor-pointer items-center justify-between gap-2 touch-manipulation"
            >
              <span className="text-xs text-ink">{t('map.hideDetails')}</span>
              <Switch
                id="map-hide-details"
                checked={!showMapDetails}
                onCheckedChange={(checked) => setShowMapDetails(!checked)}
                aria-label={t('map.hideDetails')}
              />
            </label>

            <div className="mt-1.5">
              <span className="text-xs font-medium text-ink-muted">{t('map.basemap')}</span>
              <div className="mt-1 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setBasemapStyle('satellite')}
                  aria-pressed={basemapStyle === 'satellite'}
                  className={cn(
                    'min-h-9 flex-1 rounded-md border text-xs font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer',
                    basemapStyle === 'satellite'
                      ? 'border-brand-primary bg-brand-primary/85 text-white'
                      : 'border-border bg-surface-card/70 text-ink',
                  )}
                >
                  {t('map.satellite')}
                </button>
                <button
                  type="button"
                  onClick={() => setBasemapStyle('street')}
                  aria-pressed={basemapStyle === 'street'}
                  className={cn(
                    'min-h-9 flex-1 rounded-md border text-xs font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer',
                    basemapStyle === 'street'
                      ? 'border-brand-primary bg-brand-primary/85 text-white'
                      : 'border-border bg-surface-card/70 text-ink',
                  )}
                >
                  {t('map.streets')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
