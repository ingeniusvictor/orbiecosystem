import test from 'node:test';
import assert from 'node:assert/strict';

import type { CanonicalStoryId, OrganizationId, SocialPackageId } from '../../domain/common/types';
import {
  SOCIAL_COPY_HARD_LIMIT,
  SOCIAL_COPY_TARGET_MAX,
  SOCIAL_COPY_TARGET_MIN,
  SOCIAL_COPY_WARNING_MAX,
  SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialContentSection,
  SocialPackageStatus,
  SocialPlatform,
  isSocialCopyWithinHardLimit,
  type SocialPackage,
} from '../../domain/editorial/social-package';
import type { VisualAssetId } from '../../domain/visuals/visual-asset';

test('V1 social package contract targets Facebook and Instagram only', () => {
  assert.deepEqual(SOCIAL_PACKAGE_V1_PLATFORMS, [
    SocialPlatform.FACEBOOK,
    SocialPlatform.INSTAGRAM,
  ]);
});

test('social package requires the canonical six editorial sections in order', () => {
  assert.deepEqual(SOCIAL_PACKAGE_REQUIRED_SECTIONS, [
    SocialContentSection.HOOK,
    SocialContentSection.WHAT_HAPPENED,
    SocialContentSection.WHY_IT_MATTERS,
    SocialContentSection.PRACTICAL_IMPLICATION,
    SocialContentSection.ORBI_LENS,
    SocialContentSection.CTA,
  ]);
});

test('social copy policy constants preserve ORBI target, warning, and hard limits', () => {
  assert.equal(SOCIAL_COPY_TARGET_MIN, 1500);
  assert.equal(SOCIAL_COPY_TARGET_MAX, 1900);
  assert.equal(SOCIAL_COPY_WARNING_MAX, 2100);
  assert.equal(SOCIAL_COPY_HARD_LIMIT, 2200);
  assert.equal(isSocialCopyWithinHardLimit('x'.repeat(2200)), true);
  assert.equal(isSocialCopyWithinHardLimit('x'.repeat(2201)), false);
});

test('canonical social package binds organization, story revision, public URL, and typed visual asset', () => {
  const storyId = 'story-1' as CanonicalStoryId;
  const packageValue: SocialPackage = {
    id: 'social-1' as SocialPackageId,
    organizationId: 'orbi-ecosystem' as OrganizationId,
    canonicalStoryId: storyId,
    status: SocialPackageStatus.DRAFT,
    targetPlatforms: [...SOCIAL_PACKAGE_V1_PLATFORMS],
    socialHeadline: 'ORBI News headline',
    sections: SOCIAL_PACKAGE_REQUIRED_SECTIONS.map((section) => ({ section, text: section })),
    copy: 'Draft social copy',
    hashtags: ['#ORBINews', '#IA'],
    characterCount: 17,
    imageAspectRatio: '16:9',
    imageAssetId: 'visual-1' as VisualAssetId,
    webArticleUrl: 'https://orbi.example/news/story-1',
    provenance: {
      canonicalStoryId: storyId,
      canonicalStoryRevision: 'story-rev-7',
      webArticleUrl: 'https://orbi.example/news/story-1',
    },
    createdAt: '2026-08-26T19:20:00.000Z',
    updatedAt: '2026-08-26T19:20:00.000Z',
  };

  assert.equal(packageValue.organizationId, 'orbi-ecosystem');
  assert.equal(packageValue.provenance?.canonicalStoryRevision, 'story-rev-7');
  assert.equal(packageValue.imageAspectRatio, '16:9');
  assert.equal(packageValue.targetPlatforms.includes(SocialPlatform.FACEBOOK), true);
});

test('SENT remains legacy-compatible but readiness is represented by READY', () => {
  assert.equal(SocialPackageStatus.READY, 'READY');
  assert.equal(SocialPackageStatus.SENT, 'SENT');
  assert.notEqual(SocialPackageStatus.READY, SocialPackageStatus.SENT);
});
