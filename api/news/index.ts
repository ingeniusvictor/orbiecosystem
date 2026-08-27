import type { IncomingMessage, ServerResponse } from 'node:http';
import { createVercelPublicNewsService } from '../../server/vercel/public-news-function-service';

const json = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  try {
    const service = createVercelPublicNewsService({ environment: process.env });
    json(res, 200, await service.listLatest());
  } catch (error) {
    json(res, 503, { error: error instanceof Error ? error.message : 'PUBLIC_NEWS_UNAVAILABLE' });
  }
}
