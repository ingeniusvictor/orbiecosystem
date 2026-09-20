import type { IncomingMessage, ServerResponse } from 'node:http';
import { createVercelPublicNewsService, parsePublicNewsCategory } from '../../../server/vercel/public-news-function-service.js';

const json = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const categoryFromRequest = (req: IncomingMessage): string => {
  const path = new URL(req.url ?? '/', 'https://orbi.local').pathname;
  return decodeURIComponent(path.split('/').filter(Boolean).at(-1) ?? '');
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  const category = parsePublicNewsCategory(categoryFromRequest(req));
  if (!category) {
    json(res, 404, { error: 'NEWS_CATEGORY_NOT_FOUND' });
    return;
  }
  try {
    const service = createVercelPublicNewsService({ environment: process.env });
    json(res, 200, await service.listByCategory(category));
  } catch (error) {
    json(res, 503, { error: error instanceof Error ? error.message : 'PUBLIC_NEWS_UNAVAILABLE' });
  }
}
