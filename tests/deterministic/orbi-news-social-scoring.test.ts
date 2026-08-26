import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SOCIAL_SCORE_CANDIDATE_THRESHOLD,
  SOCIAL_SCORE_PRIORITY_THRESHOLD,
  SOCIAL_SCORE_WEIGHTS,
  SocialScoreBand,
  calculateSocialScore,
  isSocialDistributionCandidate,
  isSocialPriorityCandidate,
  socialBandFromScore,
} from '../../domain/editorial/social-scoring';

const dimensions = (value: number) => ({
  audienceInterest: value,
  visualPotential: value,
  conversationPotential: value,
  practicalValue: value,
  novelty: value,
  brandFit: value,
});

test('social score weights sum to exactly 1', () => {
  const totalWeight = Object.values(SOCIAL_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0);
  assert.equal(totalWeight, 1);
});

test('social score uses the six canonical V1 dimensions', () => {
  assert.deepEqual(Object.keys(SOCIAL_SCORE_WEIGHTS), [
    'audienceInterest',
    'visualPotential',
    'conversationPotential',
    'practicalValue',
    'novelty',
    'brandFit',
  ]);
});

test('social score bands preserve candidate and priority thresholds', () => {
  assert.equal(SOCIAL_SCORE_CANDIDATE_THRESHOLD, 80);
  assert.equal(SOCIAL_SCORE_PRIORITY_THRESHOLD, 90);
  assert.equal(socialBandFromScore(0), SocialScoreBand.REJECT);
  assert.equal(socialBandFromScore(59), SocialScoreBand.REJECT);
  assert.equal(socialBandFromScore(60), SocialScoreBand.HOLD);
  assert.equal(socialBandFromScore(79), SocialScoreBand.HOLD);
  assert.equal(socialBandFromScore(80), SocialScoreBand.CANDIDATE);
  assert.equal(socialBandFromScore(89), SocialScoreBand.CANDIDATE);
  assert.equal(socialBandFromScore(90), SocialScoreBand.PRIORITY);
  assert.equal(socialBandFromScore(100), SocialScoreBand.PRIORITY);
});

test('equal dimensions preserve their value after weighted calculation', () => {
  const score = calculateSocialScore(dimensions(84));
  assert.equal(score.total, 84);
  assert.equal(score.band, SocialScoreBand.CANDIDATE);
});

test('weighted social score is deterministic', () => {
  const score = calculateSocialScore({
    audienceInterest: 100,
    visualPotential: 80,
    conversationPotential: 60,
    practicalValue: 90,
    novelty: 70,
    brandFit: 100,
  });
  assert.equal(score.total, 86);
  assert.equal(score.band, SocialScoreBand.CANDIDATE);
});

test('candidate helpers reflect independent social thresholds', () => {
  assert.equal(isSocialDistributionCandidate(79), false);
  assert.equal(isSocialDistributionCandidate(80), true);
  assert.equal(isSocialDistributionCandidate(90), true);
  assert.equal(isSocialPriorityCandidate(89), false);
  assert.equal(isSocialPriorityCandidate(90), true);
});

test('invalid dimensions and totals fail closed', () => {
  assert.throws(() => calculateSocialScore({ ...dimensions(80), novelty: -1 }), RangeError);
  assert.throws(() => calculateSocialScore({ ...dimensions(80), brandFit: 101 }), RangeError);
  assert.throws(() => calculateSocialScore({ ...dimensions(80), audienceInterest: Number.NaN }), RangeError);
  assert.throws(() => socialBandFromScore(-1), RangeError);
  assert.throws(() => socialBandFromScore(101), RangeError);
});
