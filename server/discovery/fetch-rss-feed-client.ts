import type { IsoUtcDateTime } from '../../domain/common/types';
import type { RssFeedClient, RssFeedDocument, RssFeedItem } from '../../domain/discovery/rss-provider';

export interface FetchRssFeedClientOptions {
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly userAgent?: string;
  readonly fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2_000_000;

const decodeXml = (value: string): string => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

const tag = (xml: string, names: readonly string[]): string | null => {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (match) return decodeXml(match[1]);
  }
  return null;
};

const atomLink = (xml: string): string | null => {
  const match = xml.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i);
  return match ? decodeXml(match[1]) : null;
};

const parseDate = (value: string | null): IsoUtcDateTime | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() as IsoUtcDateTime : null;
};

export const parseRssOrAtomDocument = (xml: string, feedUrl: string): RssFeedDocument => {
  const itemBlocks = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const entryBlocks = itemBlocks.length > 0 ? [] : [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;
  const items: RssFeedItem[] = blocks.map((block) => ({
    title: tag(block, ['title']) ?? '',
    link: tag(block, ['link']) ?? atomLink(block) ?? '',
    publishedAt: parseDate(tag(block, ['pubDate', 'published', 'updated', 'dc:date'])),
  })).filter((item) => item.title.length > 0 && item.link.length > 0);

  return {
    feedUrl,
    sourceName: tag(xml, ['title']),
    items,
  };
};

export const createFetchRssFeedClient = (options: FetchRssFeedClientOptions = {}): RssFeedClient => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('RSS_FETCH_TIMEOUT_INVALID');
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new RangeError('RSS_FETCH_MAX_BYTES_INVALID');

  return {
    async fetchFeed(feedUrl: string): Promise<RssFeedDocument> {
      const url = new URL(feedUrl);
      if (url.protocol !== 'https:') throw new Error('RSS_FETCH_HTTPS_REQUIRED');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9', 'user-agent': options.userAgent ?? 'ORBI-News-Discovery/1.0' },
        });
        if (!response.ok) throw new Error(`RSS_FETCH_HTTP_${response.status}`);
        const declaredLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error('RSS_FETCH_BODY_TOO_LARGE');
        const text = await response.text();
        if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('RSS_FETCH_BODY_TOO_LARGE');
        return parseRssOrAtomDocument(text, url.toString());
      } finally {
        clearTimeout(timer);
      }
    },
  };
};
