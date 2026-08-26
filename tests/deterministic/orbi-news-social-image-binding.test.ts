import assert from 'node:assert/strict';
import test from 'node:test';
import { ContentCategory } from '../../domain/common/enums';
import type {
  CanonicalStoryId,
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
} from '../../domain/common/types';
import { bindSocialImage } from '../../domain/editorial/social-image-binding';
import {
  SocialContentSection,
  SocialPackageStatus,
  SocialPlatform,
  type SocialPackage,
} from '../../domain/editorial/social-package';
import {
  VisualAssetOrigin,
  VisualAssetStatus,
  VisualTruthLabel,
  type VisualAsset,
  type VisualAssetId,
} from '../../domain/visuals/visual-asset';

const asId = <T>(value: string): T => value as T;
const createdAt = '2026-08-26T20:15:00.000Z' as IsoUtcDateTime;
const boundAt = '2026-08-26T20:16:00.000Z' as IsoUtcDateTime;

const makePackage = (overrides: Partial<SocialPackage> = {}): SocialPackage => ({
  id: asId<SocialPackageId>('social-package-image'),
  organizationId: asId<OrganizationId>('org-orbi'),
  canonicalStoryId: asId<CanonicalStoryId>('story-image'),
  status: SocialPackageStatus.DRAFT,
  targetPlatforms: [SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM],
  socialHeadline: 'Historia ORBI',
  sections: [
    { section: SocialContentSection.HOOK, text: 'Hook' },
    { section: SocialContentSection.WHAT_HAPPENED, text: 'Qué pasó' },
    { section: SocialContentSection.WHY_IT_MATTERS, text: 'Por qué importa' },
    { section: SocialContentSection.PRACTICAL_IMPLICATION, text: 'Implicación' },
    { section: SocialContentSection.ORBI_LENS, text: 'Mirada ORBI' },
    { section: SocialContentSection.CTA, text: 'CTA' },
  ],
  copy: 'Hook',
  hashtags: ['#ORBIEcosystem', '#ORBINews'],
  characterCount: 4,
  imageAspectRatio: '16:9',
  imageAssetId: null,
  webArticleUrl: 'https://orbi.example/news/story-image',
  provenance: {
    canonicalStoryId: asId<CanonicalStoryId>('story-image'),
    canonicalStoryRevision: 'rev-1',
    webArticleUrl: 'https://orbi.example/news/story-image',
  },
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

const makeVisual = (overrides: Partial<VisualAsset> = {}): VisualAsset => ({
  id: asId<VisualAssetId>('visual-approved'),
  organizationId: asId<OrganizationId>('org-orbi'),
  canonicalStoryId: asId<CanonicalStoryId>('story-image'),
  status: VisualAssetStatus.VALIDATED,
  origin: VisualAssetOrigin.AI_GENERATED,
  truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
  category: ContentCategory.AI,
  aspectRatio: '16:9',
  width: 1600,
  height: 900,
  assetUrl: 'https://cdn.orbi.example/visual-approved.webp',
  overlayText: 'IA que importa',
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

test('bindSocialImage binds a validated 16:9 visual without changing readiness authority', () => {
  const socialPackage = makePackage();
  const visual = makeVisual();
  const result = bindSocialImage({ socialPackage, visualAsset: visual, boundAt });

  assert.equal(result.imageAssetId, visual.id);
  assert.equal(result.status, SocialPackageStatus.DRAFT);
  assert.equal(result.copy, socialPackage.copy);
  assert.deepEqual(result.hashtags, socialPackage.hashtags);
  assert.equal(result.provenance, socialPackage.provenance);
  assert.equal(result.updatedAt, boundAt);
});

test('bindSocialImage is idempotent for the same approved visual', () => {
  const visual = makeVisual();
  const alreadyBound = makePackage({ imageAssetId: visual.id });
  const result = bindSocialImage({ socialPackage: alreadyBound, visualAsset: visual, boundAt });
  assert.equal(result.imageAssetId, visual.id);
  assert.equal(result.status, SocialPackageStatus.DRAFT);
});

test('bindSocialImage blocks silent replacement with a different visual', () => {
  const existing = asId<VisualAssetId>('visual-existing');
  assert.throws(
    () => bindSocialImage({ socialPackage: makePackage({ imageAssetId: existing }), visualAsset: makeVisual(), boundAt }),
    /SOCIAL_VISUAL_REPLACEMENT_REQUIRES_EXPLICIT_REVIEW/,
  );
});

test('bindSocialImage rejects cross-organization and cross-story visuals', () => {
  assert.throws(
    () => bindSocialImage({
      socialPackage: makePackage(),
      visualAsset: makeVisual({ organizationId: asId<OrganizationId>('org-other') }),
      boundAt,
    }),
    /SOCIAL_VISUAL_ORGANIZATION_MISMATCH/,
  );
  assert.throws(
    () => bindSocialImage({
      socialPackage: makePackage(),
      visualAsset: makeVisual({ canonicalStoryId: asId<CanonicalStoryId>('story-other') }),
      boundAt,
    }),
    /SOCIAL_VISUAL_STORY_MISMATCH/,
  );
});

test('bindSocialImage requires a validated visual with an absolute HTTP(S) asset URL', () => {
  assert.throws(
    () => bindSocialImage({ socialPackage: makePackage(), visualAsset: makeVisual({ status: VisualAssetStatus.GENERATED }), boundAt }),
    /SOCIAL_VISUAL_MUST_BE_VALIDATED/,
  );
  assert.throws(
    () => bindSocialImage({ socialPackage: makePackage(), visualAsset: makeVisual({ assetUrl: null }), boundAt }),
    /SOCIAL_VISUAL_ASSET_URL_REQUIRED/,
  );
  assert.throws(
    () => bindSocialImage({ socialPackage: makePackage(), visualAsset: makeVisual({ assetUrl: 'file:\/\/visual.webp' }), boundAt }),
    /SOCIAL_VISUAL_ASSET_URL_INVALID/,
  );
});

test('bindSocialImage refuses non-draft social packages', () => {
  assert.throws(
    () => bindSocialImage({
      socialPackage: makePackage({ status: SocialPackageStatus.READY }),
      visualAsset: makeVisual(),
      boundAt,
    }),
    /SOCIAL_IMAGE_BINDING_REQUIRES_DRAFT_PACKAGE/,
  );
});
