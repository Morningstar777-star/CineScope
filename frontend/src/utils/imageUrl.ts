/**
 * Resolves high-resolution, CDN-cached, zero-rate-limit poster image URLs.
 * Automatically proxies direct Wikimedia/Wikipedia images through Cloudflare-backed weserv CDN
 * to eliminate Wikimedia 429 rate-limiting, CORS rejections, and browser hotlinking blocks.
 */
export function getOptimizedPosterUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // AniList and TVMaze CDNs are already ultra-fast, CORS-friendly, and open
  if (trimmed.includes('images.weserv.nl') || trimmed.includes('anilist.co') || trimmed.includes('tvmaze.com')) {
    return trimmed;
  }

  // Route Wikimedia images through Cloudflare edge cache proxy with quality and dimension optimization
  if (trimmed.includes('upload.wikimedia.org')) {
    const withoutProtocol = trimmed.replace(/^https?:\/\//, '').split('?')[0];
    return `https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}&w=480&q=85`;
  }

  return trimmed;
}
