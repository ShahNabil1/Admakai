export const HIRING_MEDIA_BUCKET = 'hiring-media';
export const HIRING_MEDIA_TTL = 3600;

export function hiringMediaPath(value: string | null | undefined) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const path = new URL(value).pathname.match(/^\/storage\/v1\/object\/(?:sign|public|authenticated)\/hiring-media\/(.+)$/)?.[1];
    return path ? decodeURIComponent(path) : null;
  } catch { return null; }
}

// Browser-owned cache, never persisted or shared between server requests.
export function createHiringMediaCache(sign: (path: string, seconds: number) => Promise<string>, now = Date.now) {
  const cache = new Map<string, { until: number; url: Promise<string> }>();
  return (path: string) => {
    const entry = cache.get(path);
    if (entry && entry.until > now()) return entry.url;
    const url = sign(path, HIRING_MEDIA_TTL).catch(error => {
      cache.delete(path);
      throw error;
    });
    cache.set(path, { until: now() + HIRING_MEDIA_TTL * 1000 - 60000, url });
    return url;
  };
}