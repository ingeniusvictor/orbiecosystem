import type { IncomingMessage, ServerResponse } from 'node:http';
import { authenticateVercelCronAuthorization, resolveVercelCronSecret } from '../../server/vercel/cron-auth';
import { executeVercelDiscoveryCron } from '../../server/vercel/discovery-cron-service';

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

    const result = await executeVercelDiscoveryCron({ environment: process.env });
    json(res, 200, {
      outcome: result.execution.outcome,
      schedulerDecision: result.execution.scheduler.decision,
      authorityDecision: result.execution.authority?.decision ?? null,
      tickKey: result.execution.tickKey,
      runId: result.runRecord.runId,
      healthStatus: result.healthAssessment.status,
      effectiveAutonomyLevel: result.autonomy.effectiveAutonomyLevel,
    });
  } catch (error) {
    json(res, 503, { error: error instanceof Error ? error.message : 'VERCEL_DISCOVERY_CRON_FAILED' });
  }
}
