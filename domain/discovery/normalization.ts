import type { IsoUtcDateTime } from '../common/types';
import { NewsOrigin, type DiscoveryCandidate } from '../news/news-item';

const TRACKING_PARAM_PREFIXES = ['utm_'];
const TRACKING_PARAM_NAMES = new Set(['fbclid', 'gclid']);

export interface NormalizedDiscoveryCandidate extends DiscoveryCandidate {
  readonly normalizedTitle: string;
  readonly canonicalUrl: string;
  readonly canonicalUrlKey: string;
}

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

export const canonicalizeDiscoveryUrl = (rawUrl: string): string => {
  const url = new URL(rawUrl);
  url.hash = '';

  const keysToDelete: string[] = [];
  url.searchParams.forEach((_value, key) => {
    const lower = key.toLowerCase();
    if (
      TRACKING_PARAM_NAMES.has(lower) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))
    ) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => url.searchParams.delete(key));
  url.hostname = url.hostname.toLowerCase();

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const sorted = [...url.searchParams.entries()].sort(([aKey, aValue], [bKey, bValue]) =>
    aKey === bKey ? aValue.localeCompare(bValue) : aKey.localeCompare(bKey),
  );
  url.search = '';
  sorted.forEach(([key, value]) => url.searchParams.append(key, value));

  return url.toString();
};

export const buildCanonicalUrlKey = (canonicalUrl: string): string =>
  canonicalUrl.toLowerCase();

export const normalizeDiscoveryCandidate = (input: {
  readonly title: string;
  readonly url: string;
  readonly sourceName?: string | null;
  readonly publishedAt?: IsoUtcDateTime | null;
  readonly origin: NewsOrigin;
  readonly discoveredAt: IsoUtcDateTime;
}): NormalizedDiscoveryCandidate => {
  const normalizedTitle = normalizeWhitespace(input.title);
  if (!normalizedTitle) throw new Error('DISCOVERY_TITLE_REQUIRED');

  const canonicalUrl = canonicalizeDiscoveryUrl(input.url);

  return {
    title: normalizedTitle,
    normalizedTitle,
    url: input.url,
    canonicalUrl,
    canonicalUrlKey: buildCanonicalUrlKey(canonicalUrl),
    sourceName: input.sourceName?.trim() || null,
    publishedAt: input.publishedAt ?? null,
    origin: input.origin,
    discoveredAt: input.discoveredAt,
  };
};
