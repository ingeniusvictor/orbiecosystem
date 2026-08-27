export interface LiveArticleDocument {
  readonly url: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly text: string;
}

export interface LiveArticleFetcher {
  fetchArticle(url: string): Promise<LiveArticleDocument>;
}

export interface LiveArticleFetcherOptions {
  readonly allowedHosts: readonly string[];
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly maxRedirects?: number;
  readonly fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 1_500_000;
const DEFAULT_MAX_REDIRECTS = 3;

const decodeEntities = (value: string): string => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&#x27;/gi, "'");

const tagContent = (html: string, pattern: RegExp): string | null => {
  const match = html.match(pattern);
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) || null : null;
};

const metaDescription = (html: string): string | null => {
  const patterns = [
    /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i,
    /<meta\b[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["'][^>]*>/i,
    /<meta\b[^>]*\bproperty=["']og:description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
};

const extractReadableText = (html: string): string => decodeEntities(
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(),
);

const normalizeHost = (host: string): string => host.trim().toLowerCase().replace(/^www\./, '');

const hostAllowed = (hostname: string, allowedHosts: readonly string[]): boolean => {
  const host = normalizeHost(hostname);
  return allowedHosts.some((allowed) => {
    const normalized = normalizeHost(allowed);
    return host === normalized || host.endsWith(`.${normalized}`);
  });
};

const assertAllowedUrl = (url: URL, allowedHosts: readonly string[]): void => {
  if (url.protocol !== 'https:') throw new Error('LIVE_ARTICLE_HTTPS_REQUIRED');
  if (!hostAllowed(url.hostname, allowedHosts)) throw new Error('LIVE_ARTICLE_HOST_NOT_ALLOWED');
};

const isRedirect = (status: number): boolean => [301, 302, 303, 307, 308].includes(status);

export const createLiveArticleFetcher = (options: LiveArticleFetcherOptions): LiveArticleFetcher => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const allowedHosts = [...new Set(options.allowedHosts.map(normalizeHost).filter(Boolean))];

  if (allowedHosts.length === 0) throw new RangeError('LIVE_ARTICLE_ALLOWED_HOSTS_REQUIRED');
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new RangeError('LIVE_ARTICLE_TIMEOUT_INVALID');
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new RangeError('LIVE_ARTICLE_MAX_BYTES_INVALID');
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0 || maxRedirects > 10) throw new RangeError('LIVE_ARTICLE_MAX_REDIRECTS_INVALID');

  return {
    async fetchArticle(rawUrl: string): Promise<LiveArticleDocument> {
      let url = new URL(rawUrl);
      assertAllowedUrl(url, allowedHosts);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        let response: Response | null = null;
        for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
          response = await fetchImpl(url, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              accept: 'text/html,application/xhtml+xml;q=0.9',
              'user-agent': 'ORBI-News-Research/1.0',
            },
          });
          if (!isRedirect(response.status)) break;
          if (redirectCount >= maxRedirects) throw new Error('LIVE_ARTICLE_REDIRECT_LIMIT_REACHED');
          const location = response.headers.get('location');
          if (!location) throw new Error('LIVE_ARTICLE_REDIRECT_LOCATION_REQUIRED');
          const next = new URL(location, url);
          assertAllowedUrl(next, allowedHosts);
          url = next;
        }

        if (!response) throw new Error('LIVE_ARTICLE_FETCH_FAILED');
        if (!response.ok) throw new Error(`LIVE_ARTICLE_HTTP_${response.status}`);
        const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          throw new Error('LIVE_ARTICLE_CONTENT_TYPE_UNSUPPORTED');
        }
        const declaredLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error('LIVE_ARTICLE_BODY_TOO_LARGE');
        const html = await response.text();
        if (Buffer.byteLength(html, 'utf8') > maxBytes) throw new Error('LIVE_ARTICLE_BODY_TOO_LARGE');

        const text = extractReadableText(html);
        if (text.length < 80) throw new Error('LIVE_ARTICLE_TEXT_INSUFFICIENT');

        return {
          url: url.toString(),
          title: tagContent(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
          description: metaDescription(html),
          text,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
};
