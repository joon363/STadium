/**
 * High-Resolution Campus Map Coordinates & Boundary Definitions
 * Target Map Image: /hqmap.jpg (3894 x 4905 px)
 */

export const MAP_BOUNDS = {
  widthPx: 3894,
  heightPx: 4905,
  minLat: 36.00933323687072,
  maxLat: 36.019560988155675,
  minLng: 129.3173654512678,
  maxLng: 129.327847986618,
  centerLat: 36.01444724162366,
  centerLng: 129.32260637718264,
  zoom: 19,
  imageSrc: '/hqmap.jpg',
};

/**
 * Convert Percentage (0-100%) coordinates to Image Pixels
 */
export function pctToPixel(xPct: number, yPct: number): { pxX: number; pxY: number } {
  return {
    pxX: Math.round((xPct / 100) * MAP_BOUNDS.widthPx),
    pxY: Math.round((yPct / 100) * MAP_BOUNDS.heightPx),
  };
}

/**
 * Convert Image Pixels to Percentage (0-100%) coordinates
 */
export function pixelToPct(pxX: number, pxY: number): { xPct: number; yPct: number } {
  return {
    xPct: Number(((pxX / MAP_BOUNDS.widthPx) * 100).toFixed(2)),
    yPct: Number(((pxY / MAP_BOUNDS.heightPx) * 100).toFixed(2)),
  };
}
