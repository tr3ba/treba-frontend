export type AvatarCrop = { x: number; y: number; zoom: number };
export const initialAvatarCrop: AvatarCrop = { x: 0.5, y: 0.5, zoom: 1 };
export const avatarOutputSize = 512;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function constrainAvatarCrop(width: number, height: number, crop: AvatarCrop): AvatarCrop {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new RangeError("Invalid image dimensions");
  const zoom = clamp(Number.isFinite(crop.zoom) ? crop.zoom : 1, 1, 4);
  const size = Math.min(width, height) / zoom;
  return {
    zoom,
    x: clamp(Number.isFinite(crop.x) ? crop.x : 0.5, size / (2 * width), 1 - size / (2 * width)),
    y: clamp(Number.isFinite(crop.y) ? crop.y : 0.5, size / (2 * height), 1 - size / (2 * height)),
  };
}

export function avatarCropRect(width: number, height: number, crop: AvatarCrop) {
  const fitted = constrainAvatarCrop(width, height, crop);
  const size = Math.min(width, height) / fitted.zoom;
  return { x: fitted.x * width - size / 2, y: fitted.y * height - size / 2, size };
}

/** Pointer deltas are measured in the rendered square, not in source pixels. */
export function moveAvatarCrop(width: number, height: number, crop: AvatarCrop, dx: number, dy: number, viewportSize: number) {
  if (!Number.isFinite(viewportSize) || viewportSize <= 0) return constrainAvatarCrop(width, height, crop);
  const scale = viewportSize * constrainAvatarCrop(width, height, crop).zoom / Math.min(width, height);
  return constrainAvatarCrop(width, height, {
    ...crop, x: crop.x - dx / (scale * width), y: crop.y - dy / (scale * height),
  });
}
