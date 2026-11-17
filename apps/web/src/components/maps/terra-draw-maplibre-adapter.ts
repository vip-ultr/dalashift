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

// MapLibre cannot read CSS custom properties in paint expressions, so the two
// brand colours used for drawing are mirrored here. They match --color-brand-primary
// and --color-brand-accent in globals.css. Keeping them local also guarantees a
// drawn shape never falls back to terra-draw's blue or the old bright green.
const BRAND_GREEN = '#0a4232';
const BRAND_TERRACOTTA = '#c26e4a';
const WARM_WHITE = '#fafafa';

const DEFAULT_STYLE: TerraDrawAdapterStyling = {
  pointColor: WARM_WHITE,
  pointWidth: 7,
  pointOpacity: 1,
  pointOutlineColor: BRAND_GREEN,
  pointOutlineOpacity: 1,
  pointOutlineWidth: 2,
  polygonFillColor: BRAND_GREEN,
  polygonFillOpacity: 0.22,
  polygonOutlineColor: BRAND_TERRACOTTA,
  polygonOutlineOpacity: 1,
  polygonOutlineWidth: 3,
  lineStringWidth: 3,
  lineStringColor: BRAND_TERRACOTTA,
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

  // The last complete snapshot handed to render(). Kept so a late 'load' retry
  // can repaint an in-progress shape that arrived before the style was ready.
  private lastFeatures: DrawFeature[] = [];
  private awaitingStyleLoad = false;

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

    // The source and layers are installed at registration time, before any
    // pointer event can produce geometry. Creating them only from render()
    // means the first in-progress update can be dropped when the style is not
    // ready yet, and the shape never appears even though drawing advances.
    this.setupLayers();

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

  render = (changes: TerraDrawChanges, _styling: TerraDrawStylingFunction): void => {
    // terra-draw hands us the whole store split into three buckets. Rebuilding
    // from all of them on every call keeps the source authoritative: no feature
    // is missed because it happened to arrive in a different bucket, and a
    // dropped render cannot leave a stale half-drawn shape behind.
    const features = new Map<string, DrawFeature>();
    for (const feature of changes.unchanged) {
      features.set(String(feature.id), feature);
    }
    for (const feature of [...changes.created, ...changes.updated]) {
      features.set(String(feature.id), feature);
    }
    for (const id of changes.deletedIds) {
      features.delete(String(id));
    }

    this.lastFeatures = [...features.values()];
    this.paint(this.lastFeatures);
  };

  private paint(features: DrawFeature[]): void {
    const source = this.map.getSource(SOURCE_ID) as
      { setData: (data: unknown) => void } | undefined;
    if (!source) {
      // Layer creation is deferred until the style is ready. Try again now;
      // setupLayers schedules a 'load' retry and repaints from lastFeatures.
      this.setupLayers();
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: features.map((feature) => ({
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry,
        properties: feature.properties,
      })),
    });
  }

  /**
   * Install the draw source and its four layers, then apply the fixed brand
   * paint. With only the polygon mode in use, a single paint configuration is
   * enough; reading it from one arbitrary "sample" feature made the fill and
   * marker colours depend on which feature terra-draw happened to report first.
   */
  private setupLayers(): void {
    if (this.map.getLayer('terra-draw-polygon-fill')) return;

    try {
      this.ensureSourceAndLayers();
      this.applyPaint(DEFAULT_STYLE);
    } catch {
      // MapLibre rejects addSource/addLayer until the style has loaded. Retry
      // once it does, then paint the snapshot that may have arrived meanwhile.
      if (this.awaitingStyleLoad) return;
      this.awaitingStyleLoad = true;
      this.map.once('load', () => {
        this.awaitingStyleLoad = false;
        if (!this._currentModeCallbacks) return;
        this.setupLayers();
        this.paint(this.lastFeatures);
      });
    }
  }

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
    this.lastFeatures = [];
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
      paint: { 'fill-color': BRAND_GREEN, 'fill-opacity': 0.22 },
    });
    this.map.addLayer({
      id: 'terra-draw-polygon-outline',
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'line-color': BRAND_TERRACOTTA, 'line-width': 3 },
    });
    this.map.addLayer({
      id: 'terra-draw-linestring',
      type: 'line',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': BRAND_TERRACOTTA, 'line-width': 3 },
    });
    this.map.addLayer({
      id: 'terra-draw-points',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': WARM_WHITE,
        'circle-stroke-color': BRAND_GREEN,
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
