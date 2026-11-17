'use client';

import { SPATIAL_RESOLUTION_METRES, type SpatialResolutionKey } from '@dalashift/shared/constants';
import type { GeoJSONGeometry, Parcel } from '@dalashift/shared/types';
import { area } from '@turf/turf';
import {
  AlertCircle,
  Crosshair,
  LocateFixed,
  Layers3,
  MapPin,
  MousePointer2,
  Navigation,
  PenLine,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TerraDraw, TerraDrawPolygonMode, type GeoJSONStoreFeatures } from 'terra-draw';
import 'maplibre-gl/dist/maplibre-gl.css';

import { cn } from '../../lib/utilities/cn';
import { formatResolutionShortBadge } from '../../lib/utilities/format';
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
  const [previewAreaHa, setPreviewAreaHa] = useState<number | null>(null);
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
    setTileError(false);

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const { Map } = await import('maplibre-gl');
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
                if (drawActiveRef.current) return;
                const clickEvent = event as {
                  features?: Array<{ properties?: { id?: string; name?: string } }>;
                  point?: { x: number; y: number };
                };
                const matches = (clickEvent.features ?? [])
                  .map((feature) => ({
                    id: feature.properties?.id,
                    name: feature.properties?.name ?? 'Field',
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
    draw.on('change', () => {
      const snapshot = draw.getSnapshot();
      const inProgress =
        snapshot.find(
          (feature) =>
            feature.geometry.type === 'Polygon' && feature.properties?.currentlyDrawing === true,
        ) ?? snapshot.find((feature) => feature.geometry.type === 'Polygon');
      setPreviewAreaHa(inProgress ? polygonAreaHa(inProgress) : null);
    });
    draw.start();
    draw.setMode('polygon');

    return () => {
      draw.stop();
      if (drawRef.current === draw) drawRef.current = null;
      setPreviewAreaHa(null);
    };
  }, [drawActive, mapLoaded]);

  /**
   * Finish the in-progress polygon from the big Done button.
   *
   * terra-draw 1.39 exposes no public `finish()` / `close()`: polygon mode's
   * `close()` is private and the only public triggers are clicking the closing
   * vertex or pressing Enter, both unsuitable for a phone. The sanctioned
   * public fallback is to reproduce the real closing click. We read the
   * in-progress feature from `getSnapshot()`, project its first vertex to
   * screen coordinates, and dispatch a left `click` on the MapLibre canvas.
   * The adapter forwards it to polygon mode, which sees a click on its closing
   * point and calls `close()`, so the normal 'finish' event fires and the
   * geometry is reported through onGeometryChange. `bubbles: false` keeps the
   * synthetic click away from MapLibre's own parcel/capture handlers.
   */
  const handleDoneDrawing = () => {
    const draw = drawRef.current;
    const map = mapInstanceRef.current;
    if (!draw || !map) return;
    const inProgress = draw
      .getSnapshot()
      .find(
        (feature) =>
          feature.geometry.type === 'Polygon' && feature.properties?.currentlyDrawing === true,
      );
    if (!inProgress || inProgress.geometry.type !== 'Polygon') return;
    const ring = inProgress.geometry.coordinates[0];
    const first = ring?.[0];
    // Polygon mode only closes a shape with at least three real corners. With
    // fewer, close() is a no-op, so leave the farmer in drawing mode.
    if (!first || !ring || ring.length < 5) return;

    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const projected = map.project([first[0]!, first[1]!]);
    canvas.dispatchEvent(
      new MouseEvent('click', {
        bubbles: false,
        cancelable: false,
        button: 0,
        clientX: rect.left + projected.x,
        clientY: rect.top + projected.y,
      }),
    );
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
  };

  const handleUseCurrentLocation = () => {
    setLocationError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError(
        'This device cannot provide a location. Tap the map or enter coordinates manually.',
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
          'Location access was denied or unavailable. Tap the map or enter coordinates manually. No location has been captured.',
        );
      },
    );
  };

  const exitMode = () => {
    setMode('select');
  };

  const toolBase =
    'pointer-events-auto flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[12px] font-medium leading-none transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer';
  const activeTool = 'border-brand-primary bg-brand-primary text-white ring-2 ring-white';
  const inactiveTool = 'border-border bg-surface-card text-ink';

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

      {tileError && mapLoaded && webglSupported && showMapDetails ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
          <p
            role="status"
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-center text-[11px] text-ink-muted shadow-sm"
          >
            Map imagery is unavailable. Your field boundary is still shown.
          </p>
        </div>
      ) : null}

      {showMapDetails && mode === 'select' ? (
        <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[62%] sm:left-3 sm:top-3">
          <div className="rounded-xl border border-border bg-surface-card/95 px-3 py-2 text-[13px] leading-snug text-ink shadow-sm">
            <span className="block font-semibold">
              {capturePoint
                ? `${capturePoint.lon.toFixed(4)}°E, ${capturePoint.lat.toFixed(4)}°N`
                : activeParcel
                  ? activeParcel.name
                  : 'Interactive Field Map'}
            </span>
            <span className="text-ink-muted">
              {activeParcel?.areaHa
                ? `${activeParcel.areaHa.toFixed(2)} ha`
                : activeParcel?.geometry.type === 'Point'
                  ? 'GPS Point'
                  : 'Mapped Parcel'}
              {' · '}
              {activeGridOption.source} · {formatResolutionShortBadge(activeGridOption.metres)}
            </span>
          </div>
        </div>
      ) : null}

      {/* Top status stack: one plain-language instruction plus the live area chip. */}
      {(mode === 'draw' || mode === 'capture') && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-2 p-2 sm:p-3">
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-surface-card p-3 text-ink shadow-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary-tint text-brand-primary">
              {mode === 'draw' ? (
                <PenLine className="size-5" aria-hidden="true" />
              ) : (
                <Crosshair className="size-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-snug text-ink">
                {mode === 'draw'
                  ? 'Tap every corner of your field, then press Done.'
                  : 'Tap the map or use your location to place your field.'}
              </p>
              {mode === 'capture' ? (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="mt-2 inline-flex min-h-12 items-center gap-1.5 rounded-[10px] bg-brand-primary px-3 text-[14px] font-semibold text-white transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer"
                >
                  <Navigation className="size-4" aria-hidden="true" />
                  <span>Use My GPS</span>
                </button>
              ) : null}
              {locationError ? (
                <p
                  role="alert"
                  className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-[#b45309]"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{locationError}</span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={exitMode}
              aria-label="Cancel drawing or capture"
              className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface-card px-2 text-[13px] font-medium text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="ml-1">Cancel</span>
            </button>
          </div>

          {mode === 'draw' ? (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'rounded-full border bg-surface-card px-3 py-1.5 text-[13px] font-medium text-ink shadow-sm',
                previewAreaHa != null && previewAreaHa < 0.01
                  ? 'border-[#b45309]'
                  : 'border-border',
              )}
            >
              {previewAreaHa == null
                ? 'Keep tapping corners'
                : previewAreaHa < 0.01
                  ? 'Area looks too small. Keep tapping corners.'
                  : `About ${previewAreaHa.toFixed(2)} hectares`}
            </div>
          ) : null}
        </div>
      )}

      {/* Overlapping-field chooser. */}
      {chooser ? (
        <div
          className="absolute z-40"
          style={{ left: chooser.x, top: chooser.y, transform: 'translate(-50%, -110%)' }}
        >
          <div className="w-max max-w-[220px] rounded-xl border border-border bg-surface-card p-1 shadow-sm">
            <p className="px-2 py-1 text-[11px] text-ink-muted">Which field?</p>
            {chooser.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelectParcelRef.current?.(option.id);
                  setChooser(null);
                }}
                className="block min-h-12 w-full rounded-lg px-2 py-2 text-left text-[13px] text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Layers bottom sheet, above the toolbar. */}
      {layersOpen ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-[96px] z-30 px-2 sm:px-3">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">Map layers</h3>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                aria-label="Close layers"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-[10px] text-ink-muted transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint hover:text-brand-primary touch-manipulation cursor-pointer"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <label
              htmlFor="map-data-layer"
              className="block text-[13px] font-medium text-ink-muted"
            >
              Satellite data layer
            </label>
            <Select
              value={selectedGridKey}
              onValueChange={(value) => setSelectedGridKey(value as SpatialResolutionKey)}
            >
              <SelectTrigger
                id="map-data-layer"
                aria-label="Satellite data layer resolution overlay"
                className="mt-1"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRID_OVERLAY_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label
              htmlFor="map-cell-footprint"
              className="mt-2 flex min-h-12 cursor-pointer items-center justify-between gap-3 touch-manipulation"
            >
              <span className="text-[14px] text-ink">Show cell footprint</span>
              <Switch
                id="map-cell-footprint"
                checked={showGridOverlay}
                onCheckedChange={setShowGridOverlay}
                aria-label="Show cell footprint"
              />
            </label>
            <label
              htmlFor="map-hide-details"
              className="flex min-h-12 cursor-pointer items-center justify-between gap-3 touch-manipulation"
            >
              <span className="text-[14px] text-ink">Hide map details</span>
              <Switch
                id="map-hide-details"
                checked={!showMapDetails}
                onCheckedChange={(checked) => setShowMapDetails(!checked)}
                aria-label="Hide map details"
              />
            </label>

            <div className="mt-2">
              <span className="text-[13px] font-medium text-ink-muted">Basemap</span>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBasemapStyle('satellite')}
                  aria-pressed={basemapStyle === 'satellite'}
                  className={cn(
                    'min-h-12 flex-1 rounded-[10px] border text-[14px] font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer',
                    basemapStyle === 'satellite'
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-border bg-surface-card text-ink',
                  )}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setBasemapStyle('street')}
                  aria-pressed={basemapStyle === 'street'}
                  className={cn(
                    'min-h-12 flex-1 rounded-[10px] border text-[14px] font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation cursor-pointer',
                    basemapStyle === 'street'
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : 'border-border bg-surface-card text-ink',
                  )}
                >
                  Streets
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Persistent bottom toolbar. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-2 sm:p-3">
        <div className="pointer-events-auto mx-auto w-full max-w-md space-y-2">
          {drawActive ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-card p-2 shadow-sm">
              <button
                type="button"
                onClick={handleDoneDrawing}
                className="min-h-12 flex-[2] rounded-xl bg-brand-primary text-[15px] font-semibold text-white ring-2 ring-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-hover touch-manipulation cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleUndoDrawing}
                className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-surface-card text-[14px] font-medium text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
              >
                <Undo2 className="size-4" aria-hidden="true" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleClearDrawing}
                className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-surface-card text-[14px] font-medium text-ink transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-primary-tint touch-manipulation cursor-pointer"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          ) : null}

          <div className="flex items-stretch justify-around gap-1 rounded-2xl border border-border bg-surface-card p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('select')}
              aria-pressed={mode === 'select'}
              aria-label="Select field"
              className={cn(toolBase, mode === 'select' ? activeTool : inactiveTool)}
            >
              <MousePointer2
                className={cn('size-5', mode === 'select' ? 'text-white' : 'text-ink-muted')}
                aria-hidden="true"
              />
              <span>Select</span>
            </button>
            <button
              type="button"
              onClick={() => setMode(drawActive ? 'select' : 'draw')}
              aria-pressed={drawActive}
              aria-label="Draw field"
              className={cn(toolBase, drawActive ? activeTool : inactiveTool)}
            >
              <PenLine
                className={cn('size-5', drawActive ? 'text-white' : 'text-ink-muted')}
                aria-hidden="true"
              />
              <span>Draw</span>
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'capture' ? 'select' : 'capture')}
              aria-pressed={mode === 'capture'}
              aria-label="My location"
              className={cn(toolBase, mode === 'capture' ? activeTool : inactiveTool)}
            >
              <LocateFixed
                className={cn('size-5', mode === 'capture' ? 'text-white' : 'text-ink-muted')}
                aria-hidden="true"
              />
              <span>Location</span>
            </button>
            <button
              type="button"
              onClick={() => setLayersOpen((open) => !open)}
              aria-pressed={layersOpen}
              aria-label="Layers"
              className={cn(toolBase, layersOpen ? activeTool : inactiveTool)}
            >
              <Layers3
                className={cn('size-5', layersOpen ? 'text-white' : 'text-ink-muted')}
                aria-hidden="true"
              />
              <span>Layers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
