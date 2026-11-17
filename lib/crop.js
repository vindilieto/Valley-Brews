// How a photo sits in its frame. The original photo is never changed, so this can be re-adjusted any time.
// x, y: the point of the photo to keep in view, from 0 (left/top) to 100 (right/bottom).
// zoom: 1 fills the frame; up to 3 zooms in around that point.
// fit: true shows the whole photo (with a plain background around it) instead of filling the frame.
export const DEFAULT_CROP = { x: 50, y: 50, zoom: 1, fit: false };
export const MAX_ZOOM = 3;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

// Reads a saved crop (stored as text in the database), filling in anything missing or out of range.
export function parseCrop(text) {
  let raw = {};
  try {
    raw = typeof text === "string" && text ? JSON.parse(text) : (text ?? {});
  } catch {
    raw = {};
  }
  return {
    x: clamp(raw.x, 0, 100, 50),
    y: clamp(raw.y, 0, 100, 50),
    zoom: clamp(raw.zoom, 1, MAX_ZOOM, 1),
    fit: raw.fit === true,
  };
}

export function serializeCrop(crop) {
  const { x, y, zoom, fit } = parseCrop(crop);
  return JSON.stringify({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, zoom: Math.round(zoom * 100) / 100, fit });
}

// The CSS that places a photo in its frame. The frame needs overflow: hidden.
export function cropStyle(crop) {
  const { x, y, zoom, fit } = parseCrop(crop);
  if (fit) return { objectFit: "contain" };
  return {
    objectFit: "cover",
    objectPosition: `${x}% ${y}%`,
    transform: zoom === 1 ? undefined : `scale(${zoom})`,
    transformOrigin: `${x}% ${y}%`,
  };
}
