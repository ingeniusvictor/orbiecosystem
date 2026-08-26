import test from 'node:test';
import assert from 'node:assert/strict';

import { RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import {
  OrbiEditorialBand,
  calculateOrbiEditorialScore,
  editorialBandFromScore,
  evaluateBreakingEligibility,
} from '../../domain/editorial';

test('editorial score uses deterministic weighted dimensions', () => {
  const result = calculateOrbiEditorialScore({
    strategicRelevance: 100,
    audienceInterest: 80,
    practicalValue: 90,
    novelty: 70,
    timeliness: 100,
    evidenceStrength: 90,
  });

  assert.equal(result.total, 89);
  assert.equal(result.band, OrbiEditorialBand.PRIORITY);
});

test('editorial band boundaries are exact', () => {
  assert.equal(editorialBandFromScore(54), OrbiEditorialBand.REJECT);
  assert.equal(editorialBandFromScore(55), OrbiEditorialBand.HOLD);
  assert.equal(editorialBandFromScore(74), OrbiEditorialBand.HOLD);
  assert.equal(editorialBandFromScore(75), OrbiEditorialBand.PUBLISH);
  assert.equal(editorialBandFromScore(84), OrbiEditorialBand.PUBLISH);
  assert.equal(editorialBandFromScore(85), OrbiEditorialBand.PRIORITY);
  assert.equal(editorialBandFromScore(92), OrbiEditorialBand.PRIORITY);
  assert.equal(editorialBandFromScore(93), OrbiEditorialBand.BREAKING_CANDIDATE);
});

test('invalid dimension values are rejected', () => {
  assert.throws(() => calculateOrbiEditorialScore({
    strategicRelevance: 101,
    audienceInterest: 80,
    practicalValue: 90,
    novelty: 70,
    timeliness: 100,
    evidenceStrength: 90,
  }));
});

test('breaking candidate is eligible only when all safety and quality conditions pass', () => {
  const result = evaluateBreakingEligibility({
    orbiScore: 95,
    socialScore: 92,
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: false,
  });

  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test('high ORBI score cannot override insufficient verification', () => {
  const result = evaluateBreakingEligibility({
    orbiScore: 100,
    socialScore: 100,
    verificationConfidence: VerificationConfidence.HIGH,
    riskLevel: RiskLevel.LOW,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: false,
  });

  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('VERY_HIGH_VERIFICATION_REQUIRED'));
});

test('high ORBI score cannot override elevated risk', () => {
  const result = evaluateBreakingEligibility({
    orbiScore: 100,
    socialScore: 100,
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.HIGH,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: false,
  });

  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('LOW_RISK_REQUIRED'));
});

test('breaking eligibility requires social score 90 or higher', () => {
  const result = evaluateBreakingEligibility({
    orbiScore: 95,
    socialScore: 89,
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: false,
  });

  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('SOCIAL_SCORE_BELOW_BREAKING_THRESHOLD'));
});

test('unresolved or contradicted events cannot be breaking', () => {
  const unresolved = evaluateBreakingEligibility({
    orbiScore: 99,
    socialScore: 99,
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    verificationAllowed: true,
    eventResolved: false,
    hasContradiction: false,
  });
  const contradicted = evaluateBreakingEligibility({
    orbiScore: 99,
    socialScore: 99,
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: true,
  });

  assert.equal(unresolved.eligible, false);
  assert.ok(unresolved.reasons.includes('EVENT_NOT_RESOLVED'));
  assert.equal(contradicted.eligible, false);
  assert.ok(contradicted.reasons.includes('EVENT_CONTRADICTION_PRESENT'));
});

test('editorial score is relevance authority, not verification authority', () => {
  const result = calculateOrbiEditorialScore({
    strategicRelevance: 100,
    audienceInterest: 100,
    practicalValue: 100,
    novelty: 100,
    timeliness: 100,
    evidenceStrength: 100,
  });

  assert.equal(result.total, 100);
  assert.equal(result.band, OrbiEditorialBand.BREAKING_CANDIDATE);
  assert.equal('verificationStatus' in result, false);
  assert.equal('publicationDecision' in result, false);
});
