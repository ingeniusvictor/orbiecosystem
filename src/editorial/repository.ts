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

export interface EditorialControlCenterRepository {
  listQueue(bucket?: EditorialQueueBucket | null): Promise<readonly EditorialQueueItem[]>;
}

export const noEditorialTokenProvider: EditorialTokenProvider = () => null;

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
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
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
});

export const editorialControlCenterRepository = createHttpEditorialControlCenterRepository();
