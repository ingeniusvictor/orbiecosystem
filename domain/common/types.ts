export type Brand<T, B extends string> = T & { readonly __brand: B };

export type OrganizationId = Brand<string, 'OrganizationId'>;
export type NewsItemId = Brand<string, 'NewsItemId'>;
export type EventId = Brand<string, 'EventId'>;
export type SourceId = Brand<string, 'SourceId'>;
export type VerificationRecordId = Brand<string, 'VerificationRecordId'>;
export type CanonicalStoryId = Brand<string, 'CanonicalStoryId'>;
export type SocialPackageId = Brand<string, 'SocialPackageId'>;
export type PublicationId = Brand<string, 'PublicationId'>;
export type AuditLogId = Brand<string, 'AuditLogId'>;

export type IsoUtcDateTime = Brand<string, 'IsoUtcDateTime'>;

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
