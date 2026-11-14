import type { GeoJSONGeometry } from '@dalashift/shared/types';

import { cn } from '../../lib/utilities/cn';

export interface ParcelVectorThumbnailProps {
  readonly geometry: GeoJSONGeometry;
  readonly size?: number;
  readonly active?: boolean;
  readonly className?: string;
}

/**
 * 40x40px dark slate square (`#2b2d30`) rendering a crisp white SVG vector
 * outline of a parcel's polygon (or a GPS point with dashed accuracy circle
 * when captured as a point). Modeled on the OneSoil field list thumbnail.
 */
export function ParcelVectorThumbnail({
  geometry,
  size = 40,
  active = false,
  className,
}: ParcelVectorThumbnailProps) {
  const padding = 7;
  const viewBoxSize = 40;
  const inner = viewBoxSize - padding * 2;

  const renderShape = () => {
    if (geometry.type === 'Point') {
      return (
        <>
          <circle
            cx="20"
            cy="20"
            r="11"
            fill="rgba(0, 177, 89, 0.16)"
            stroke="#ffffff"
            strokeWidth="1.25"
            strokeDasharray="2.5 2"
          />
          <circle cx="20" cy="20" r="3.2" fill="#00b159" stroke="#ffffff" strokeWidth="1.5" />
        </>
      );
    }

    const ring =
      geometry.type === 'Polygon'
        ? (geometry.coordinates[0] ?? [])
        : (geometry.coordinates[0]?.[0] ?? []);

    if (ring.length < 3) {
      return (
        <rect
          x="10"
          y="12"
          width="20"
          height="16"
          rx="2"
          fill="rgba(255,255,255,0.14)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      );
    }

    const lngs = ring.map((pt) => pt[0]);
    const lats = ring.map((pt) => pt[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const spanLng = Math.max(maxLng - minLng, 1e-6);
    const spanLat = Math.max(maxLat - minLat, 1e-6);
    const scale = inner / Math.max(spanLng, spanLat);

    const offsetX = padding + (inner - spanLng * scale) / 2;
    const offsetY = padding + (inner - spanLat * scale) / 2;

    const points = ring
      .map(([lng, lat]) => {
        const x = offsetX + (lng - minLng) * scale;
        const y = viewBoxSize - (offsetY + (lat - minLat) * scale);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <polygon
        points={points}
        fill={active ? 'rgba(0, 177, 89, 0.28)' : 'rgba(255, 255, 255, 0.14)'}
        stroke={active ? '#00b159' : '#ffffff'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    );
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#2b2d30] transition-transform',
        active && 'ring-2 ring-[#00b159] ring-offset-1',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        className="size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderShape()}
      </svg>
    </div>
  );
}
