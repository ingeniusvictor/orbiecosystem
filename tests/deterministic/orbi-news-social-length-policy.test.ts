import test from 'node:test';
import assert from 'node:assert/strict';

import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId, SocialPackageId } from '../../domain/common/types';
import {
  SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialCopyLengthBand,
  SocialPackageStatus,
  assessSocialCopyLength,
  classifySocialCopyLength,
  countSocialCopyCharacters,
  evaluateSocialPackageLengthConsistency,
  type SocialPackage,
} from '../../domain/editorial';
import { validateSocialPackage } from '../../domain/editorial/policy';

const timestamp = '2026-08-26T19:30:00.000Z' as IsoUtcDateTime;

const packageWithCopy = (
  copy: string,
  overrides: Partial<SocialPackage> = {},
): SocialPackage => ({
  id: 'social-length-1' as SocialPackageId,
  organizationId: 'orbi-ecosystem' as OrganizationId,
  canonicalStoryId: 'story-1' as CanonicalStoryId,
  status: SocialPackageStatus.DRAFT,
  targetPlatforms: [...SOCIAL_PACKAGE_V1_PLATFORMS],
  socialHeadline: 'ORBI News',
  sections: SOCIAL_PACKAGE_REQUIRED_SECTIONS.map((section) => ({ section, text: section })),
  copy,
  hashtags: ['#ORBINews'],
  characterCount: countSocialCopyCharacters(copy),
  imageAspectRatio: '16:9',
  imageAssetId: null,
  webArticleUrl: 'https://orbi.example/news/story-1',
  provenance: {
    canonicalStoryId: 'story-1' as CanonicalStoryId,
    canonicalStoryRevision: 'story-rev-1',
    webArticleUrl: 'https://orbi.example/news/story-1',
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});

test('social length classifier uses deterministic ORBI boundaries', () => {
  const cases: ReadonlyArray<readonly [number, SocialCopyLengthBand]> = [
    [1499, SocialCopyLengthBand.BELOW_TARGET],
    [1500, SocialCopyLengthBand.TARGET],
    [1900, SocialCopyLengthBand.TARGET],
    [1901, SocialCopyLengthBand.WARNING],
    [2100, SocialCopyLengthBand.WARNING],
    [2101, SocialCopyLengthBand.HIGH],
    [2200, SocialCopyLengthBand.HIGH],
    [2201, SocialCopyLengthBand.BLOCKED],
  ];

  for (const [count, expected] of cases) {
    assert.equal(classifySocialCopyLength(count), expected, `count ${count}`);
  }
});

test('character counter counts Unicode code points rather than UTF-16 code units', () => {
  assert.equal('😀'.length, 2);
  assert.equal(countSocialCopyCharacters('😀'), 1);
  assert.equal(countSocialCopyCharacters('A😀B'), 3);
});

test('invalid numeric character counts fail closed', () => {
  assert.throws(() => classifySocialCopyLength(-1), /SOCIAL_COPY_CHARACTER_COUNT_INVALID/);
  assert.throws(() => classifySocialCopyLength(1.5), /SOCIAL_COPY_CHARACTER_COUNT_INVALID/);
  assert.throws(() => classifySocialCopyLength(Number.NaN), /SOCIAL_COPY_CHARACTER_COUNT_INVALID/);
});

test('assessment reports deterministic readiness reasons', () => {
  assert.deepEqual(assessSocialCopyLength('x'.repeat(1500)), {
    characterCount: 1500,
    band: SocialCopyLengthBand.TARGET,
    withinHardLimit: true,
    readyEligible: true,
    reasons: [],
  });
  assert.deepEqual(assessSocialCopyLength('x'.repeat(2201)), {
    characterCount: 2201,
    band: SocialCopyLengthBand.BLOCKED,
    withinHardLimit: false,
    readyEligible: false,
    reasons: ['SOCIAL_COPY_HARD_LIMIT_EXCEEDED'],
  });
});

test('stored character count is never treated as authority', () => {
  const value = packageWithCopy('A😀B', { characterCount: 999 });
  const assessment = evaluateSocialPackageLengthConsistency(value);
  assert.equal(assessment.characterCount, 3);
  assert.equal(assessment.storedCountMatches, false);
  assert.ok(validateSocialPackage(value).includes('Stored character count does not match copy length.'));
});

test('READY package above 2200 characters is deterministically incompatible', () => {
  const copy = 'x'.repeat(2201);
  const value = packageWithCopy(copy, {
    status: SocialPackageStatus.READY,
    characterCount: 1,
  });
  const assessment = evaluateSocialPackageLengthConsistency(value);
  assert.equal(assessment.band, SocialCopyLengthBand.BLOCKED);
  assert.equal(assessment.statusCompatible, false);
  const errors = validateSocialPackage(value);
  assert.ok(errors.includes('Social copy exceeds the 2200 character hard limit.'));
  assert.ok(errors.includes('Social package cannot be READY when copy exceeds the 2200 character hard limit.'));
});

test('DRAFT package above 2200 is still invalid content even before readiness', () => {
  const value = packageWithCopy('x'.repeat(2201));
  const assessment = evaluateSocialPackageLengthConsistency(value);
  assert.equal(assessment.statusCompatible, true);
  assert.equal(assessment.readyEligible, false);
  assert.ok(validateSocialPackage(value).includes('Social copy exceeds the 2200 character hard limit.'));
});
