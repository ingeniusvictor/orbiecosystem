import { GoogleGenAI } from '@google/genai';
import {
  ContentCategory,
  RiskLevel,
  RiskReason,
} from '../../domain/common/enums';
import { ContentFormat, EditorialTone } from '../../domain/editorial/canonical-story';
import { EventType } from '../../domain/events/event';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import type {
  GroundedResearchAssessment,
  GroundedResearchClient,
} from './grounded-research-client';

export interface GeminiGroundedResearchEnvironment {
  readonly GEMINI_API_KEY?: string;
  readonly ORBI_NEWS_GEMINI_MODEL?: string;
}

const required = (label: string, value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label}_REQUIRED`);
  return normalized;
};

const parseAssessment = (text: string | undefined): GroundedResearchAssessment => {
  if (!text?.trim()) throw new Error('GEMINI_GROUNDED_RESEARCH_EMPTY_RESPONSE');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('GEMINI_GROUNDED_RESEARCH_INVALID_JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GEMINI_GROUNDED_RESEARCH_INVALID_PAYLOAD');
  }
  return parsed as GroundedResearchAssessment;
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    sensitivity: { type: 'string', enum: Object.values(ClaimSensitivity) },
    riskLevel: { type: 'string', enum: Object.values(RiskLevel) },
    riskReasons: { type: 'array', items: { type: 'string', enum: Object.values(RiskReason) } },
    riskNotes: { type: 'array', items: { type: 'string' } },
    verificationConfidenceScore: { type: 'number', minimum: 0, maximum: 100 },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          statement: { type: 'string' },
          confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
          evidenceUrls: { type: 'array', items: { type: 'string' } },
        },
        required: ['key', 'statement', 'confidenceScore', 'evidenceUrls'],
      },
    },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          stance: { type: 'string', enum: ['SUPPORTING', 'CONTRADICTING', 'NEUTRAL'] },
          claimSummary: { type: 'string' },
          publishedAt: { type: ['string', 'null'] },
        },
        required: ['url', 'stance', 'claimSummary', 'publishedAt'],
      },
    },
    contradictionSearchCompleted: { type: 'boolean' },
    event: {
      type: 'object',
      properties: {
        eventType: { type: 'string', enum: Object.values(EventType) },
        primaryEntity: { type: 'string' },
        subject: { type: ['string', 'null'] },
        canonicalSummary: { type: 'string' },
        confirmedEventDate: { type: ['string', 'null'] },
      },
      required: ['eventType', 'primaryEntity', 'subject', 'canonicalSummary', 'confirmedEventDate'],
    },
    scoreDimensions: {
      type: 'object',
      properties: {
        strategicRelevance: { type: 'number', minimum: 0, maximum: 100 },
        audienceInterest: { type: 'number', minimum: 0, maximum: 100 },
        practicalValue: { type: 'number', minimum: 0, maximum: 100 },
        novelty: { type: 'number', minimum: 0, maximum: 100 },
        timeliness: { type: 'number', minimum: 0, maximum: 100 },
        evidenceStrength: { type: 'number', minimum: 0, maximum: 100 },
      },
      required: ['strategicRelevance', 'audienceInterest', 'practicalValue', 'novelty', 'timeliness', 'evidenceStrength'],
    },
    proposal: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        dek: { type: 'string' },
        slug: { type: 'string' },
        primaryCategory: { type: 'string', enum: Object.values(ContentCategory) },
        secondaryCategories: { type: 'array', items: { type: 'string', enum: Object.values(ContentCategory) } },
        tone: { type: 'string', enum: Object.values(EditorialTone) },
        format: { type: 'string', enum: Object.values(ContentFormat) },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', enum: ['SUMMARY', 'WHAT_HAPPENED', 'WHY_IT_MATTERS', 'PRACTICAL_IMPACT', 'ORBI_LENS', 'FUTURE_OUTLOOK'] },
              heading: { type: 'string' },
              body: { type: 'string' },
              claimKeys: { type: 'array', items: { type: 'string' } },
              sourceKeys: { type: 'array', items: { type: 'string' } },
            },
            required: ['key', 'heading', 'body', 'claimKeys', 'sourceKeys'],
          },
        },
        sourceKeys: { type: 'array', items: { type: 'string' } },
      },
      required: ['headline', 'dek', 'slug', 'primaryCategory', 'secondaryCategories', 'tone', 'format', 'sections', 'sourceKeys'],
    },
    groundingValid: { type: 'boolean' },
    groundingReasons: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'sensitivity', 'riskLevel', 'riskReasons', 'riskNotes', 'verificationConfidenceScore',
    'claims', 'evidence', 'contradictionSearchCompleted', 'event', 'scoreDimensions',
    'proposal', 'groundingValid', 'groundingReasons',
  ],
} as const;

/**
 * Gemini is a research/synthesis provider only. Google Search grounding gives it
 * live web context, but the downstream LiveResearchProvider independently
 * validates every evidence URL against the ORBI Source Registry.
 */
export const createGeminiGroundedResearchClient = (
  environment: GeminiGroundedResearchEnvironment,
): GroundedResearchClient => {
  const apiKey = required('GEMINI_API_KEY', environment.GEMINI_API_KEY);
  const model = environment.ORBI_NEWS_GEMINI_MODEL?.trim() || 'gemini-3.7-flash';
  const ai = new GoogleGenAI({ apiKey });

  return {
    async research({ candidate, primaryArticle, allowedSources }) {
      const allowed = allowedSources
        .map((source) => `${source.name} | ${source.domain} | ${source.sourceType} | ${source.credibilityBand} | primaryPreferred=${source.isPrimaryPreferred}`)
        .join('\n');
      const primaryText = primaryArticle.text.slice(0, 14_000);
      const prompt = [
        'You are the ORBI News research engine. Research the candidate using Google Search.',
        'Treat the model as non-authoritative. Never invent a source URL, claim, date, quotation, metric, partnership, customer, result or event.',
        'Use evidence only from the allowed source domains listed below. If corroboration is insufficient, return low confidence/groundingValid=false rather than filling gaps.',
        'Search for: the primary/official source when available, independent corroboration, and material contradictions.',
        'Write the editorial proposal in original Spanish. Do not copy source wording.',
        'Every section must reference claimKeys and sourceKeys that exist in the returned claims/evidence. sourceKeys MUST equal source domains from allowed sources.',
        'For evidence.url return the exact HTTPS page URL supporting or contradicting the claim.',
        '',
        `Candidate title: ${candidate.title}`,
        `Candidate URL: ${candidate.url}`,
        `Candidate source: ${candidate.sourceName ?? 'unknown'}`,
        `Candidate publishedAt: ${candidate.publishedAt ?? 'unknown'}`,
        '',
        `Fetched primary article title: ${primaryArticle.title ?? 'unknown'}`,
        `Fetched primary article description: ${primaryArticle.description ?? 'unknown'}`,
        `Fetched primary article text:\n${primaryText}`,
        '',
        `Allowed ORBI sources:\n${allowed}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA as never,
          temperature: 0.1,
        },
      });

      return parseAssessment(response.text);
    },
  };
};
