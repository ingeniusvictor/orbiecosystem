import {
  EditorialControlAction,
  EditorialQueueBucket,
  EditorialRole,
  ManualPublicationStatus,
  SocialEmailStatus,
  SocialReadinessDecision,
  type EditorialActionAssessment,
  type EditorialQueueItem,
  type SocialDistributionQueueView,
} from '../../domain/editorial';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';

export type EditorialTokenProvider = () => Promise<string | null> | string | null;
export type EditorialCsrfProvider = () => string | null;
export type EditorialFetch = typeof fetch;

export const EDITORIAL_CSRF_COOKIE = 'orbi_editorial_csrf';
export const EDITORIAL_CSRF_HEADER = 'X-ORBI-EDITORIAL-CSRF';

export class EditorialRepositoryError extends Error {
  constructor(
    readonly code: string,
    readonly status: number | null = null,
    readonly reasons: readonly string[] = [],
  ) {
    super(code);
    this.name = 'EditorialRepositoryError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] =>
  typeof value === 'string' && Object.values(enumObject).includes(value);

const isActionAssessment = (value: unknown): value is EditorialActionAssessment =>
  isRecord(value) &&
  isEnumValue(EditorialControlAction, value.action) &&
  typeof value.allowed === 'boolean' &&
  Array.isArray(value.reasons) &&
  value.reasons.every((reason) => typeof reason === 'string');

const isNullableEnum = <T extends Record<string, string>>(enumObject: T, value: unknown): boolean =>
  value === null || isEnumValue(enumObject, value);

const isSocialDistributionQueueView = (value: unknown): value is SocialDistributionQueueView =>
  isRecord(value) &&
  isEnumValue(SocialReadinessDecision, value.readiness) &&
  typeof value.socialScore === 'number' && Number.isFinite(value.socialScore) &&
  typeof value.copy === 'string' &&
  typeof value.characterCount === 'number' && Number.isInteger(value.characterCount) && value.characterCount >= 0 &&
  Array.isArray(value.hashtags) && value.hashtags.every((tag) => typeof tag === 'string') &&
  (value.imageUrl === null || typeof value.imageUrl === 'string') &&
  isNullableEnum(SocialEmailStatus, value.mailerStatus) &&
  isNullableEnum(ManualPublicationStatus, value.facebookStatus) &&
  isNullableEnum(ManualPublicationStatus, value.instagramStatus);

const isEditorialQueueItem = (value: unknown): value is EditorialQueueItem =>
  isRecord(value) &&
  typeof value.storyId === 'string' &&
  typeof value.revision === 'string' && value.revision.length > 0 &&
  typeof value.headline === 'string' &&
  typeof value.slug === 'string' &&
  isEnumValue(ContentCategory, value.category) &&
  isEnumValue(RiskLevel, value.riskLevel) &&
  isEnumValue(VerificationConfidence, value.verificationConfidence) &&
  typeof value.orbiScore === 'number' && Number.isFinite(value.orbiScore) &&
  typeof value.updatedAt === 'string' &&
  isEnumValue(EditorialQueueBucket, value.bucket) &&
  typeof value.requiresHumanAttention === 'boolean' &&
  Array.isArray(value.attentionReasons) && value.attentionReasons.every((reason) => typeof reason === 'string') &&
  Array.isArray(value.actionAssessments) && value.actionAssessments.every(isActionAssessment) &&
  (value.socialDistribution === undefined || value.socialDistribution === null || isSocialDistributionQueueView(value.socialDistribution));

export interface ExecuteEditorialActionInput {
  readonly storyId: string;
  readonly action: EditorialControlAction;
  readonly expectedRevision: string;
  readonly reason?: string | null;
}

export interface ExecuteEditorialActionResult {
  readonly action: EditorialControlAction;
  readonly storyId: string;
  readonly revision: string;
}

export interface EditorialSessionActor {
  readonly actorId: string;
  readonly organizationId: string;
  readonly role: EditorialRole;
}

export interface EditorialSessionState {
  readonly actor: EditorialSessionActor;
  readonly expiresAt: string | null;
}

export interface EditorialControlCenterRepository {
  listQueue(bucket?: EditorialQueueBucket | null): Promise<readonly EditorialQueueItem[]>;
  executeAction(input: ExecuteEditorialActionInput): Promise<ExecuteEditorialActionResult>;
  getSession(): Promise<EditorialSessionState | null>;
  login(accessKey: string): Promise<EditorialSessionState>;
  logout(): Promise<void>;
}

export const noEditorialTokenProvider: EditorialTokenProvider = () => null;

export const readBrowserCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  for (const segment of document.cookie.split(';')) {
    const separator = segment.indexOf('=');
    if (separator <= 0) continue;
    if (segment.slice(0, separator).trim() !== name) continue;
    const raw = segment.slice(separator + 1).trim();
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
  return null;
};

export const browserEditorialCsrfProvider: EditorialCsrfProvider = () => readBrowserCookie(EDITORIAL_CSRF_COOKIE);

const parseErrorPayload = async (response: Response): Promise<{ readonly error: string | null; readonly reasons: readonly string[] }> => {
  try {
    const payload: unknown = await response.json();
    if (!isRecord(payload)) return { error: null, reasons: [] };
    return {
      error: typeof payload.error === 'string' ? payload.error : null,
      reasons: Array.isArray(payload.reasons) ? payload.reasons.filter((reason): reason is string => typeof reason === 'string') : [],
    };
  } catch { return { error: null, reasons: [] }; }
};

const parseSessionActor = (value: unknown): EditorialSessionActor | null => {
  if (!isRecord(value) || typeof value.actorId !== 'string' || !value.actorId.trim() || typeof value.organizationId !== 'string' || !value.organizationId.trim() || !isEnumValue(EditorialRole, value.role)) return null;
  return { actorId: value.actorId, organizationId: value.organizationId, role: value.role };
};

const parseSessionPayload = (payload: unknown): EditorialSessionState | null => {
  if (!isRecord(payload)) return null;
  const actor = parseSessionActor(payload.actor);
  if (!actor) return null;
  if (payload.expiresAt !== undefined && payload.expiresAt !== null && typeof payload.expiresAt !== 'string') return null;
  return { actor, expiresAt: typeof payload.expiresAt === 'string' ? payload.expiresAt : null };
};

const authHeaders = async (tokenProvider: EditorialTokenProvider): Promise<{ readonly token: string | null; readonly headers: Record<string, string> }> => {
  const token = await tokenProvider();
  return { token, headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

export const createHttpEditorialControlCenterRepository = ({ fetchImpl = fetch, tokenProvider = noEditorialTokenProvider, csrfProvider = browserEditorialCsrfProvider }: { fetchImpl?: EditorialFetch; tokenProvider?: EditorialTokenProvider; csrfProvider?: EditorialCsrfProvider } = {}): EditorialControlCenterRepository => ({
  async listQueue(bucket = null): Promise<readonly EditorialQueueItem[]> {
    const auth = await authHeaders(tokenProvider);
    const query = bucket ? `?bucket=${encodeURIComponent(bucket)}` : '';
    const response = await fetchImpl(`/api/editorial/queue${query}`, { credentials: 'same-origin', headers: { ...auth.headers, Accept: 'application/json' } });
    if (!response.ok) {
      if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_AUTHENTICATION_REQUIRED', 401);
      if (response.status === 403) throw new EditorialRepositoryError('EDITORIAL_ROLE_REQUIRED', 403);
      throw new EditorialRepositoryError('EDITORIAL_QUEUE_REQUEST_FAILED', response.status);
    }
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.items) || !payload.items.every(isEditorialQueueItem)) throw new EditorialRepositoryError('EDITORIAL_QUEUE_INVALID_RESPONSE');
    return payload.items;
  },

  async executeAction(input): Promise<ExecuteEditorialActionResult> {
    const auth = await authHeaders(tokenProvider);
    const csrf = auth.token ? null : csrfProvider();
    if (!auth.token && !csrf) throw new EditorialRepositoryError('EDITORIAL_CSRF_TOKEN_UNAVAILABLE');
    const response = await fetchImpl(`/api/editorial/stories/${encodeURIComponent(input.storyId)}/actions`, {
      method: 'POST', credentials: 'same-origin',
      headers: { ...auth.headers, ...(csrf ? { [EDITORIAL_CSRF_HEADER]: csrf } : {}), Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: input.action, expectedRevision: input.expectedRevision, reason: input.reason?.trim() || undefined }),
    });
    if (!response.ok) {
      const errorPayload = await parseErrorPayload(response);
      if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_AUTHENTICATION_REQUIRED', 401, errorPayload.reasons);
      if (response.status === 403) throw new EditorialRepositoryError(errorPayload.error === 'EDITORIAL_CSRF_REQUIRED' ? 'EDITORIAL_CSRF_REQUIRED' : 'EDITORIAL_ACTION_FORBIDDEN', 403, errorPayload.reasons);
      if (response.status === 409) throw new EditorialRepositoryError('EDITORIAL_ACTION_CONFLICT', 409, errorPayload.reasons);
      if (response.status === 503) throw new EditorialRepositoryError('EDITORIAL_MUTATION_NOT_CONFIGURED', 503, errorPayload.reasons);
      throw new EditorialRepositoryError('EDITORIAL_ACTION_REQUEST_FAILED', response.status, errorPayload.reasons);
    }
    const payload: unknown = await response.json();
    const result = isRecord(payload) && isRecord(payload.result) ? payload.result : null;
    if (!result || result.ok !== true || !isEnumValue(EditorialControlAction, result.action) || typeof result.storyId !== 'string' || typeof result.revision !== 'string' || !result.revision) throw new EditorialRepositoryError('EDITORIAL_ACTION_INVALID_RESPONSE');
    return { action: result.action, storyId: result.storyId, revision: result.revision };
  },

  async getSession(): Promise<EditorialSessionState | null> {
    const response = await fetchImpl('/api/editorial/session', { method: 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (response.status === 401) return null;
    if (!response.ok) throw new EditorialRepositoryError('EDITORIAL_SESSION_REQUEST_FAILED', response.status);
    const session = parseSessionPayload(await response.json());
    if (!session) throw new EditorialRepositoryError('EDITORIAL_SESSION_INVALID_RESPONSE');
    return session;
  },

  async login(accessKey): Promise<EditorialSessionState> {
    const normalizedAccessKey = accessKey.trim();
    if (!normalizedAccessKey) throw new EditorialRepositoryError('EDITORIAL_ACCESS_KEY_REQUIRED');
    const response = await fetchImpl('/api/editorial/session', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ accessKey: normalizedAccessKey }) });
    if (!response.ok) {
      const errorPayload = await parseErrorPayload(response);
      if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_SESSION_ACCESS_DENIED', 401);
      if (response.status === 503) throw new EditorialRepositoryError('EDITORIAL_SESSION_NOT_CONFIGURED', 503);
      throw new EditorialRepositoryError(errorPayload.error ?? 'EDITORIAL_SESSION_LOGIN_FAILED', response.status);
    }
    const session = parseSessionPayload(await response.json());
    if (!session) throw new EditorialRepositoryError('EDITORIAL_SESSION_INVALID_RESPONSE');
    return session;
  },

  async logout(): Promise<void> {
    const csrf = csrfProvider();
    if (!csrf) throw new EditorialRepositoryError('EDITORIAL_CSRF_TOKEN_UNAVAILABLE');
    const response = await fetchImpl('/api/editorial/session', { method: 'DELETE', credentials: 'same-origin', headers: { [EDITORIAL_CSRF_HEADER]: csrf } });
    if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_AUTHENTICATION_REQUIRED', 401);
    if (response.status === 403) throw new EditorialRepositoryError('EDITORIAL_CSRF_REQUIRED', 403);
    if (!response.ok && response.status !== 204) throw new EditorialRepositoryError('EDITORIAL_SESSION_LOGOUT_FAILED', response.status);
  },
});

export const editorialControlCenterRepository = createHttpEditorialControlCenterRepository();
