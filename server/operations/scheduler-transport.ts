import { timingSafeEqual } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { SchedulerJob } from '../../domain/operations/scheduler';
import type { OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import { getAutonomousActionForSchedulerJob } from './autonomous-execution-orchestrator';
import type { ProductionAutonomousRuntime } from './production-runtime';

export interface SchedulerTransportEnvironment {
  readonly ORBI_NEWS_SCHEDULER_TOKEN?: string;
}

const requiredSecret = (value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error('ORBI_NEWS_SCHEDULER_TOKEN_REQUIRED');
  if (normalized.length < 32) throw new Error('ORBI_NEWS_SCHEDULER_TOKEN_TOO_SHORT');
  return normalized;
};

export const authenticateSchedulerToken = (expected: string, supplied: string | undefined): boolean => {
  if (!supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
};

const parseJob = (raw: unknown): SchedulerJob => {
  if (typeof raw !== 'string' || !Object.values(SchedulerJob).includes(raw as SchedulerJob)) {
    throw new RangeError('SCHEDULER_TRANSPORT_JOB_INVALID');
  }
  return raw as SchedulerJob;
};

const parseBreakingEligible = (job: SchedulerJob, value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  if (job !== SchedulerJob.BREAKING_SOCIAL) throw new RangeError('SCHEDULER_TRANSPORT_BREAKING_FLAG_FORBIDDEN');
  if (typeof value !== 'boolean') throw new RangeError('SCHEDULER_TRANSPORT_BREAKING_FLAG_INVALID');
  return value;
};

/**
 * Authenticated server-side transport intended for a private Cloud Run service.
 * The caller chooses only the scheduler job and optional breaking eligibility.
 * Action, time, authority, organization and worker identity are server-owned.
 */
export const createSchedulerInvocationRouter = ({
  runtime,
  authoritySnapshot,
  token,
  clock = () => new Date().toISOString() as IsoUtcDateTime,
}: {
  readonly runtime: ProductionAutonomousRuntime;
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly token: string;
  readonly clock?: () => IsoUtcDateTime;
}): Router => {
  const expectedToken = requiredSecret(token);
  const router = Router();

  router.post('/invoke', async (req: Request, res: Response) => {
    if (!authenticateSchedulerToken(expectedToken, req.header('x-orbi-scheduler-token'))) {
      res.status(401).json({ error: 'SCHEDULER_TRANSPORT_UNAUTHORIZED' });
      return;
    }

    try {
      const job = parseJob(req.body?.job);
      const breakingEligible = parseBreakingEligible(job, req.body?.breakingEligible);
      const result = await runtime.execute({
        job,
        action: getAutonomousActionForSchedulerJob(job),
        nowUtc: clock(),
        ...(breakingEligible !== undefined ? { breakingEligible } : {}),
        authoritySnapshot,
      });
      res.status(200).json({
        outcome: result.execution.outcome,
        schedulerDecision: result.execution.scheduler.decision,
        authorityDecision: result.execution.authority?.decision ?? null,
        tickKey: result.execution.tickKey,
        healthStatus: result.healthAssessment.status,
        effectiveAutonomyLevel: result.autonomy.effectiveAutonomyLevel,
        runId: result.runRecord.runId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SCHEDULER_TRANSPORT_FAILED';
      const badRequest = message.startsWith('SCHEDULER_TRANSPORT_');
      res.status(badRequest ? 400 : 500).json({ error: message });
    }
  });

  return router;
};

export const resolveSchedulerTransportToken = (environment: SchedulerTransportEnvironment): string =>
  requiredSecret(environment.ORBI_NEWS_SCHEDULER_TOKEN);
