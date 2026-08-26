import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RiskLevel,
  SystemMode,
  VerificationConfidence,
  VerificationStatus,
} from '../../domain/common/enums';
import type { CanonicalStory } from '../../domain/editorial/canonical-story';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  SOCIAL_COPY_HARD_LIMIT,
  SocialPackageStatus,
  isSocialCopyWithinHardLimit,
  type SocialPackage,
} from '../../domain/editorial/social-package';
import { validateSocialPackage } from '../../domain/editorial/policy';
import {
  PublicationChannel,
  PublicationStatus,
} from '../../domain/publications/publication';
import {
  PublicationDecision,
  buildPublicationIdempotencyValue,
  evaluatePublicationGate,
} from '../../domain/publications/policy';
import {
  canTransitionNews,
  canTransitionPublication,
} from '../../domain/state-machine/state-machine';
import { NewsStatus } from '../../domain/common/enums';
import {
  VerificationDecision,
  type VerificationRecord,
} from '../../domain/verification/verification';
import {
  evaluateVerificationGate,
  verificationConfidenceFromScore,
} from '../../domain/verification/policy';
import {
  AuditAction,
  AuditActorType,
  AuditEntityType,
  type AuditLogEntry,
} from '../../domain/audit/audit';
import { validateAuditEntry } from '../../domain/audit/policy';

const baseStory = (): CanonicalStory => ({
  id: 'story-1' as CanonicalStory['id'],
  organizationId: 'org-1' as CanonicalStory['organizationId'],
  eventId: 'event-1' as CanonicalStory['eventId'],
  verificationRecordId: 'verification-1' as CanonicalStory['verificationRecordId'],
  status: CanonicalStoryStatus.APPROVED,
  headline: 'Verified ORBI story',
  dek: 'A deterministic editorial test story.',
  slug: 'verified-orbi-story',
  primaryCategory: 'AI' as CanonicalStory['primaryCategory'],
  secondaryCategories: [],
  tone: 'INFORMATIVE' as CanonicalStory['tone'],
  format: 'NEWS_POST' as CanonicalStory['format'],
  sections: [
    { key: 'SUMMARY', heading: 'Summary', body: 'Summary' },
    { key: 'WHAT_HAPPENED', heading: 'What happened', body: 'Facts' },
    { key: 'WHY_IT_MATTERS', heading: 'Why it matters', body: 'Impact' },
    { key: 'PRACTICAL_IMPACT', heading: 'Practical impact', body: 'Use' },
    { key: 'ORBI_LENS', heading: 'ORBI lens', body: 'Educational perspective' },
  ],
  sourceRefs: [{ label: 'Primary', url: 'https://example.com/source', isPrimary: true }],
  verificationConfidence: VerificationConfidence.HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 90,
  socialScore: 90,
  shortScore: 80,
  canonicalImageAssetId: null,
  createdAt: '2026-08-26T00:00:00Z' as CanonicalStory['createdAt'],
  updatedAt: '2026-08-26T00:00:00Z' as CanonicalStory['updatedAt'],
  publishedAt: null,
});

const baseVerificationRecord = (): VerificationRecord => ({
  id: 'verification-1' as VerificationRecord['id'],
  organizationId: 'org-1' as VerificationRecord['organizationId'],
  newsItemId: 'news-1' as VerificationRecord['newsItemId'],
  eventId: null,
  status: VerificationStatus.VERIFIED,
  confidenceScore: 90,
  confidence: VerificationConfidence.VERY_HIGH,
  claims: [],
  evidence: [],
  risk: { level: RiskLevel.LOW, reasons: [], notes: [] },
  primarySourceId: 'source-1' as VerificationRecord['primarySourceId'],
  startedAt: '2026-08-26T00:00:00Z' as VerificationRecord['startedAt'],
  completedAt: '2026-08-26T00:01:00Z' as VerificationRecord['completedAt'],
  verificationVersion: 'ORBI_VERIFY_V1',
});

test('state machine rejects INGESTED -> PUBLISHED', () => {
  const result = canTransitionNews(NewsStatus.INGESTED, NewsStatus.PUBLISHED);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'INVALID_STATE_TRANSITION');
});

test('state machine allows PUBLISHING -> PUBLISHED', () => {
  assert.equal(canTransitionPublication(PublicationStatus.PUBLISHING, PublicationStatus.PUBLISHED).ok, true);
});

test('verification score boundaries are deterministic', () => {
  assert.equal(verificationConfidenceFromScore(89), VerificationConfidence.HIGH);
  assert.equal(verificationConfidenceFromScore(90), VerificationConfidence.VERY_HIGH);
  assert.throws(() => verificationConfidenceFromScore(101), RangeError);
});

