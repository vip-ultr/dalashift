import type { Map as MapLibreMap } from 'maplibre-gl';
import type {
  GeoJSONStoreFeatures,
  TerraDrawAdapterStyling,
  TerraDrawChanges,
  TerraDrawExtend,
  TerraDrawHandledEvents,
  TerraDrawMouseEvent,
  TerraDrawStylingFunction,
} from 'terra-draw';

type TerraDrawCallbacks = TerraDrawExtend.TerraDrawCallbacks;

type DrawFeature = GeoJSONStoreFeatures;

const DEFAULT_STYLE: TerraDrawAdapterStyling = {
  pointColor: '#00b159',
  pointWidth: 6,
  pointOpacity: 1,
  pointOutlineColor: '#ffffff',
  pointOutlineOpacity: 1,
  pointOutlineWidth: 2,
  polygonFillColor: '#00b159',
  polygonFillOpacity: 0.25,
  polygonOutlineColor: '#facc15',
  polygonOutlineOpacity: 1,
  polygonOutlineWidth: 3,
  lineStringWidth: 3,
  lineStringColor: '#00b159',
  zIndex: 100,
};

const SOURCE_ID = 'terra-draw-source';

/**
 * Minimal MapLibre GL adapter for terra-draw. It forwards pointer/keyboard
 * events to terra-draw and renders the drawn features into a single GeoJSON
 * source with four style layers. No decorative geometry is invented here.
 */
export class MapLibreTerraDrawAdapter {
  private readonly map: MapLibreMap;
  private callbacks: TerraDrawCallbacks | null = null;
  private readonly features = new Map<string, DrawFeature>();
  private readonly heldKeys = new Set<string>();

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  project = (lng: number, lat: number): { x: number; y: number } => {
    const point = this.map.project([lng, lat]);
    return { x: point.x, y: point.y };
  };

  unproject = (x: number, y: number): { lng: number; lat: number } => {
    const lngLat = this.map.unproject([x, y]);
    return { lng: lngLat.lng, lat: lngLat.lat };
  };

  setCursor = (cursor: string): void => {
    this.map.getCanvas().style.cursor = cursor;
  };

  getLngLatFromEvent = (event: PointerEvent | MouseEvent): { lng: number; lat: number } | null => {
    const rect = this.map.getCanvas().getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const lngLat = this.map.unproject([event.clientX - rect.left, event.clientY - rect.top]);
    return { lng: lngLat.lng, lat: lngLat.lat };
  };

  setDoubleClickToZoom = (enabled: boolean): void => {
    if (enabled) this.map.doubleClickZoom.enable();
    else this.map.doubleClickZoom.disable();
  };

  getMapEventElement = (_eventType?: TerraDrawHandledEvents): HTMLElement => {
    return this.map.getCanvas();
  };

  register = (callbacks: TerraDrawCallbacks): void => {
    this.callbacks = callbacks;
    const canvas = this.map.getCanvas();
    canvas.addEventListener('click', this.handleClick);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
    callbacks.onReady?.();
  };

  unregister = (): void => {
    const canvas = this.map.getCanvas();
    canvas.removeEventListener('click', this.handleClick);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('contextmenu', this.handleContextMenu);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
    this.callbacks = null;
    this.map.getCanvas().style.cursor = '';
  };

  render = (changes: TerraDrawChanges, styling: TerraDrawStylingFunction): void => {
    for (const id of changes.deletedIds) {
      this.features.delete(String(id));
    }
    for (const feature of [...changes.created, ...changes.updated]) {
      this.features.set(String(feature.id), feature);
    }

    try {
      this.ensureSourceAndLayers();
    } catch {
      // Style may still be loading; the next render will retry.
      return;
    }

    const source = this.map.getSource(SOURCE_ID) as
      { setData: (data: unknown) => void } | undefined;
    const collection = {
      type: 'FeatureCollection',
      features: [...this.features.values()].map((feature) => ({
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry,
        properties: feature.properties,
      })),
    };
    source?.setData(collection);

    const sample = [...this.features.values()][0];
    const mode = sample
      ? String((sample as { properties?: { mode?: unknown } }).properties?.mode ?? '')
      : '';
    const styleFn = mode ? styling[mode] : undefined;
    const style = (sample && styleFn ? styleFn(sample) : undefined) ?? DEFAULT_STYLE;

    try {
      this.applyPaint(style);
    } catch {
      // Ignore paint updates while the style is still initialising.
    }
  };

