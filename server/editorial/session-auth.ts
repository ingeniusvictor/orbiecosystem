import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router, type Request } from 'express';
import { EditorialRole } from '../../domain/editorial';
import type { OrganizationId } from '../../domain/common/types';
import {
  signEditorialAccessToken,
  verifyEditorialAccessToken,
  type HmacEditorialIdentityProviderOptions,
} from './hmac-identity-provider';
import {
  isEditorialRole,
  type AuthenticatedEditorialActor,
  type EditorialIdentityResolver,
} from './identity';

export const EDITORIAL_SESSION_COOKIE = 'orbi_editorial_session';
export const EDITORIAL_CSRF_COOKIE = 'orbi_editorial_csrf';
export const EDITORIAL_CSRF_HEADER = 'x-orbi-editorial-csrf';

const SESSION_COOKIE_PATH = '/api/editorial';
const CSRF_COOKIE_PATH = '/';
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_SESSION_TTL_SECONDS = 24 * 60 * 60;
const MIN_BOOTSTRAP_ACCESS_KEY_LENGTH = 24;

export interface EditorialSessionEnvironment {
  readonly ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY?: string;
  readonly ORBI_EDITORIAL_BOOTSTRAP_ACTOR_ID?: string;
  readonly ORBI_EDITORIAL_BOOTSTRAP_ORGANIZATION_ID?: string;
  readonly ORBI_EDITORIAL_BOOTSTRAP_ROLE?: string;
  readonly ORBI_EDITORIAL_SESSION_TTL_SECONDS?: string;
  readonly NODE_ENV?: string;
}

export interface EditorialSessionOptions {
  readonly signingSecret: string;
  readonly accessKey: string;
  readonly actorId: string;
  readonly organizationId: OrganizationId;
  readonly role: EditorialRole;
  readonly ttlSeconds: number;
  readonly secureCookies: boolean;
  readonly now?: () => number;
}

export interface EditorialSessionSecurity {
  readonly identityResolver: EditorialIdentityResolver;
  requiresCsrf(request: Request): boolean;
  validateCsrf(request: Request): boolean;
}

