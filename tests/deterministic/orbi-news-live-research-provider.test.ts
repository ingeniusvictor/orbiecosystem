import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  SourceCredibilityBand,
  SourceType,
  VerificationStatus,
} from '../../domain/common/enums';
import { EventType } from '../../domain/events/event';
import { NewsOrigin } from '../../domain/news/news-item';
import { SourceRegistryStatus, type SourceRegistryEntry } from '../../domain/discovery/source-registry';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import { ContentFormat, EditorialTone } from '../../domain/editorial/canonical-story';
import { createLiveResearchProvider } from '../../server/news/live-research-provider';

const now = '2026-08-27T16:30:00.000Z' as never;
const org = 'orbi' as never;

const official: SourceRegistryEntry = {
  id: 'source-official' as never,
  organizationId: org,
  name: 'Vendor Official',
  domain: 'vendor.example',
  homepageUrl: 'https://vendor.example',
  feedUrl: 'https://vendor.example/rss',
  sourceType: SourceType.OFFICIAL,
  credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
  allowedOrigins: [NewsOrigin.RSS],
  categories: [ContentCategory.AI],
  status: SourceRegistryStatus.ACTIVE,
  isPrimaryPreferred: true,
  notes: null,
  createdAt: now,
  updatedAt: now,
};
const media: SourceRegistryEntry = {
  ...official,
  id: 'source-media' as never,
  name: 'Independent Media',
  domain: 'media.example',
  homepageUrl: 'https://media.example',
  feedUrl: 'https://media.example/rss',
  sourceType: SourceType.PRIMARY_MEDIA,
  credibilityBand: SourceCredibilityBand.HIGH,
  isPrimaryPreferred: false,
};

const entries = [official, media];
const registry = {
  async findById(id: never) { return entries.find((entry) => entry.id === id) ?? null; },
  async findByDomain(domain: string) { return entries.find((entry) => entry.domain === domain) ?? null; },
  async listActive() { return entries; },
};

const candidate = {
  id: 'candidate-1',
  organizationId: org,
  title: 'Vendor launches a new AI model',
  url: 'https://vendor.example/news/model',
  sourceName: 'Vendor Official',
  publishedAt: now,
  discoveredAt: now,
};

const proposal = {
  headline: 'Vendor presenta un nuevo modelo de IA',
  dek: 'El anuncio fue confirmado por la empresa y corroborado por una fuente independiente.',
  slug: 'vendor-presenta-nuevo-modelo-ia',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: ['SUMMARY', 'WHAT_HAPPENED', 'WHY_IT_MATTERS', 'PRACTICAL_IMPACT', 'ORBI_LENS'].map((key) => ({
    key: key as 'SUMMARY',
    heading: key,
    body: 'Contenido original basado únicamente en los hechos verificados.',
    claimKeys: ['claim-1'],
    sourceKeys: ['vendor.example', 'media.example'],
  })),
  sourceKeys: ['vendor.example', 'media.example'],
};

test('provider maps only registered evidence into verification records', async () => {
  const provider = createLiveResearchProvider({
    articleFetcher: {
      async fetchArticle(url) { return { url, title: candidate.title, description: null, text: 'x'.repeat(200) }; },
    },
    groundedClient: {
      async research() {
        return {
          sensitivity: ClaimSensitivity.STANDARD,
          riskLevel: RiskLevel.LOW,
          riskReasons: [],
          riskNotes: [],
          verificationConfidenceScore: 95,
          claims: [{
            key: 'claim-1',
            statement: 'Vendor launched a new AI model.',
            confidenceScore: 95,
            evidenceUrls: [
              'https://vendor.example/news/model',
              'https://media.example/story/model',
              'https://untrusted.example/copied-story',
            ],
          }],
          evidence: [
            { url: 'https://vendor.example/news/model', stance: 'SUPPORTING', claimSummary: 'Official launch announcement', publishedAt: now },
            { url: 'https://media.example/story/model', stance: 'SUPPORTING', claimSummary: 'Independent corroboration', publishedAt: now },
            { url: 'https://untrusted.example/copied-story', stance: 'SUPPORTING', claimSummary: 'Unregistered source', publishedAt: now },
          ],
          contradictionSearchCompleted: true,
          event: {
            eventType: EventType.MODEL_RELEASE,
            primaryEntity: 'Vendor',
            subject: 'New AI model',
            canonicalSummary: 'Vendor released a new AI model.',
            confirmedEventDate: now,
          },
          scoreDimensions: {
            strategicRelevance: 90,
            audienceInterest: 90,
            practicalValue: 85,
            novelty: 90,
            timeliness: 95,
            evidenceStrength: 95,
          },
          proposal,
          groundingValid: true,
          groundingReasons: [],
        };
      },
    },
    sourceRegistry: registry,
    clock: () => now,
  });

  const bundle = await provider.research(candidate);
  assert.equal(bundle.verificationRecord.status, VerificationStatus.VERIFIED);
  assert.equal(bundle.verificationRecord.evidence.length, 2);
  assert.equal(bundle.verificationRecord.primarySourceId, official.id);
  assert.deepEqual(bundle.verifiedSources.map((source) => source.sourceKey), ['vendor.example', 'media.example']);
  assert.equal(bundle.grounding.valid, true);
});

test('authoritative contradiction becomes a disputed verification record', async () => {
  const provider = createLiveResearchProvider({
    articleFetcher: { async fetchArticle(url) { return { url, title: candidate.title, description: null, text: 'x'.repeat(200) }; } },
    groundedClient: {
      async research() {
        return {
          sensitivity: ClaimSensitivity.STANDARD,
          riskLevel: RiskLevel.MEDIUM,
          riskReasons: [],
          riskNotes: [],
          verificationConfidenceScore: 90,
          claims: [{ key: 'claim-1', statement: 'Claim', confidenceScore: 90, evidenceUrls: ['https://vendor.example/denial'] }],
          evidence: [{ url: 'https://vendor.example/denial', stance: 'CONTRADICTING', claimSummary: 'Official contradiction', publishedAt: now }],
          contradictionSearchCompleted: true,
          event: { eventType: EventType.MODEL_RELEASE, primaryEntity: 'Vendor', subject: null, canonicalSummary: 'Conflicting reports.', confirmedEventDate: now },
          scoreDimensions: { strategicRelevance: 80, audienceInterest: 80, practicalValue: 80, novelty: 80, timeliness: 80, evidenceStrength: 60 },
          proposal,
          groundingValid: false,
          groundingReasons: ['CONTRADICTION'],
        };
      },
    },
    sourceRegistry: registry,
    clock: () => now,
  });

  const bundle = await provider.research(candidate);
  assert.equal(bundle.verificationRecord.status, VerificationStatus.CONTRADICTED);
  assert.equal(bundle.hasEventContradiction, true);
});
