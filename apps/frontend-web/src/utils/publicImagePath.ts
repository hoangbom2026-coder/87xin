/**
 * Sanitizes and normalizes local public image asset paths.
 */
export function sanitizeLocalImagePath(path?: string | null, fallback: string = '/images/fallback.png'): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
}

export default sanitizeLocalImagePath;
