import {
  EditorialControlAction,
  EditorialQueueBucket,
  type EditorialActionAssessment,
  type EditorialQueueItem,
} from '../../domain/editorial';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';

export type EditorialTokenProvider = () => Promise<string | null> | string | null;
export type EditorialFetch = typeof fetch;

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

const isEditorialQueueItem = (value: unknown): value is EditorialQueueItem =>
  isRecord(value) &&
  typeof value.storyId === 'string' &&
  typeof value.revision === 'string' && value.revision.length > 0 &&
  typeof value.headline === 'string' &&
  typeof value.slug === 'string' &&
  isEnumValue(ContentCategory, value.category) &&
  isEnumValue(RiskLevel, value.riskLevel) &&
  isEnumValue(VerificationConfidence, value.verificationConfidence) &&
  typeof value.orbiScore === 'number' &&
  Number.isFinite(value.orbiScore) &&
  typeof value.updatedAt === 'string' &&
  isEnumValue(EditorialQueueBucket, value.bucket) &&
  typeof value.requiresHumanAttention === 'boolean' &&
  Array.isArray(value.attentionReasons) &&
  value.attentionReasons.every((reason) => typeof reason === 'string') &&
  Array.isArray(value.actionAssessments) &&
  value.actionAssessments.every(isActionAssessment);

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

export interface EditorialControlCenterRepository {
  listQueue(bucket?: EditorialQueueBucket | null): Promise<readonly EditorialQueueItem[]>;
  executeAction(input: ExecuteEditorialActionInput): Promise<ExecuteEditorialActionResult>;
}

export const noEditorialTokenProvider: EditorialTokenProvider = () => null;

const parseErrorReasons = async (response: Response): Promise<readonly string[]> => {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && Array.isArray(payload.reasons)) {
      return payload.reasons.filter((reason): reason is string => typeof reason === 'string');
    }
  } catch {
    // Error body is optional; status remains authoritative.
  }
  return [];
};

export const createHttpEditorialControlCenterRepository = ({
  fetchImpl = fetch,
  tokenProvider = noEditorialTokenProvider,
}: {
  fetchImpl?: EditorialFetch;
  tokenProvider?: EditorialTokenProvider;
} = {}): EditorialControlCenterRepository => ({
  async listQueue(bucket = null): Promise<readonly EditorialQueueItem[]> {
    const token = await tokenProvider();
    if (!token) throw new EditorialRepositoryError('EDITORIAL_AUTH_TOKEN_UNAVAILABLE');

    const query = bucket ? `?bucket=${encodeURIComponent(bucket)}` : '';
    const response = await fetchImpl(`/api/editorial/queue${query}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_AUTHENTICATION_REQUIRED', 401);
      if (response.status === 403) throw new EditorialRepositoryError('EDITORIAL_ROLE_REQUIRED', 403);
      throw new EditorialRepositoryError('EDITORIAL_QUEUE_REQUEST_FAILED', response.status);
    }

    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.items) || !payload.items.every(isEditorialQueueItem)) {
      throw new EditorialRepositoryError('EDITORIAL_QUEUE_INVALID_RESPONSE');
    }

    return payload.items;
  },

  async executeAction(input): Promise<ExecuteEditorialActionResult> {
    const token = await tokenProvider();
    if (!token) throw new EditorialRepositoryError('EDITORIAL_AUTH_TOKEN_UNAVAILABLE');

    const response = await fetchImpl(`/api/editorial/stories/${encodeURIComponent(input.storyId)}/actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: input.action,
        expectedRevision: input.expectedRevision,
        reason: input.reason?.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const reasons = await parseErrorReasons(response);
      if (response.status === 401) throw new EditorialRepositoryError('EDITORIAL_AUTHENTICATION_REQUIRED', 401, reasons);
      if (response.status === 403) throw new EditorialRepositoryError('EDITORIAL_ACTION_FORBIDDEN', 403, reasons);
      if (response.status === 409) throw new EditorialRepositoryError('EDITORIAL_ACTION_CONFLICT', 409, reasons);
      if (response.status === 503) throw new EditorialRepositoryError('EDITORIAL_MUTATION_NOT_CONFIGURED', 503, reasons);
      throw new EditorialRepositoryError('EDITORIAL_ACTION_REQUEST_FAILED', response.status, reasons);
    }

    const payload: unknown = await response.json();
    if (
      !isRecord(payload) || payload.ok !== true ||
      !isEnumValue(EditorialControlAction, payload.action) ||
      typeof payload.storyId !== 'string' ||
      typeof payload.revision !== 'string' || !payload.revision
    ) {
      throw new EditorialRepositoryError('EDITORIAL_ACTION_INVALID_RESPONSE');
    }

    return {
      action: payload.action,
      storyId: payload.storyId,
      revision: payload.revision,
    };
  },
});

export const editorialControlCenterRepository = createHttpEditorialControlCenterRepository();
