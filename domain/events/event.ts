import type { VerificationConfidence } from '../common/enums';
import type {
  EventId,
  IsoUtcDateTime,
  NewsItemId,
  OrganizationId,
} from '../common/types';

export enum EventStatus {
  DETECTED = 'DETECTED',
  CONSOLIDATING = 'CONSOLIDATING',
  ACTIVE = 'ACTIVE',
  DEVELOPING = 'DEVELOPING',
  CONFIRMED = 'CONFIRMED',
  UPDATED = 'UPDATED',
  SUPERSEDED = 'SUPERSEDED',
  CLOSED = 'CLOSED',
  DISPUTED = 'DISPUTED',
  INVALID = 'INVALID',
}

export enum EventType {
  PRODUCT_LAUNCH = 'PRODUCT_LAUNCH',
  MODEL_RELEASE = 'MODEL_RELEASE',
  SOFTWARE_RELEASE = 'SOFTWARE_RELEASE',
  FEATURE_RELEASE = 'FEATURE_RELEASE',
  COMPANY_ANNOUNCEMENT = 'COMPANY_ANNOUNCEMENT',
  FUNDING = 'FUNDING',
  ACQUISITION = 'ACQUISITION',
  PARTNERSHIP = 'PARTNERSHIP',
  RESEARCH_RELEASE = 'RESEARCH_RELEASE',
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',
  OUTAGE = 'OUTAGE',
  POLICY_CHANGE = 'POLICY_CHANGE',
  REGULATORY_EVENT = 'REGULATORY_EVENT',
  PRICE_CHANGE = 'PRICE_CHANGE',
  OPEN_SOURCE_RELEASE = 'OPEN_SOURCE_RELEASE',
  HARDWARE_RELEASE = 'HARDWARE_RELEASE',
  ENERGY_PROJECT = 'ENERGY_PROJECT',
  OTHER = 'OTHER',
}

export enum EventRelationshipType {
  SAME_EVENT = 'SAME_EVENT',
  UPDATE_OF = 'UPDATE_OF',
  CONFIRMATION_OF = 'CONFIRMATION_OF',
  CONTRADICTION_OF = 'CONTRADICTION_OF',
  FOLLOW_UP_TO = 'FOLLOW_UP_TO',
  RELATED_TO = 'RELATED_TO',
}

export enum EventResolutionOutcome {
  NEW_EVENT = 'NEW_EVENT',
  SAME_EVENT = 'SAME_EVENT',
  MATERIAL_UPDATE = 'MATERIAL_UPDATE',
  RELATED_EVENT = 'RELATED_EVENT',
  UNRESOLVED = 'UNRESOLVED',
}

export interface EventFingerprint {
  readonly primaryEntity: string;
  readonly eventType: EventType;
  readonly subject: string | null;
  readonly dateBucket: string | null;
  readonly secondaryEntities: readonly string[];
  readonly location: string | null;
  readonly fingerprintHash: string;
}

export interface EventRecord {
  readonly id: EventId;
  readonly organizationId: OrganizationId;
  readonly status: EventStatus;
  readonly eventType: EventType;
  readonly primaryEntity: string;
  readonly subject: string | null;
  readonly canonicalSummary: string;
  readonly firstObservedAt: IsoUtcDateTime;
  readonly eventDateCandidate: IsoUtcDateTime | null;
  readonly confirmedEventDate: IsoUtcDateTime | null;
  readonly confidence: VerificationConfidence;
  readonly fingerprint: EventFingerprint;
  readonly version: number;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export interface EventEvidenceLink {
  readonly eventId: EventId;
  readonly newsItemId: NewsItemId;
  readonly stance: 'SUPPORTING' | 'CONTRADICTING' | 'CONTEXT';
  readonly confidence: VerificationConfidence;
  readonly attachedAt: IsoUtcDateTime;
}

export interface EventRelationship {
  readonly sourceEventId: EventId;
  readonly targetEventId: EventId;
  readonly type: EventRelationshipType;
  readonly confidence: number;
  readonly reason: string;
  readonly createdAt: IsoUtcDateTime;
}

export interface EventVersion {
  readonly eventId: EventId;
  readonly version: number;
  readonly summary: string;
  readonly status: EventStatus;
  readonly eventDate: IsoUtcDateTime | null;
  readonly changedFields: readonly string[];
  readonly evidenceNewsItemIds: readonly NewsItemId[];
  readonly createdAt: IsoUtcDateTime;
}

export interface EventResolutionCandidate {
  readonly incomingNewsItemId: NewsItemId;
  readonly candidateEventId: EventId | null;
  readonly similarityScore: number;
  readonly proposedOutcome: EventResolutionOutcome;
  readonly reason: string;
}