  private applyPaint = (style: TerraDrawAdapterStyling): void => {
    this.map.setPaintProperty('terra-draw-polygon-fill', 'fill-color', style.polygonFillColor);
    this.map.setPaintProperty('terra-draw-polygon-fill', 'fill-opacity', style.polygonFillOpacity);
    this.map.setPaintProperty(
      'terra-draw-polygon-outline',
      'line-color',
      style.polygonOutlineColor,
    );
    this.map.setPaintProperty(
      'terra-draw-polygon-outline',
      'line-width',
      style.polygonOutlineWidth,
    );
    this.map.setPaintProperty('terra-draw-linestring', 'line-color', style.lineStringColor);
    this.map.setPaintProperty('terra-draw-linestring', 'line-width', style.lineStringWidth);
    this.map.setPaintProperty('terra-draw-points', 'circle-radius', style.pointWidth);
    this.map.setPaintProperty('terra-draw-points', 'circle-color', style.pointColor);
    this.map.setPaintProperty('terra-draw-points', 'circle-stroke-color', style.pointOutlineColor);
    this.map.setPaintProperty('terra-draw-points', 'circle-stroke-width', style.pointOutlineWidth);
  };

  clear = (): void => {
    this.features.clear();
    const source = this.map.getSource(SOURCE_ID) as
      { setData: (data: unknown) => void } | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });
  };

  getCoordinatePrecision = (): number => 6;

  private ensureSourceAndLayers(): void {
    if (!this.map.getSource(SOURCE_ID)) {
      this.map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (this.map.getLayer('terra-draw-polygon-fill')) return;

    this.map.addLayer({
      id: 'terra-draw-polygon-fill',
      type: 'fill',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': DEFAULT_STYLE.polygonFillColor, 'fill-opacity': 0.25 },
    });
    this.map.addLayer({
      id: 'terra-draw-polygon-outline',
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'line-color': DEFAULT_STYLE.polygonOutlineColor, 'line-width': 3 },
    });
    this.map.addLayer({
      id: 'terra-draw-linestring',
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': DEFAULT_STYLE.lineStringColor, 'line-width': 3 },
    });
    this.map.addLayer({
      id: 'terra-draw-points',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': DEFAULT_STYLE.pointColor,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });
  }

  private toMouseEvent(event: MouseEvent | PointerEvent): TerraDrawMouseEvent {
    const lngLat = this.getLngLatFromEvent(event) ?? { lng: 0, lat: 0 };
    const rect = this.map.getCanvas().getBoundingClientRect();
    const button =
      event.button === 0
        ? 'left'
        : event.button === 1
          ? 'middle'
          : event.button === 2
            ? 'right'
            : 'neither';
    return {
      lng: lngLat.lng,
      lat: lngLat.lat,
      containerX: event.clientX - rect.left,
      containerY: event.clientY - rect.top,
      button,
      heldKeys: [...this.heldKeys],
      isContextMenu: event.type === 'contextmenu',
    };
  }

  private readonly handleClick = (event: MouseEvent): void => {
    event.preventDefault();
    this.callbacks?.onClick(this.toMouseEvent(event));
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    this.callbacks?.onClick(this.toMouseEvent(event));
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.callbacks?.onMouseMove(this.toMouseEvent(event));
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.callbacks?.onDragStart(this.toMouseEvent(event), (enabled) => {
      this.map.dragPan[enabled ? 'enable' : 'disable']();
    });
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.callbacks?.onDragEnd(this.toMouseEvent(event), (enabled) => {
      this.map.dragPan[enabled ? 'enable' : 'disable']();
    });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.heldKeys.add(event.key.toLowerCase());
    this.callbacks?.onKeyDown({
      key: event.key,
      heldKeys: [...this.heldKeys],
      preventDefault: () => event.preventDefault(),
    });
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.key.toLowerCase());
    this.callbacks?.onKeyUp({
      key: event.key,
      heldKeys: [...this.heldKeys],
      preventDefault: () => event.preventDefault(),
    });
  };
}
