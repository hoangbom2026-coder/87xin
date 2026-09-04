/**
 * Utility for resolving asset and image URLs in frontend-web.
 */
export function resolveAssetUrl(url?: string | null, fallback: string = '/images/fallback.png'): string {
  if (!url) return fallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
}
