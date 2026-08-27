import { timingSafeEqual } from 'node:crypto';

export interface VercelCronEnvironment {
  readonly CRON_SECRET?: string;
}

const requiredSecret = (value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error('VERCEL_CRON_SECRET_REQUIRED');
  if (normalized.length < 32) throw new Error('VERCEL_CRON_SECRET_TOO_SHORT');
  return normalized;
};

export const resolveVercelCronSecret = (environment: VercelCronEnvironment): string =>
  requiredSecret(environment.CRON_SECRET);

export const authenticateVercelCronAuthorization = (
  expectedSecret: string,
  authorization: string | undefined,
): boolean => {
  if (!authorization?.startsWith('Bearer ')) return false;
  const supplied = authorization.slice('Bearer '.length);
  const expectedBuffer = Buffer.from(expectedSecret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
};
