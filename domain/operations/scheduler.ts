import type { IsoUtcDateTime } from '../common/types';

export const ORBI_EDITORIAL_TIME_ZONE = 'America/Santiago';
export const ORBI_DISCOVERY_INTERVAL_MINUTES = 60;
export const ORBI_WEB_DAILY_PUBLICATION_LIMIT = 8;
export const ORBI_SOCIAL_DIGEST_LOCAL_HOURS = [9, 18] as const;

export enum SchedulerJob {
  DISCOVERY_RADAR = 'DISCOVERY_RADAR',
  SOCIAL_DIGEST = 'SOCIAL_DIGEST',
  BREAKING_SOCIAL = 'BREAKING_SOCIAL',
}

export enum SchedulerDecision {
  DUE = 'DUE',
  DUE_BREAKING = 'DUE_BREAKING',
  NOT_DUE = 'NOT_DUE',
  DUPLICATE_TICK = 'DUPLICATE_TICK',
}

export interface SchedulerTickInput {
  readonly job: SchedulerJob;
  readonly nowUtc: IsoUtcDateTime;
  /** Idempotency keys already completed for this scheduler job. */
  readonly completedTickKeys: readonly string[];
  /** Only meaningful for BREAKING_SOCIAL. */
  readonly breakingEligible?: boolean;
}

export interface SchedulerTickResult {
  readonly decision: SchedulerDecision;
  readonly tickKey: string;
  readonly editorialDate: string;
  readonly editorialHour: number;
  readonly reasons: readonly string[];
}

const parseUtcInstant = (value: IsoUtcDateTime): Date => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError('SCHEDULER_NOW_UTC_INVALID');
  return date;
};

const getEditorialParts = (instant: Date): {
  readonly date: string;
  readonly hour: number;
} => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORBI_EDITORIAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  const year = value('year');
  const month = value('month');
  const day = value('day');
  const hour = Number(value('hour'));
  if (!year || !month || !day || !Number.isInteger(hour)) {
    throw new RangeError('SCHEDULER_EDITORIAL_TIME_RESOLUTION_FAILED');
  }

  return { date: `${year}-${month}-${day}`, hour };
};

const buildTickKey = (job: SchedulerJob, editorialDate: string, editorialHour: number): string =>
  `${job}:${editorialDate}:${String(editorialHour).padStart(2, '0')}`;

/**
 * Pure scheduler policy. It answers only whether a job is due for this local
 * editorial hour. It does not grant operational authority or execute work.
 */
export const evaluateSchedulerTick = (input: SchedulerTickInput): SchedulerTickResult => {
  const instant = parseUtcInstant(input.nowUtc);
  const editorial = getEditorialParts(instant);
  const tickKey = buildTickKey(input.job, editorial.date, editorial.hour);

  if (input.completedTickKeys.includes(tickKey)) {
    return {
      decision: SchedulerDecision.DUPLICATE_TICK,
      tickKey,
      editorialDate: editorial.date,
      editorialHour: editorial.hour,
      reasons: ['SCHEDULER_TICK_ALREADY_COMPLETED'],
    };
  }

  if (input.job === SchedulerJob.DISCOVERY_RADAR) {
    return {
      decision: SchedulerDecision.DUE,
      tickKey,
      editorialDate: editorial.date,
      editorialHour: editorial.hour,
      reasons: [],
    };
  }

  if (input.job === SchedulerJob.SOCIAL_DIGEST) {
    const due = ORBI_SOCIAL_DIGEST_LOCAL_HOURS.includes(
      editorial.hour as (typeof ORBI_SOCIAL_DIGEST_LOCAL_HOURS)[number],
    );
    return {
      decision: due ? SchedulerDecision.DUE : SchedulerDecision.NOT_DUE,
      tickKey,
      editorialDate: editorial.date,
      editorialHour: editorial.hour,
      reasons: due ? [] : ['SOCIAL_DIGEST_OUTSIDE_EXECUTION_WINDOW'],
    };
  }

  if (input.job === SchedulerJob.BREAKING_SOCIAL) {
    return input.breakingEligible === true
      ? {
          decision: SchedulerDecision.DUE_BREAKING,
          tickKey,
          editorialDate: editorial.date,
          editorialHour: editorial.hour,
          reasons: ['BREAKING_BYPASSES_DIGEST_WINDOW_ONLY'],
        }
      : {
          decision: SchedulerDecision.NOT_DUE,
          tickKey,
          editorialDate: editorial.date,
          editorialHour: editorial.hour,
          reasons: ['BREAKING_ELIGIBILITY_REQUIRED'],
        };
  }

  return {
    decision: SchedulerDecision.NOT_DUE,
    tickKey,
    editorialDate: editorial.date,
    editorialHour: editorial.hour,
    reasons: ['SCHEDULER_JOB_UNSUPPORTED'],
  };
};
