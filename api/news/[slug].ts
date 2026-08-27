import type { IncomingMessage, ServerResponse } from 'node:http';
import { createVercelPublicNewsService, isPublicNewsSlug } from '../../server/vercel/public-news-function-service';

const json = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const slugFromRequest = (req: IncomingMessage): string => {
  const path = new URL(req.url ?? '/', 'https://orbi.local').pathname;
  return decodeURIComponent(path.split('/').filter(Boolean).at(-1) ?? '');
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  const slug = slugFromRequest(req);
  if (!isPublicNewsSlug(slug)) {
    json(res, 404, { error: 'NEWS_ARTICLE_NOT_FOUND' });
    return;
  }
  try {
    const service = createVercelPublicNewsService({ environment: process.env });
    const article = await service.findBySlug(slug);
    if (!article) {
      json(res, 404, { error: 'NEWS_ARTICLE_NOT_FOUND' });
      return;
    }
    json(res, 200, article);
  } catch (error) {
    json(res, 503, { error: error instanceof Error ? error.message : 'PUBLIC_NEWS_UNAVAILABLE' });
  }
}
