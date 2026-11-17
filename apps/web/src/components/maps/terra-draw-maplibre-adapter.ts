import type { Map as MapLibreMap } from 'maplibre-gl';
import { TerraDrawExtend } from 'terra-draw';
import type {
  GeoJSONStoreFeatures,
  TerraDrawAdapterStyling,
  TerraDrawChanges,
  TerraDrawHandledEvents,
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
 * MapLibre GL adapter for terra-draw.
 *
 * It extends the library's base adapter so that pointer filtering, drag
 * thresholds, and drag-versus-click disambiguation follow the behaviour the
 * drawing modes are written against. Rendering stays local: features are
 * written to one GeoJSON source rendered by four fixed style layers, so
 * existing map styling is preserved and no decorative geometry is invented.
 */
export class MapLibreTerraDrawAdapter extends TerraDrawExtend.TerraDrawBaseAdapter {
  private readonly map: MapLibreMap;
  private readonly features = new Map<string, DrawFeature>();

  // Canvas reference captured per registration so extra listeners can be
  // removed from the exact element they were added to on unregister.
  private boundCanvas: HTMLElement | null = null;

  constructor(map: MapLibreMap) {
    // Coordinate precision matches the previous adapter. The drawing drag
    // threshold keeps small pointer jitter a click so taps place vertices.
    super({ coordinatePrecision: 6, minPixelDragDistanceDrawing: 8 });
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

  setCursor = (cursor: TerraDrawExtend.Cursor): void => {
    this.map.getCanvas().style.cursor = cursor;
  };

  getLngLatFromEvent = (event: PointerEvent | MouseEvent): { lng: number; lat: number } | null => {
    const rect = this.map.getCanvas().getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const lngLat = this.map.unproject([event.clientX - rect.left, event.clientY - rect.top]);
    return { lng: lngLat.lng, lat: lngLat.lat };
  };

  // The base adapter toggles this during vertex and feature drags in select
  // mode. Disabling pan lets the mode own the gesture instead of the map.
  setDraggability(enabled: boolean): void {
    if (enabled) this.map.dragPan.enable();
    else this.map.dragPan.disable();
  }

  setDoubleClickToZoom = (enabled: boolean): void => {
    if (enabled) this.map.doubleClickZoom.enable();
    else this.map.doubleClickZoom.disable();
  };

  getMapEventElement = (_eventType?: TerraDrawHandledEvents): HTMLElement => {
    return this.map.getCanvas();
  };

  override register(callbacks: TerraDrawCallbacks): void {
    // Super wires up the primary-button and drag-threshold aware pointer and
    // keyboard listeners on the map element.
    super.register(callbacks);

    const mapElement = this.getMapEventElement();
    this.boundCanvas = mapElement;

    // Capturing the primary pointer keeps pointermove and pointerup targeted
    // at the canvas when a drag leaves its bounds, so the base adapter always
    // resolves the gesture and never leaves panning disabled.
    mapElement.addEventListener('pointerdown', this.handlePointerDownCapture);
    mapElement.addEventListener('pointercancel', this.handleAbortedGesture);
    mapElement.addEventListener('lostpointercapture', this.handleAbortedGesture);

    // A map canvas is not reliably focusable, so keyboard events are also
    // observed on window. Events that originate on the canvas already reached
    // the base adapter's own listener, so they are skipped here to avoid
    // dispatching the callback twice.
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleWindowKeyDown);
      window.addEventListener('keyup', this.handleWindowKeyUp);
    }

    // TerraDraw fires its ready event from this callback. The original
    // adapter signalled readiness synchronously, which is kept here.
    callbacks.onReady?.();
  }

  override unregister(): void {
    const mapElement = this.boundCanvas;
    if (mapElement) {
      mapElement.removeEventListener('pointerdown', this.handlePointerDownCapture);
      mapElement.removeEventListener('pointercancel', this.handleAbortedGesture);
      mapElement.removeEventListener('lostpointercapture', this.handleAbortedGesture);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleWindowKeyDown);
      window.removeEventListener('keyup', this.handleWindowKeyUp);
    }
    this.boundCanvas = null;

    // Super calls clear(), which forwards onClear to terra-draw.
    super.unregister();

    // A stop may interrupt a gesture, so guarantee panning is usable again.
    this.setDraggability(true);
    this.map.getCanvas().style.cursor = '';
  }

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

  clear(): void {
    this.features.clear();
    const source = this.map.getSource(SOURCE_ID) as
      { setData: (data: unknown) => void } | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });

    // The base adapter calls clear() from unregister(), so this is the hook
    // that lets terra-draw reset the active mode's state through onClear.
    this._currentModeCallbacks?.onClear();
  }

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

  private readonly handlePointerDownCapture = (event: PointerEvent): void => {
    // Only the primary button drives drawing. Secondary buttons keep native
    // behaviour, which terra-draw interprets as context actions.
    if (!event.isPrimary || event.button !== 0) return;
    try {
      this.boundCanvas?.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; drawing still works without it.
    }
  };

  private readonly handleAbortedGesture = (): void => {
    // A cancelled gesture never reaches pointerup, so reset the base state and
    // restore panning explicitly to avoid a map stuck in a non-draggable state.
    if (this._dragState === 'not-dragging') return;
    this._dragState = 'not-dragging';
    this._lastDrawEvent = undefined;
    this.setDraggability(true);
  };

  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.target === this.boundCanvas) return;
    const callbacks = this._currentModeCallbacks;
    if (!callbacks) return;
    this._heldKeys.add(event.key);
    callbacks.onKeyDown({
      key: event.key,
      heldKeys: Array.from(this._heldKeys),
      preventDefault: () => event.preventDefault(),
    });
  };

  private readonly handleWindowKeyUp = (event: KeyboardEvent): void => {
    if (event.target === this.boundCanvas) return;
    const callbacks = this._currentModeCallbacks;
    if (!callbacks) return;
    this._heldKeys.delete(event.key);
    callbacks.onKeyUp({
      key: event.key,
      heldKeys: Array.from(this._heldKeys),
      preventDefault: () => event.preventDefault(),
    });
  };
}
