import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  VerificationConfidence,
} from '../../domain/common/enums';
import type { CanonicalStory } from '../../domain/editorial/canonical-story';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
} from '../../domain/editorial/canonical-story';
import {
  CANONICAL_DEK_MAX_CODEPOINTS,
  CANONICAL_HEADLINE_MAX_CODEPOINTS,
  buildCanonicalStory,
  type CanonicalStoryBuilderInput,
} from '../../domain/editorial/canonical-story-builder';
import {
  EditorialDecision,
  evaluateCanonicalStory,
} from '../../domain/editorial/policy';

const baseInput = (): CanonicalStoryBuilderInput => ({
  id: 'story-1' as CanonicalStory['id'],
  organizationId: 'org-1' as CanonicalStory['organizationId'],
  eventId: 'event-1' as CanonicalStory['eventId'],
  verificationRecordId: 'verification-1' as CanonicalStory['verificationRecordId'],
  proposal: {
    headline: 'OpenAI announces a verified platform update',
    dek: 'ORBI explains what changed, why it matters and the practical implications.',
    slug: 'openai-verified-platform-update',
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [ContentCategory.TECH, ContentCategory.AI],
    tone: EditorialTone.EDUCATIONAL,
    format: ContentFormat.NEWS_POST,
    sections: [
      {
        key: 'SUMMARY',
        heading: 'Resumen',
        body: 'La actualización fue anunciada oficialmente.',
        claimKeys: ['claim-announcement'],
        sourceKeys: ['openai-official'],
      },
      {
        key: 'WHAT_HAPPENED',
        heading: 'Qué ocurrió',
        body: 'El proveedor publicó los cambios confirmados.',
        claimKeys: ['claim-announcement'],
        sourceKeys: ['openai-official'],
      },
      {
        key: 'WHY_IT_MATTERS',
        heading: 'Por qué importa',
        body: 'El cambio afecta el uso práctico de la plataforma.',
        claimKeys: ['claim-impact'],
        sourceKeys: ['openai-official', 'reuters'],
      },
      {
        key: 'PRACTICAL_IMPACT',
        heading: 'Impacto práctico',
        body: 'Los usuarios deben revisar el cambio antes de adoptarlo.',
        claimKeys: ['claim-impact'],
        sourceKeys: ['openai-official'],
      },
      {
        key: 'ORBI_LENS',
        heading: 'La mirada ORBI',
        body: 'ORBI prioriza entender la utilidad real antes del entusiasmo.',
        claimKeys: ['claim-impact'],
        sourceKeys: ['openai-official'],
      },
    ],
    sourceKeys: ['openai-official', 'reuters', 'openai-official'],
  },
  verifiedClaims: [
    { key: 'claim-announcement', statement: 'The company officially announced the update.' },
    { key: 'claim-impact', statement: 'The update changes practical platform behavior.' },
  ],
  verifiedSources: [
    {
      sourceKey: 'openai-official',
      label: 'OpenAI',
      url: 'https://example.com/openai',
      isPrimary: true,
    },
    {
      sourceKey: 'reuters',
      label: 'Reuters',
      url: 'https://example.com/reuters',
      isPrimary: false,
    },
  ],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 91,
  socialScore: 90,
  shortScore: 82,
  createdAt: '2026-08-26T06:20:00Z' as CanonicalStory['createdAt'],
});

test('builder creates a grounded DRAFT_READY canonical story', () => {
  const story = buildCanonicalStory(baseInput());
  assert.equal(story.status, CanonicalStoryStatus.DRAFT_READY);
  assert.equal(story.sections.some((section) => section.key === 'ORBI_LENS'), true);
  assert.deepEqual(story.sourceRefs.map((source) => source.label), ['OpenAI', 'Reuters']);
  assert.deepEqual(story.secondaryCategories, [ContentCategory.TECH, ContentCategory.AI]);
  assert.equal(evaluateCanonicalStory(story).decision, EditorialDecision.ALLOW);
});

test('builder rejects a missing ORBI lens section', () => {
  const input = baseInput();
  assert.throws(
    () =>
      buildCanonicalStory({
        ...input,
        proposal: {
          ...input.proposal,
          sections: input.proposal.sections.filter((section) => section.key !== 'ORBI_LENS'),
        },
      }),
    /ORBI_LENS is required/,
  );
});

test('builder rejects a section that declares an unverified claim', () => {
  const input = baseInput();
  const sections = input.proposal.sections.map((section) =>
    section.key === 'SUMMARY' ? { ...section, claimKeys: ['invented-claim'] } : section,
  );
  assert.throws(
    () => buildCanonicalStory({ ...input, proposal: { ...input.proposal, sections } }),
    /unverified claim invented-claim/,
  );
});

test('builder rejects a section that declares an unverified source', () => {
  const input = baseInput();
  const sections = input.proposal.sections.map((section) =>
    section.key === 'SUMMARY' ? { ...section, sourceKeys: ['unknown-source'] } : section,
  );
  assert.throws(
    () => buildCanonicalStory({ ...input, proposal: { ...input.proposal, sections } }),
    /unverified source unknown-source/,
  );
});

test('builder requires at least one verified primary source', () => {
  const input = baseInput();
  assert.throws(
    () =>
      buildCanonicalStory({
        ...input,
        verifiedSources: input.verifiedSources.map((source) => ({ ...source, isPrimary: false })),
      }),
    /requires at least one verified primary source/,
  );
});

test('headline and dek limits are measured by code points', () => {
  const input = baseInput();
  assert.doesNotThrow(() =>
    buildCanonicalStory({
      ...input,
      proposal: {
        ...input.proposal,
        headline: '😀'.repeat(CANONICAL_HEADLINE_MAX_CODEPOINTS),
        dek: 'á'.repeat(CANONICAL_DEK_MAX_CODEPOINTS),
      },
    }),
  );

  assert.throws(
    () =>
      buildCanonicalStory({
        ...input,
        proposal: {
          ...input.proposal,
          headline: '😀'.repeat(CANONICAL_HEADLINE_MAX_CODEPOINTS + 1),
        },
      }),
    /must not exceed 120 code points/,
  );
});

test('builder rejects unsafe canonical slugs', () => {
  const input = baseInput();
  assert.throws(
    () => buildCanonicalStory({ ...input, proposal: { ...input.proposal, slug: 'OpenAI Update!' } }),
    /lowercase kebab-case/,
  );
});

test('builder rejects sections without declared grounded claims or verified sources', () => {
  const input = baseInput();
  const noClaims = input.proposal.sections.map((section) =>
    section.key === 'SUMMARY' ? { ...section, claimKeys: [] } : section,
  );
  assert.throws(
    () => buildCanonicalStory({ ...input, proposal: { ...input.proposal, sections: noClaims } }),
    /must declare at least one grounded claim/,
  );

  const noSources = input.proposal.sections.map((section) =>
    section.key === 'SUMMARY' ? { ...section, sourceKeys: [] } : section,
  );
  assert.throws(
    () => buildCanonicalStory({ ...input, proposal: { ...input.proposal, sections: noSources } }),
    /must declare at least one verified source/,
  );
});
