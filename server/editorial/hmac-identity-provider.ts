import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { EditorialRole } from '../../domain/editorial';
import type { OrganizationId } from '../../domain/common/types';
import {
  isEditorialRole,
  type AuthenticatedEditorialActor,
  type EditorialIdentityResolver,
} from './identity';

export interface EditorialAccessTokenClaims {
  readonly sub: string;
  readonly org: string;
  readonly role: EditorialRole;
  readonly iat: number;
  readonly exp: number;
}

export interface HmacEditorialIdentityProviderOptions {
  readonly secret: string;
  readonly now?: () => number;
  readonly maxClockSkewSeconds?: number;
}

const encodeBase64Url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

const decodeBase64Url = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8');

const signatureFor = (payload: string, secret: string): Buffer =>
  createHmac('sha256', secret).update(payload).digest();

const isValidClaims = (value: unknown): value is EditorialAccessTokenClaims => {
  if (!value || typeof value !== 'object') return false;
  const claims = value as Partial<EditorialAccessTokenClaims>;
  return (
    typeof claims.sub === 'string' && claims.sub.trim().length > 0 &&
    typeof claims.org === 'string' && claims.org.trim().length > 0 &&
    isEditorialRole(claims.role) &&
    typeof claims.iat === 'number' && Number.isInteger(claims.iat) &&
    typeof claims.exp === 'number' && Number.isInteger(claims.exp) &&
    claims.exp > claims.iat
  );
};

const extractBearerToken = (request: Request): string | null => {
  const authorization = request.header('authorization');
  if (!authorization) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
};

export const verifyEditorialAccessToken = (
  token: string,
  options: HmacEditorialIdentityProviderOptions,
): AuthenticatedEditorialActor | null => {
  if (!options.secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;
  if (!payloadPart || !signaturePart) return null;

  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(signaturePart, 'base64url');
  } catch {
    return null;
  }

  const expectedSignature = signatureFor(payloadPart, options.secret);
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(decodeBase64Url(payloadPart));
  } catch {
    return null;
  }
  if (!isValidClaims(claims)) return null;

  const nowSeconds = Math.floor((options.now?.() ?? Date.now()) / 1000);
  const skew = Math.max(0, options.maxClockSkewSeconds ?? 30);
  if (claims.iat > nowSeconds + skew) return null;
  if (claims.exp <= nowSeconds - skew) return null;

  return {
    actorId: claims.sub,
    organizationId: claims.org as OrganizationId,
    role: claims.role,
  };
};

export const createHmacEditorialIdentityResolver = (
  options: HmacEditorialIdentityProviderOptions,
): EditorialIdentityResolver => ({
  async resolve(request): Promise<AuthenticatedEditorialActor | null> {
    const token = extractBearerToken(request);
    return token ? verifyEditorialAccessToken(token, options) : null;
  },
});

/** Test/tooling helper only. Runtime API does not expose token issuance. */
export const signEditorialAccessToken = (
  claims: EditorialAccessTokenClaims,
  secret: string,
): string => {
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signature = signatureFor(payload, secret).toString('base64url');
  return `${payload}.${signature}`;
};