const parseCookies = (request: Request): Readonly<Record<string, string>> => {
  const raw = request.header('cookie');
  if (!raw) return {};

  const cookies: Record<string, string> = {};
  for (const segment of raw.split(';')) {
    const separator = segment.indexOf('=');
    if (separator <= 0) continue;
    const name = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
};

const constantTimeStringEqual = (left: string, right: string): boolean => {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const hasBearerAuthorization = (request: Request): boolean =>
  /^Bearer\s+[^\s]+$/i.test(request.header('authorization')?.trim() ?? '');

const cookieAttributes = (
  path: string,
  maxAgeSeconds: number,
  secure: boolean,
  httpOnly: boolean,
): string => [
  `Path=${path}`,
  `Max-Age=${maxAgeSeconds}`,
  'SameSite=Strict',
  ...(secure ? ['Secure'] : []),
  ...(httpOnly ? ['HttpOnly'] : []),
].join('; ');

const setCookie = (
  name: string,
  value: string,
  path: string,
  maxAgeSeconds: number,
  secure: boolean,
  httpOnly: boolean,
): string => `${name}=${encodeURIComponent(value)}; ${cookieAttributes(path, maxAgeSeconds, secure, httpOnly)}`;

const clearCookie = (
  name: string,
  path: string,
  secure: boolean,
  httpOnly: boolean,
): string => `${name}=; ${cookieAttributes(path, 0, secure, httpOnly)}`;

const parseTtl = (value: string | undefined): number => {
  if (!value?.trim()) return DEFAULT_SESSION_TTL_SECONDS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_SESSION_TTL_SECONDS) {
    throw new Error('EDITORIAL_SESSION_TTL_INVALID');
  }
  return parsed;
};

export const resolveEditorialSessionOptions = (
  environment: EditorialSessionEnvironment,
  signingSecret: string,
  now?: () => number,
): EditorialSessionOptions | null => {
  const accessKey = environment.ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY?.trim();
  const actorId = environment.ORBI_EDITORIAL_BOOTSTRAP_ACTOR_ID?.trim();
  const organizationId = environment.ORBI_EDITORIAL_BOOTSTRAP_ORGANIZATION_ID?.trim();
  const role = environment.ORBI_EDITORIAL_BOOTSTRAP_ROLE?.trim();

  const supplied = [accessKey, actorId, organizationId, role].filter(Boolean).length;
  if (supplied === 0) return null;
  if (supplied !== 4) throw new Error('EDITORIAL_BOOTSTRAP_SESSION_CONFIG_INCOMPLETE');
  if ((accessKey?.length ?? 0) < MIN_BOOTSTRAP_ACCESS_KEY_LENGTH) {
    throw new Error('EDITORIAL_BOOTSTRAP_ACCESS_KEY_TOO_SHORT');
  }
  if (!isEditorialRole(role)) throw new Error('EDITORIAL_BOOTSTRAP_ROLE_INVALID');

  return {
    signingSecret,
    accessKey: accessKey!,
    actorId: actorId!,
    organizationId: organizationId! as OrganizationId,
    role,
    ttlSeconds: parseTtl(environment.ORBI_EDITORIAL_SESSION_TTL_SECONDS),
    secureCookies: environment.NODE_ENV === 'production',
    now,
  };
};

export const createEditorialSessionSecurity = (
  options: HmacEditorialIdentityProviderOptions,
): EditorialSessionSecurity => {
  const identityResolver: EditorialIdentityResolver = {
    async resolve(request): Promise<AuthenticatedEditorialActor | null> {
      const token = parseCookies(request)[EDITORIAL_SESSION_COOKIE];
      return token ? verifyEditorialAccessToken(token, options) : null;
    },
  };

  return {
    identityResolver,
    requiresCsrf(request): boolean {
      return !hasBearerAuthorization(request) && Boolean(parseCookies(request)[EDITORIAL_SESSION_COOKIE]);
    },
    validateCsrf(request): boolean {
      const cookieValue = parseCookies(request)[EDITORIAL_CSRF_COOKIE];
      const headerValue = request.header(EDITORIAL_CSRF_HEADER)?.trim();
      return Boolean(
        cookieValue &&
        headerValue &&
        constantTimeStringEqual(cookieValue, headerValue),
      );
    },
  };
};

export const combineEditorialIdentityResolvers = (
  primary: EditorialIdentityResolver,
  fallback: EditorialIdentityResolver,
): EditorialIdentityResolver => ({
  async resolve(request): Promise<AuthenticatedEditorialActor | null> {
    return await primary.resolve(request) ?? fallback.resolve(request);
  },
});

export const createEditorialSessionRouter = (
  options: EditorialSessionOptions | null,
  sessionSecurity: EditorialSessionSecurity,
): Router => {
  const router = Router();

  router.post('/session', (request, response) => {
    if (!options) {
      response.status(503).json({ error: 'EDITORIAL_SESSION_NOT_CONFIGURED' });
      return;
    }

    const accessKey = typeof request.body?.accessKey === 'string'
      ? request.body.accessKey.trim()
      : '';
    if (!accessKey || !constantTimeStringEqual(accessKey, options.accessKey)) {
      response.status(401).json({ error: 'EDITORIAL_SESSION_ACCESS_DENIED' });
      return;
    }

    const nowMs = options.now?.() ?? Date.now();
    const issuedAt = Math.floor(nowMs / 1000);
    const expiresAt = issuedAt + options.ttlSeconds;
    const sessionToken = signEditorialAccessToken({
      sub: options.actorId,
      org: options.organizationId,
      role: options.role,
      iat: issuedAt,
      exp: expiresAt,
    }, options.signingSecret);
    const csrfToken = randomBytes(32).toString('base64url');

    response.setHeader('Set-Cookie', [
      setCookie(EDITORIAL_SESSION_COOKIE, sessionToken, SESSION_COOKIE_PATH, options.ttlSeconds, options.secureCookies, true),
      setCookie(EDITORIAL_CSRF_COOKIE, csrfToken, CSRF_COOKIE_PATH, options.ttlSeconds, options.secureCookies, false),
    ]);
    response.status(200).json({
      actor: {
        actorId: options.actorId,
        organizationId: options.organizationId,
        role: options.role,
      },
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    });
  });

  router.get('/session', async (request, response) => {
    const actor = await sessionSecurity.identityResolver.resolve(request);
    if (!actor) {
      response.status(401).json({ error: 'EDITORIAL_AUTHENTICATION_REQUIRED' });
      return;
    }
    response.status(200).json({ actor });
  });

  router.delete('/session', (request, response) => {
    if (sessionSecurity.requiresCsrf(request) && !sessionSecurity.validateCsrf(request)) {
      response.status(403).json({ error: 'EDITORIAL_CSRF_REQUIRED' });
      return;
    }

    const secure = options?.secureCookies ?? false;
    response.setHeader('Set-Cookie', [
      clearCookie(EDITORIAL_SESSION_COOKIE, SESSION_COOKIE_PATH, secure, true),
      clearCookie(EDITORIAL_CSRF_COOKIE, CSRF_COOKIE_PATH, secure, false),
    ]);
    response.status(204).end();
  });

  return router;
};
