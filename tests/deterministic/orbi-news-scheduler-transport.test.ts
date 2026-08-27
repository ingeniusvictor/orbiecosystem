import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, SystemMode } from '../../domain/common/enums';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { OperationalAction, SchedulerJob, type OperationalAuthoritySnapshot } from '../../domain/operations';
import type { ProductionAutonomousRuntime } from '../../server/operations/production-runtime';
import {
  authenticateSchedulerToken,
  createSchedulerInvocationRouter,
  resolveSchedulerTransportToken,
} from '../../server/operations/scheduler-transport';

const TOKEN = '0123456789abcdef0123456789abcdef';
const authority: OperationalAuthoritySnapshot = {
  systemMode: SystemMode.MAINTENANCE,
  autonomyLevel: AutonomyLevel.LEVEL_0,
  toggles: {},
  activeKillSwitches: [],
  capabilities: {},
  dailyBudgets: {},
  retryBudgets: {},
};

const invokeRouter = async (router: any, { body, token }: { body: unknown; token?: string }) => {
  const routeLayer = router.stack.find((layer: any) => layer.route?.path === '/invoke');
  const handler = routeLayer.route.stack[0].handle;
  let statusCode = 200;
  let payload: unknown;
  const req = {
    body,
    header(name: string) { return name.toLowerCase() === 'x-orbi-scheduler-token' ? token : undefined; },
  };
  const res = {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { payload = value; return this; },
  };
  await handler(req, res);
  return { statusCode, payload };
};

test('scheduler token must be explicit and at least 32 characters', () => {
  assert.throws(() => resolveSchedulerTransportToken({}), /ORBI_NEWS_SCHEDULER_TOKEN_REQUIRED/);
  assert.throws(() => resolveSchedulerTransportToken({ ORBI_NEWS_SCHEDULER_TOKEN: 'short' }), /TOO_SHORT/);
  assert.equal(resolveSchedulerTransportToken({ ORBI_NEWS_SCHEDULER_TOKEN: TOKEN }), TOKEN);
});

test('token comparison rejects missing, wrong and different-length values', () => {
  assert.equal(authenticateSchedulerToken(TOKEN, undefined), false);
  assert.equal(authenticateSchedulerToken(TOKEN, 'wrong'), false);
  assert.equal(authenticateSchedulerToken(TOKEN, `${TOKEN}x`), false);
  assert.equal(authenticateSchedulerToken(TOKEN, TOKEN), true);
});

test('unauthorized request never invokes runtime', async () => {
  let calls = 0;
  const runtime = { execute: async () => { calls += 1; throw new Error('should not run'); } } as unknown as ProductionAutonomousRuntime;
  const router = createSchedulerInvocationRouter({ runtime, authoritySnapshot: authority, token: TOKEN });
  const response = await invokeRouter(router, { body: { job: SchedulerJob.DISCOVERY_RADAR }, token: 'wrong' });
  assert.equal(response.statusCode, 401);
  assert.equal(calls, 0);
});

test('authorized transport derives action and time server-side and ignores caller action fields', async () => {
  let captured: any;
  const runtime = {
    execute: async (input: unknown) => {
      captured = input;
      return {
        execution: { outcome: 'DEFERRED', scheduler: { decision: 'DUE' }, authority: { decision: 'DEFER' }, tickKey: 'DISCOVERY_RADAR:2026-08-27:09' },
        healthAssessment: { status: 'HEALTHY' },
        autonomy: { effectiveAutonomyLevel: 'LEVEL_0' },
        runRecord: { runId: 'run-1' },
      };
    },
  } as unknown as ProductionAutonomousRuntime;
  const router = createSchedulerInvocationRouter({
    runtime,
    authoritySnapshot: authority,
    token: TOKEN,
    clock: () => '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
  });

  const response = await invokeRouter(router, {
    token: TOKEN,
    body: { job: SchedulerJob.DISCOVERY_RADAR, action: OperationalAction.PUBLISH_WEB, workerId: 'attacker' },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(captured.job, SchedulerJob.DISCOVERY_RADAR);
  assert.equal(captured.action, OperationalAction.DISCOVER_NEWS);
  assert.equal(captured.nowUtc, '2026-08-27T13:00:00.000Z');
  assert.equal(captured.workerId, undefined);
  assert.strictEqual(captured.authoritySnapshot, authority);
});

test('breaking eligibility is accepted only for BREAKING_SOCIAL', async () => {
  const runtime = { execute: async () => { throw new Error('should not run'); } } as unknown as ProductionAutonomousRuntime;
  const router = createSchedulerInvocationRouter({ runtime, authoritySnapshot: authority, token: TOKEN });
  const response = await invokeRouter(router, {
    token: TOKEN,
    body: { job: SchedulerJob.DISCOVERY_RADAR, breakingEligible: true },
  });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.payload, { error: 'SCHEDULER_TRANSPORT_BREAKING_FLAG_FORBIDDEN' });
});
