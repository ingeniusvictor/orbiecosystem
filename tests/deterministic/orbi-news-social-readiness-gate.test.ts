import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type {
  CanonicalStoryId,
  EventId,
  OrganizationId,
  SocialPackageId,
  VerificationRecordId,
} from '../../domain/common/types';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
} from '../../domain/editorial/canonical-story';
import {
  SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialPackageStatus,
  type SocialPackage,
} from '../../domain/editorial/social-package';
import {
  SocialReadinessDecision,
  evaluateSocialReadiness,
} from '../../domain/editorial/social-readiness-gate';
import {
  VisualAssetOrigin,
  VisualAssetStatus,
  VisualTruthLabel,
  type VisualAsset,
  type VisualAssetId,
} from '../../domain/visuals/visual-asset';

const orgId = 'orbi' as OrganizationId;
const storyId = 'story-1' as CanonicalStoryId;
const storyRevision = 'story-rev-7';
const articleUrl = 'https://orbi.example/news/story-1';
const visualId = 'visual-1' as VisualAssetId;

const baseStory = (): CanonicalStory => ({
  id: storyId,
  organizationId: orgId,
  eventId: 'event-1' as EventId,
  verificationRecordId: 'verification-1' as VerificationRecordId,
  status: CanonicalStoryStatus.PUBLISHED,
  headline: 'ORBI verified story',
  dek: 'Verified story for social readiness.',
  slug: 'orbi-verified-story',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Summary', body: 'Summary' },
    { key: 'WHAT_HAPPENED', heading: 'What happened', body: 'Facts' },
    { key: 'WHY_IT_MATTERS', heading: 'Why it matters', body: 'Impact' },
    { key: 'PRACTICAL_IMPACT', heading: 'Practical impact', body: 'Use' },
    { key: 'ORBI_LENS', heading: 'ORBI lens', body: 'Perspective' },
  ],
  sourceRefs: [{ label: 'Primary', url: 'https://example.com', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 90,
  socialScore: 85,
  shortScore: null,
  canonicalImageAssetId: visualId,
  createdAt: '2026-08-26T18:00:00.000Z' as CanonicalStory['createdAt'],
  updatedAt: '2026-08-26T18:10:00.000Z' as CanonicalStory['updatedAt'],
  publishedAt: '2026-08-26T18:10:00.000Z' as CanonicalStory['publishedAt'],
});

const targetCopy = (): string => 'x'.repeat(1600);

const basePackage = (): SocialPackage => ({
  id: 'social-1' as SocialPackageId,
  organizationId: orgId,
  canonicalStoryId: storyId,
  status: SocialPackageStatus.DRAFT,
  targetPlatforms: [...SOCIAL_PACKAGE_V1_PLATFORMS],
  socialHeadline: 'ORBI social headline',
  sections: SOCIAL_PACKAGE_REQUIRED_SECTIONS.map((section) => ({ section, text: `Content ${section}` })),
  copy: targetCopy(),
  hashtags: ['#ORBINews'],
  characterCount: 1600,
  imageAspectRatio: '16:9',
  imageAssetId: visualId,
  webArticleUrl: articleUrl,
  provenance: {
    canonicalStoryId: storyId,
    canonicalStoryRevision: storyRevision,
    webArticleUrl: articleUrl,
  },
  createdAt: '2026-08-26T18:11:00.000Z' as SocialPackage['createdAt'],
  updatedAt: '2026-08-26T18:11:00.000Z' as SocialPackage['updatedAt'],
});

const baseVisual = (): VisualAsset => ({
  id: visualId,
  organizationId: orgId,
  canonicalStoryId: storyId,
  status: VisualAssetStatus.VALIDATED,
  origin: VisualAssetOrigin.AI_GENERATED,
  truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
  category: ContentCategory.AI,
  aspectRatio: '16:9',
  width: 1600,
  height: 900,
  assetUrl: 'https://cdn.orbi.example/visual-1.webp',
  overlayText: 'ORBI News',
  createdAt: '2026-08-26T18:11:00.000Z' as VisualAsset['createdAt'],
  updatedAt: '2026-08-26T18:11:00.000Z' as VisualAsset['updatedAt'],
});

test('fully coherent published story and package are READY', () => {
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.READY);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.measuredCharacterCount, 1600);
});