test('critical risk is blocked at verification gate', () => {
  const record = baseVerificationRecord();
  const result = evaluateVerificationGate({
    ...record,
    risk: { ...record.risk, level: RiskLevel.CRITICAL },
  });
  assert.equal(result.decision, VerificationDecision.BLOCK);
});

test('verified high-confidence primary-source record is allowed', () => {
  const result = evaluateVerificationGate(baseVerificationRecord());
  assert.equal(result.decision, VerificationDecision.ALLOW_EDITORIAL_PIPELINE);
});

test('social copy allows exactly 2200 characters and rejects 2201', () => {
  assert.equal(isSocialCopyWithinHardLimit('a'.repeat(SOCIAL_COPY_HARD_LIMIT)), true);
  assert.equal(isSocialCopyWithinHardLimit('a'.repeat(SOCIAL_COPY_HARD_LIMIT + 1)), false);
});

test('social package validator rejects a 2201-character package', () => {
  const copy = 'a'.repeat(SOCIAL_COPY_HARD_LIMIT + 1);
  const socialPackage: SocialPackage = {
    id: 'social-1' as SocialPackage['id'],
    canonicalStoryId: 'story-1' as SocialPackage['canonicalStoryId'],
    status: SocialPackageStatus.READY,
    socialHeadline: 'ORBI News',
    copy,
    hashtags: ['#ORBINews'],
    characterCount: [...copy].length,
    imageAspectRatio: '16:9',
    imageAssetId: null,
    webArticleUrl: null,
    createdAt: '2026-08-26T00:00:00Z' as SocialPackage['createdAt'],
    updatedAt: '2026-08-26T00:00:00Z' as SocialPackage['updatedAt'],
  };
  assert.ok(validateSocialPackage(socialPackage).includes('Social copy exceeds the 2200 character hard limit.'));
});

test('Facebook and Instagram remain manual in V1', () => {
  for (const channel of [PublicationChannel.FACEBOOK, PublicationChannel.INSTAGRAM]) {
    const result = evaluatePublicationGate({
      story: baseStory(),
      channel,
      currentStatus: PublicationStatus.APPROVED,
      systemMode: SystemMode.NORMAL,
      publishingEnabled: true,
      channelEnabled: true,
      duplicateIdempotencyKeyExists: false,
      retryCount: 0,
      maxRetries: 3,
    });
    assert.equal(result.decision, PublicationDecision.REQUIRE_REVIEW);
  }
});

test('valid ORBI web publication can pass the gate', () => {
  const result = evaluatePublicationGate({
    story: baseStory(),
    channel: PublicationChannel.ORBI_WEB,
    currentStatus: PublicationStatus.APPROVED,
    systemMode: SystemMode.NORMAL,
    publishingEnabled: true,
    channelEnabled: true,
    duplicateIdempotencyKeyExists: false,
    retryCount: 0,
    maxRetries: 3,
  });
  assert.equal(result.decision, PublicationDecision.ALLOW);
});

test('duplicate idempotency key blocks publication', () => {
  const result = evaluatePublicationGate({
    story: baseStory(),
    channel: PublicationChannel.ORBI_WEB,
    currentStatus: PublicationStatus.APPROVED,
    systemMode: SystemMode.NORMAL,
    publishingEnabled: true,
    channelEnabled: true,
    duplicateIdempotencyKeyExists: true,
    retryCount: 0,
    maxRetries: 3,
  });
  assert.equal(result.decision, PublicationDecision.BLOCK);
  assert.ok(result.reasons.includes('DUPLICATE_IDEMPOTENCY_KEY'));
});

test('idempotency value is stable for identical publication identity', () => {
  const input = {
    channel: PublicationChannel.ORBI_WEB,
    accountId: 'orbi-web',
    storyId: 'story-1',
    slotKey: 'immediate',
  };
  assert.equal(buildPublicationIdempotencyValue(input), buildPublicationIdempotencyValue(input));
});

test('AI cannot be final approver in audit trail', () => {
  const entry: AuditLogEntry = {
    id: 'audit-1' as AuditLogEntry['id'],
    organizationId: 'org-1' as AuditLogEntry['organizationId'],
    entityType: AuditEntityType.CANONICAL_STORY,
    entityId: 'story-1',
    action: AuditAction.APPROVED,
    actor: { type: AuditActorType.AI, id: 'orbi-ai', displayName: 'ORBI AI' },
    stateChange: null,
    decisionContext: null,
    errorContext: null,
    correlationId: 'corr-1',
    metadata: {},
    occurredAt: '2026-08-26T00:00:00Z' as AuditLogEntry['occurredAt'],
  };
  const validation = validateAuditEntry(entry);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('AI_CANNOT_BE_FINAL_APPROVER'));
});
