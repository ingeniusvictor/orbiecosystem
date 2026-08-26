import type { EventFingerprint } from './event';
import { EventType } from './event';

export interface EventFingerprintInput {
  readonly primaryEntity: string;
  readonly eventType: EventType;
  readonly subject?: string | null;
  readonly eventDate?: string | null;
  readonly secondaryEntities?: readonly string[];
  readonly location?: string | null;
}

const normalizeText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
};

const normalizeEntityList = (values: readonly string[] | undefined): readonly string[] =>
  [...new Set((values ?? [])
    .map((value) => normalizeText(value))
    .filter((value): value is string => value !== null))]
    .sort((a, b) => a.localeCompare(b));

export const eventDateBucket = (eventDate: string | null | undefined): string | null => {
  if (!eventDate) return null;
  const parsed = new Date(eventDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const fnv1a32 = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const buildEventFingerprint = (input: EventFingerprintInput): EventFingerprint => {
  const primaryEntity = normalizeText(input.primaryEntity);
  if (!primaryEntity) {
    throw new Error('Event fingerprint requires a primary entity.');
  }

  const subject = normalizeText(input.subject);
  const location = normalizeText(input.location);
  const dateBucket = eventDateBucket(input.eventDate);
  const secondaryEntities = normalizeEntityList(input.secondaryEntities);

  const canonical = [
    `entity=${primaryEntity}`,
    `type=${input.eventType}`,
    `subject=${subject ?? ''}`,
    `date=${dateBucket ?? ''}`,
    `secondary=${secondaryEntities.join(',')}`,
    `location=${location ?? ''}`,
  ].join('|');

  return {
    primaryEntity,
    eventType: input.eventType,
    subject,
    dateBucket,
    secondaryEntities,
    location,
    fingerprintHash: `evt_${fnv1a32(canonical)}`,
  };
};