test('story must be published before social readiness', () => {
  const result = evaluateSocialReadiness({
    story: { ...baseStory(), status: CanonicalStoryStatus.APPROVED, publishedAt: null },
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.DEFER);
  assert.ok(result.reasons.includes('CANONICAL_STORY_NOT_PUBLISHED'));
});

test('ORBI score and social score thresholds defer distribution candidate', () => {
  const result = evaluateSocialReadiness({
    story: { ...baseStory(), orbiScore: 84, socialScore: 79 },
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.DEFER);
  assert.ok(result.reasons.includes('ORBI_SCORE_BELOW_SOCIAL_THRESHOLD'));
  assert.ok(result.reasons.includes('SOCIAL_SCORE_BELOW_CANDIDATE_THRESHOLD'));
});

test('stale canonical story provenance defers regeneration', () => {
  const socialPackage = basePackage();
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision: 'story-rev-8',
    socialPackage,
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.DEFER);
  assert.ok(result.reasons.includes('SOCIAL_PACKAGE_PROVENANCE_STALE'));
});

test('missing validated visual defers readiness', () => {
  const socialPackage = { ...basePackage(), imageAssetId: null };
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage,
    visualAsset: null,
  });
  assert.equal(result.decision, SocialReadinessDecision.DEFER);
  assert.ok(result.reasons.includes('VALIDATED_SOCIAL_VISUAL_REQUIRED'));
});

test('visual from another organization blocks package', () => {
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: { ...baseVisual(), organizationId: 'other-org' as OrganizationId },
  });
  assert.equal(result.decision, SocialReadinessDecision.BLOCK);
  assert.ok(result.reasons.includes('SOCIAL_VISUAL_ORGANIZATION_MISMATCH'));
});

test('2201-character copy blocks readiness even when package claims READY', () => {
  const copy = 'x'.repeat(2201);
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage: { ...basePackage(), status: SocialPackageStatus.READY, copy, characterCount: 2201 },
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.BLOCK);
  assert.ok(result.reasons.includes('SOCIAL_COPY_HARD_LIMIT_EXCEEDED'));
});

test('stored character count mismatch blocks even if declared count is under limit', () => {
  const copy = 'x'.repeat(2201);
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage: { ...basePackage(), copy, characterCount: 1 },
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.BLOCK);
  assert.ok(result.reasons.includes('SOCIAL_PACKAGE_CHARACTER_COUNT_MISMATCH'));
  assert.ok(result.reasons.includes('SOCIAL_COPY_HARD_LIMIT_EXCEEDED'));
});

test('below-target copy defers for regeneration', () => {
  const copy = 'x'.repeat(1499);
  const result = evaluateSocialReadiness({
    story: baseStory(),
    storyRevision,
    socialPackage: { ...basePackage(), copy, characterCount: 1499 },
    visualAsset: baseVisual(),
  });
  assert.equal(result.decision, SocialReadinessDecision.DEFER);
  assert.ok(result.reasons.includes('SOCIAL_COPY_BELOW_TARGET_LENGTH'));
});

test('warning and high length bands require human review but remain under hard limit', () => {
  for (const count of [1901, 2200]) {
    const copy = 'x'.repeat(count);
    const result = evaluateSocialReadiness({
      story: baseStory(),
      storyRevision,
      socialPackage: { ...basePackage(), copy, characterCount: count },
      visualAsset: baseVisual(),
    });
    assert.equal(result.decision, SocialReadinessDecision.REVIEW);
    assert.ok(result.reasons.includes('SOCIAL_COPY_OUTSIDE_TARGET_RANGE'));
  }
});

test('high risk or insufficient verification require review', () => {
  const highRisk = evaluateSocialReadiness({
    story: { ...baseStory(), riskLevel: RiskLevel.HIGH },
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: baseVisual(),
  });
  assert.equal(highRisk.decision, SocialReadinessDecision.REVIEW);
  assert.ok(highRisk.reasons.includes('HIGH_RISK_REQUIRES_HUMAN_REVIEW'));

  const moderateVerification = evaluateSocialReadiness({
    story: { ...baseStory(), verificationConfidence: VerificationConfidence.MODERATE },
    storyRevision,
    socialPackage: basePackage(),
    visualAsset: baseVisual(),
  });
  assert.equal(moderateVerification.decision, SocialReadinessDecision.REVIEW);
  assert.ok(moderateVerification.reasons.includes('HIGH_OR_VERY_HIGH_VERIFICATION_REQUIRED'));
});

test('critical risk BLOCK takes precedence over missing dependencies', () => {
  const result = evaluateSocialReadiness({
    story: { ...baseStory(), riskLevel: RiskLevel.CRITICAL, status: CanonicalStoryStatus.APPROVED, publishedAt: null },
    storyRevision,
    socialPackage: { ...basePackage(), imageAssetId: null },
    visualAsset: null,
  });
  assert.equal(result.decision, SocialReadinessDecision.BLOCK);
  assert.ok(result.reasons.includes('CRITICAL_RISK_BLOCKS_SOCIAL_DISTRIBUTION'));
});
