export const PASSPORT_LIMIT = 5 * 1024 * 1024;
export const PASSPORT_WIDTH = 700;
export const PASSPORT_HEIGHT = 900;
export function passportFileError(file: { size: number; type: string }) {
  if (!file.size) return 'Choose an image.';
  if (file.size > PASSPORT_LIMIT) return 'Photo must be no larger than 5 MB.';
  if (!file.type.startsWith('image/')) return 'Choose an image file.';
  return null;
}
export function passportJpegDimensions(bytes: Uint8Array) {
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 255) return null;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] ?? 0) * 256 + (bytes[offset + 3] ?? 0);
    if ([192, 193, 194].includes(marker ?? 0)) return { height: (bytes[offset + 5] ?? 0) * 256 + (bytes[offset + 6] ?? 0), width: (bytes[offset + 7] ?? 0) * 256 + (bytes[offset + 8] ?? 0) };
    if (length < 2) return null;
    offset += length + 2;
  }
  return null;
}