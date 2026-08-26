import type { ContentCategory, RiskLevel, VerificationConfidence } from '../common/enums';
import type {
  CanonicalStoryId,
  EventId,
  IsoUtcDateTime,
  OrganizationId,
  VerificationRecordId,
} from '../common/types';

export enum CanonicalStoryStatus {
  DRAFTING = 'DRAFTING',
  DRAFT_READY = 'DRAFT_READY',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
}

export enum EditorialTone {
  INFORMATIVE = 'INFORMATIVE',
  EDUCATIONAL = 'EDUCATIONAL',
  ANALYTICAL = 'ANALYTICAL',
  PROFESSIONAL = 'PROFESSIONAL',
  CONVERSATIONAL = 'CONVERSATIONAL',
}

export enum ContentFormat {
  NEWS_POST = 'NEWS_POST',
  BREAKING_NEWS = 'BREAKING_NEWS',
  EXPLAINER = 'EXPLAINER',
  ANALYSIS = 'ANALYSIS',
  EVENT_UPDATE = 'EVENT_UPDATE',
  SHORT_SCRIPT = 'SHORT_SCRIPT',
}

export interface CanonicalStorySection {
  readonly key:
    | 'SUMMARY'
    | 'WHAT_HAPPENED'
    | 'WHY_IT_MATTERS'
    | 'PRACTICAL_IMPACT'
    | 'ORBI_LENS'
    | 'FUTURE_OUTLOOK';
  readonly heading: string;
  readonly body: string;
}

export interface CanonicalStorySourceRef {
  readonly label: string;
  readonly url: string;
  readonly isPrimary: boolean;
}

export interface CanonicalStory {
  readonly id: CanonicalStoryId;
  readonly organizationId: OrganizationId;
  readonly eventId: EventId;
  readonly verificationRecordId: VerificationRecordId;
  readonly status: CanonicalStoryStatus;
  readonly headline: string;
  readonly dek: string;
  readonly slug: string;
  readonly primaryCategory: ContentCategory;
  readonly secondaryCategories: readonly ContentCategory[];
  readonly tone: EditorialTone;
  readonly format: ContentFormat;
  readonly sections: readonly CanonicalStorySection[];
  readonly sourceRefs: readonly CanonicalStorySourceRef[];
  readonly verificationConfidence: VerificationConfidence;
  readonly riskLevel: RiskLevel;
  readonly orbiScore: number;
  readonly socialScore: number | null;
  readonly shortScore: number | null;
  readonly canonicalImageAssetId: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
  readonly publishedAt: IsoUtcDateTime | null;
}
