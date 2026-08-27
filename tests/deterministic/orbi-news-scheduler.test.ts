import test from 'node:test';
import assert from 'node:assert/strict';

import type { IsoUtcDateTime } from '../../domain/common/types';
import {
  ORBI_DISCOVERY_INTERVAL_MINUTES,
  ORBI_EDITORIAL_TIME_ZONE,
  ORBI_SOCIAL_DIGEST_LOCAL_HOURS,
  ORBI_WEB_DAILY_PUBLICATION_LIMIT,
  SchedulerDecision,
  SchedulerJob,
  evaluateSchedulerTick,
} from '../../domain/operations';

const at = (value: string): IsoUtcDateTime => value as IsoUtcDateTime;

test('scheduler V1 policy constants remain explicit', () => {
  assert.equal(ORBI_EDITORIAL_TIME_ZONE, 'America/Santiago');
  assert.equal(ORBI_DISCOVERY_INTERVAL_MINUTES, 60);
  assert.equal(ORBI_WEB_DAILY_PUBLICATION_LIMIT, 8);
  assert.deepEqual(ORBI_SOCIAL_DIGEST_LOCAL_HOURS, [9, 18]);
});

test('discovery radar is due once per editorial hour', () => {
  const result = evaluateSchedulerTick({
    job: SchedulerJob.DISCOVERY_RADAR,
    nowUtc: at('2026-08-26T21:15:00.000Z'),
    completedTickKeys: [],
  });

  assert.equal(result.decision, SchedulerDecision.DUE);
  assert.equal(result.editorialDate, '2026-08-26');
  assert.equal(result.editorialHour, 17);
  assert.equal(result.tickKey, 'DISCOVERY_RADAR:2026-08-26:17');
});

test('duplicate scheduler tick is idempotently rejected', () => {
  const first = evaluateSchedulerTick({
    job: SchedulerJob.DISCOVERY_RADAR,
    nowUtc: at('2026-08-26T21:15:00.000Z'),
    completedTickKeys: [],
  });
  const replay = evaluateSchedulerTick({
    job: SchedulerJob.DISCOVERY_RADAR,
    nowUtc: at('2026-08-26T21:59:59.000Z'),
    completedTickKeys: [first.tickKey],
  });

  assert.equal(replay.decision, SchedulerDecision.DUPLICATE_TICK);
  assert.equal(replay.tickKey, first.tickKey);
  assert.deepEqual(replay.reasons, ['SCHEDULER_TICK_ALREADY_COMPLETED']);
});

test('social digest windows are evaluated in America/Santiago, not UTC', () => {
  const morning = evaluateSchedulerTick({
    job: SchedulerJob.SOCIAL_DIGEST,
    nowUtc: at('2026-08-26T13:05:00.000Z'),
    completedTickKeys: [],
  });
  const evening = evaluateSchedulerTick({
    job: SchedulerJob.SOCIAL_DIGEST,
    nowUtc: at('2026-08-26T22:05:00.000Z'),
    completedTickKeys: [],
  });
  const outside = evaluateSchedulerTick({
    job: SchedulerJob.SOCIAL_DIGEST,
    nowUtc: at('2026-08-26T21:05:00.000Z'),
    completedTickKeys: [],
  });

  assert.equal(morning.editorialHour, 9);
  assert.equal(morning.decision, SchedulerDecision.DUE);
  assert.equal(evening.editorialHour, 18);
  assert.equal(evening.decision, SchedulerDecision.DUE);
  assert.equal(outside.editorialHour, 17);
  assert.equal(outside.decision, SchedulerDecision.NOT_DUE);
});

test('breaking can bypass digest timing only when already eligible', () => {
  const due = evaluateSchedulerTick({
    job: SchedulerJob.BREAKING_SOCIAL,
    nowUtc: at('2026-08-26T21:05:00.000Z'),
    completedTickKeys: [],
    breakingEligible: true,
  });
  const notEligible = evaluateSchedulerTick({
    job: SchedulerJob.BREAKING_SOCIAL,
    nowUtc: at('2026-08-26T21:05:00.000Z'),
    completedTickKeys: [],
    breakingEligible: false,
  });

  assert.equal(due.decision, SchedulerDecision.DUE_BREAKING);
  assert.deepEqual(due.reasons, ['BREAKING_BYPASSES_DIGEST_WINDOW_ONLY']);
  assert.equal(notEligible.decision, SchedulerDecision.NOT_DUE);
  assert.deepEqual(notEligible.reasons, ['BREAKING_ELIGIBILITY_REQUIRED']);
});

test('breaking tick is still idempotent when replayed', () => {
  const first = evaluateSchedulerTick({
    job: SchedulerJob.BREAKING_SOCIAL,
    nowUtc: at('2026-08-26T21:05:00.000Z'),
    completedTickKeys: [],
    breakingEligible: true,
  });
  const replay = evaluateSchedulerTick({
    job: SchedulerJob.BREAKING_SOCIAL,
    nowUtc: at('2026-08-26T21:40:00.000Z'),
    completedTickKeys: [first.tickKey],
    breakingEligible: true,
  });

  assert.equal(replay.decision, SchedulerDecision.DUPLICATE_TICK);
});

test('invalid scheduler instant fails closed', () => {
  assert.throws(
    () => evaluateSchedulerTick({
      job: SchedulerJob.DISCOVERY_RADAR,
      nowUtc: at('invalid-date'),
      completedTickKeys: [],
    }),
    /SCHEDULER_NOW_UTC_INVALID/,
  );
});
