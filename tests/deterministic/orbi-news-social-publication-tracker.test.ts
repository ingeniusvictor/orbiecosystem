import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  CanonicalStoryId,
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
} from '../../domain/common/types';
import {
  ManualPublicationStatus,
  createManualPublicationTracker,
  isManualPublicationComplete,
  markManualPublicationFailed,
  markManualPublicationPosted,
} from '../../domain/editorial/social-publication-tracker';
import {
  SocialContentSection,
  SocialPackageStatus,
  SocialPlatform,
  type SocialPackage,
} from '../../domain/editorial/social-package';

const asId = <T>(value: string): T => value as T;
const t0 = '2026-08-26T20:30:00.000Z' as IsoUtcDateTime;
const t1 = '2026-08-26T20:31:00.000Z' as IsoUtcDateTime;
const t2 = '2026-08-26T20:32:00.000Z' as IsoUtcDateTime;
const actor = { actorId: 'victor', displayName: 'Victor' };

const makePackage = (overrides: Partial<SocialPackage> = {}): SocialPackage => ({
  id: asId<SocialPackageId>('social-ready-1'),
  organizationId: asId<OrganizationId>('org-orbi'),
  canonicalStoryId: asId<CanonicalStoryId>('story-1'),
  status: SocialPackageStatus.READY,
  targetPlatforms: [SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM],
  socialHeadline: 'Historia ORBI',
  sections: [
    { section: SocialContentSection.HOOK, text: 'Hook' },
    { section: SocialContentSection.WHAT_HAPPENED, text: 'Qué ocurrió' },
    { section: SocialContentSection.WHY_IT_MATTERS, text: 'Por qué importa' },
    { section: SocialContentSection.PRACTICAL_IMPLICATION, text: 'Impacto' },
    { section: SocialContentSection.ORBI_LENS, text: 'Mirada ORBI' },
    { section: SocialContentSection.CTA, text: 'CTA' },
  ],
  copy: 'copy',
  hashtags: ['#ORBIEcosystem', '#ORBINews'],
  characterCount: 4,
  imageAspectRatio: '16:9',
  imageAssetId: null,
  webArticleUrl: 'https://orbi.example/news/story-1',
  provenance: {
    canonicalStoryId: asId<CanonicalStoryId>('story-1'),
    canonicalStoryRevision: 'story-rev-1',
    webArticleUrl: 'https://orbi.example/news/story-1',
  },
  createdAt: t0,
  updatedAt: t0,
  ...overrides,
});

test('tracker starts both V1 platforms independently at NOT_POSTED', () => {
  const tracker = createManualPublicationTracker(makePackage(), 'pkg-rev-1', t0);
  assert.equal(tracker.platforms[SocialPlatform.FACEBOOK].status, ManualPublicationStatus.NOT_POSTED);
  assert.equal(tracker.platforms[SocialPlatform.INSTAGRAM].status, ManualPublicationStatus.NOT_POSTED);
  assert.equal(isManualPublicationComplete(tracker), false);
});

test('posting Facebook does not mutate Instagram and both posted completes tracker', () => {
  const pkg = makePackage();
  const initial = createManualPublicationTracker(pkg, 'pkg-rev-1', t0);
  const facebook = markManualPublicationPosted({
    tracker: initial,
    socialPackage: pkg,
    packageRevision: 'pkg-rev-1',
    platform: SocialPlatform.FACEBOOK,
    postUrl: 'https://facebook.com/orbi/posts/123',
    actor,
    postedAt: t1,
  });

  assert.equal(facebook.platforms[SocialPlatform.FACEBOOK].status, ManualPublicationStatus.POSTED);
  assert.equal(facebook.platforms[SocialPlatform.INSTAGRAM].status, ManualPublicationStatus.NOT_POSTED);
  assert.equal(isManualPublicationComplete(facebook), false);

  const complete = markManualPublicationPosted({
    tracker: facebook,
    socialPackage: pkg,
    packageRevision: 'pkg-rev-1',
    platform: SocialPlatform.INSTAGRAM,
    postUrl: 'https://instagram.com/p/abc',
    actor,
    postedAt: t2,
  });
  assert.equal(isManualPublicationComplete(complete), true);
});

test('identical POSTED replay is idempotent but a different duplicate is rejected', () => {
  const pkg = makePackage();
  const initial = createManualPublicationTracker(pkg, 'pkg-rev-1', t0);
  const input = {
    tracker: initial,
    socialPackage: pkg,
    packageRevision: 'pkg-rev-1',
    platform: SocialPlatform.FACEBOOK,
    postUrl: 'https://facebook.com/orbi/posts/123',
    actor,
    postedAt: t1,
  } as const;
  const posted = markManualPublicationPosted(input);
  const replay = markManualPublicationPosted({ ...input, tracker: posted });
  assert.equal(replay, posted);

  assert.throws(
    () => markManualPublicationPosted({ ...input, tracker: posted, postUrl: 'https://facebook.com/orbi/posts/999' }),
    /MANUAL_PUBLICATION_DUPLICATE_POST_REQUIRES_EXPLICIT_REVIEW/,
  );
});

test('stale package revision blocks tracking', () => {
  const pkg = makePackage();
  const tracker = createManualPublicationTracker(pkg, 'pkg-rev-1', t0);
  assert.throws(
    () => markManualPublicationPosted({
      tracker,
      socialPackage: pkg,
      packageRevision: 'pkg-rev-2',
      platform: SocialPlatform.FACEBOOK,
      postUrl: 'https://facebook.com/orbi/posts/123',
      actor,
      postedAt: t1,
    }),
    /MANUAL_PUBLICATION_PACKAGE_REVISION_STALE/,
  );
});

test('FAILED can later become POSTED, while POSTED cannot be overwritten by FAILED', () => {
  const pkg = makePackage();
  const tracker = createManualPublicationTracker(pkg, 'pkg-rev-1', t0);
  const failed = markManualPublicationFailed({
    tracker,
    socialPackage: pkg,
    packageRevision: 'pkg-rev-1',
    platform: SocialPlatform.INSTAGRAM,
    actor,
    failureReason: 'Meta Business Suite no respondió',
    failedAt: t1,
  });
  assert.equal(failed.platforms[SocialPlatform.INSTAGRAM].status, ManualPublicationStatus.FAILED);

  const posted = markManualPublicationPosted({
    tracker: failed,
    socialPackage: pkg,
    packageRevision: 'pkg-rev-1',
    platform: SocialPlatform.INSTAGRAM,
    postUrl: 'https://instagram.com/p/abc',
    actor,
    postedAt: t2,
  });
  assert.equal(posted.platforms[SocialPlatform.INSTAGRAM].status, ManualPublicationStatus.POSTED);
  assert.equal(posted.platforms[SocialPlatform.INSTAGRAM].failureReason, null);

  assert.throws(
    () => markManualPublicationFailed({
      tracker: posted,
      socialPackage: pkg,
      packageRevision: 'pkg-rev-1',
      platform: SocialPlatform.INSTAGRAM,
      actor,
      failureReason: 'should not overwrite',
      failedAt: t2,
    }),
    /MANUAL_PUBLICATION_POSTED_STATE_IMMUTABLE/,
  );
});

test('tracker creation requires SocialPackage READY', () => {
  assert.throws(
    () => createManualPublicationTracker(makePackage({ status: SocialPackageStatus.DRAFT }), 'pkg-rev-1', t0),
    /MANUAL_PUBLICATION_TRACKER_REQUIRES_READY_PACKAGE/,
  );
});