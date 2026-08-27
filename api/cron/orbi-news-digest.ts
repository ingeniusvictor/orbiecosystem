import type { IncomingMessage, ServerResponse } from 'node:http';
import { authenticateVercelCronAuthorization, resolveVercelCronSecret } from '../../server/vercel/cron-auth';
import { executeDailyNewsDigest } from '../../server/vercel/daily-news-digest';

const json = (res: ServerResponse, status: number, payload: unknown): void => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const authorizationHeader = (req: IncomingMessage): string | undefined => {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  try {
    const secret = resolveVercelCronSecret(process.env);
    if (!authenticateVercelCronAuthorization(secret, authorizationHeader(req))) {
      json(res, 401, { error: 'VERCEL_CRON_UNAUTHORIZED' });
      return;
    }
    json(res, 200, await executeDailyNewsDigest({ environment: process.env }));
  } catch (error) {
    json(res, 503, { error: error instanceof Error ? error.message : 'DAILY_DIGEST_CRON_FAILED' });
  }
}
