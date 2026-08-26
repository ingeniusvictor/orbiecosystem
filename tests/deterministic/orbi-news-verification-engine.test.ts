import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  VerificationConfidence,
  VerificationStatus,
} from '../../domain/common/enums';
import {
  VerificationEngine,
  calculateClaimConfidenceScore,
  resolveVerificationStatus,
} from '../../domain/verification/engine';

const now = '2026-08-26T05:00:00.000Z' as never;
const organizationId = 'org-1' as never;
const newsItemId = 'news-1' as never;
const sourceId = 'source-original' as never;
const primarySourceId = 'source-primary' as never;
const corroboratingSourceId = 'source-corroborating' as never;
const contradictingSourceId = 'source-contradicting' as never;

const subject = {
  organizationId,
  newsItemId,
  title: 'Company launches new AI model',
  canonicalUrl: 'https://news.example.com/story',
  sourceId,
  publishedAt: now,
};

const clock = { now: () => now };
const idFactory = { nextVerificationRecordId: () => 'verification-1' as never };

test('claim confidence reflects source credibility', () => {
  const high = calculateClaimConfidenceScore([
    {
      sourceId: primarySourceId,
      newsItemId,
      role: SourceRole.PRIMARY,
      stance: 'SUPPORTING',
      credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
      claimSummary: 'Official confirmation',
      sourceUrl: 'https://company.example.com/press',
      publishedAt: now,
      retrievedAt: now,
    },
  ], []);

  assert.equal(high, 100);
});

test('verification engine verifies a claim supported by authoritative primary evidence', async () => {
  const engine = new VerificationEngine(
    {
      id: 'research',
      research: async () => [{
        sourceId: primarySourceId,
        sourceUrl: 'https://company.example.com/press',
        role: SourceRole.PRIMARY,
        credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
        stance: 'SUPPORTING',
        claimSummary: 'Company confirms launch.',
        publishedAt: now,
      }],
    },
    {
      id: 'claims',
      proposeClaims: async () => [{
        claimId: 'claim-1',
        statement: 'The company launched a new AI model.',
        supportingSourceIds: [primarySourceId],
        contradictingSourceIds: [],
      }],
    },
    idFactory,
    clock,
  );

  const record = await engine.verify(subject);

  assert.equal(record.status, VerificationStatus.VERIFIED);
  assert.equal(record.confidence, VerificationConfidence.VERY_HIGH);
  assert.equal(record.primarySourceId, primarySourceId);
  assert.equal(record.risk.level, RiskLevel.LOW);
});

test('authoritative contradiction produces contradicted status and high risk', async () => {
  const engine = new VerificationEngine(
    {
      id: 'research',
      research: async () => [
        {
          sourceId: corroboratingSourceId,
          sourceUrl: 'https://media.example.com/story',
          role: SourceRole.CORROBORATING,
          credibilityBand: SourceCredibilityBand.HIGH,
          stance: 'SUPPORTING',
          claimSummary: 'Media reports the launch.',
          publishedAt: now,
        },
        {
          sourceId: contradictingSourceId,
          sourceUrl: 'https://company.example.com/denial',
          role: SourceRole.CONTRADICTING,
          credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
          stance: 'CONTRADICTING',
          claimSummary: 'Company denies the launch.',
          publishedAt: now,
        },
      ],
    },
    {
      id: 'claims',
      proposeClaims: async () => [{
        claimId: 'claim-1',
        statement: 'The company launched a new AI model.',
        supportingSourceIds: [corroboratingSourceId],
        contradictingSourceIds: [contradictingSourceId],
      }],
    },
    idFactory,
    clock,
  );

  const record = await engine.verify(subject);

  assert.equal(record.status, VerificationStatus.CONTRADICTED);
  assert.equal(record.risk.level, RiskLevel.HIGH);
  assert.equal(record.claims[0]?.status, VerificationStatus.CONTRADICTED);
});

test('no claims produces unverified record', async () => {
  const engine = new VerificationEngine(
    { id: 'research', research: async () => [] },
    { id: 'claims', proposeClaims: async () => [] },
    idFactory,
    clock,
  );

  const record = await engine.verify(subject);
  assert.equal(record.status, VerificationStatus.UNVERIFIED);
  assert.equal(record.confidenceScore, 0);
  assert.equal(record.risk.level, RiskLevel.MEDIUM);
});

test('global verification status cannot be verified if one claim is contradicted', () => {
  const status = resolveVerificationStatus([
    {
      claimId: 'verified',
      statement: 'A',
      status: VerificationStatus.VERIFIED,
      confidenceScore: 90,
      confidence: VerificationConfidence.VERY_HIGH,
      supportingEvidence: [],
      contradictingEvidence: [],
    },
    {
      claimId: 'contradicted',
      statement: 'B',
      status: VerificationStatus.CONTRADICTED,
      confidenceScore: 20,
      confidence: VerificationConfidence.VERY_LOW,
      supportingEvidence: [],
      contradictingEvidence: [],
    },
  ]);

  assert.equal(status, VerificationStatus.CONTRADICTED);
});
