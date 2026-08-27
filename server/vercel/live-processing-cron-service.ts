import type { IsoUtcDateTime } from '../../domain/common/types';
import { assessOperationalAuthority, OperationalAction, OperationalDecision } from '../../domain/operations/operational-authority';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createConfiguredFirestoreClient, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import { createInMemorySourceRegistry, parseEnvironmentSourceRegistry } from '../discovery/environment-source-registry';
import { ControlledActivationProfile, assessControlledActivationProfile } from '../operations/controlled-activation-profile';
import type { ControlledActivationEnvironment } from '../operations/controlled-activation-preflight';
import { resolveProductionOperationalAuthoritySnapshot } from '../operations/production-authority-config';
import { resolveProductionRuntimeConfiguration } from '../operations/production-runtime-config';
import { createLiveArticleFetcher, type LiveArticleFetcher } from '../news/live-article-fetcher';
import { createGeminiGroundedResearchClient, type GeminiGroundedResearchEnvironment } from '../news/gemini-grounded-research-client';
import type { GroundedResearchClient } from '../news/grounded-research-client';
import { createLiveResearchProvider } from '../news/live-research-provider';
import { createLiveNewsProcessingPipeline, LiveProcessingOutcome } from '../news/live-processing-pipeline';
import { createFirestoreLiveProcessingStore } from '../news/firestore-live-processing-store';
import { createFirestoreLiveEditorialSink } from '../news/firestore-live-editorial-sink';
import { createFirestorePublicNewsStore } from '../news/firestore-public-news-store';
import { publishStoryAutonomouslyIfEligible } from '../news/autonomous-web-publication-orchestrator';
import type { VercelCronEnvironment } from './cron-auth';
import { resolveVercelCronSecret } from './cron-auth';

export interface VercelLiveProcessingEnvironment
  extends ControlledActivationEnvironment, VercelCronEnvironment, GeminiGroundedResearchEnvironment {
  readonly ORBI_NEWS_LIVE_PROCESSING_LIMIT?: string;
}

const parseLimit = (raw: string | undefined): number => {
  if (!raw?.trim()) return 3;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 10) throw new RangeError('ORBI_NEWS_LIVE_PROCESSING_LIMIT_INVALID');
  return value;
};

const parseProfile = (environment: VercelLiveProcessingEnvironment): ControlledActivationProfile => {
  const profileRaw = environment.ORBI_NEWS_ACTIVATION_PROFILE?.trim() || ControlledActivationProfile.DISABLED;
  if (!Object.values(ControlledActivationProfile).includes(profileRaw as ControlledActivationProfile)) {
    throw new RangeError('ORBI_NEWS_ACTIVATION_PROFILE_INVALID');
  }
  return profileRaw as ControlledActivationProfile;
};

export const runVercelLiveProcessingPreflight = (environment: VercelLiveProcessingEnvironment) => {
  const runtime = resolveProductionRuntimeConfiguration(environment);
  const profile = parseProfile(environment);
  const activation = assessControlledActivationProfile({ profile, runtime, authorityEnvironment: environment });
  const reasons = [...activation.reasons];
  const sources = parseEnvironmentSourceRegistry(environment);

  if (
    profile !== ControlledActivationProfile.EDITORIAL_ASSISTED &&
    profile !== ControlledActivationProfile.WEB_AUTONOMOUS
  ) reasons.push('VERCEL_LIVE_PROCESSING_PROFILE_NOT_ALLOWED');
  try { resolveVercelCronSecret(environment); } catch { reasons.push('VERCEL_LIVE_PROCESSING_CRON_SECRET_REQUIRED'); }
  if (!environment.GEMINI_API_KEY?.trim()) reasons.push('VERCEL_LIVE_PROCESSING_GEMINI_API_KEY_REQUIRED');
  if (sources.length === 0) reasons.push('VERCEL_LIVE_PROCESSING_SOURCE_REGISTRY_REQUIRED');
  if (runtime.organizationId && sources.some((source) => source.organizationId !== runtime.organizationId)) {
    reasons.push('VERCEL_LIVE_PROCESSING_SOURCE_ORGANIZATION_MISMATCH');
  }
  parseLimit(environment.ORBI_NEWS_LIVE_PROCESSING_LIMIT);

  const authority = resolveProductionOperationalAuthoritySnapshot({ runtime, environment });
  const requiredActions = [OperationalAction.VERIFY_NEWS, OperationalAction.GENERATE_DRAFT];
  if (profile === ControlledActivationProfile.WEB_AUTONOMOUS) requiredActions.push(OperationalAction.PUBLISH_WEB);
  for (const action of requiredActions) {
    const assessment = assessOperationalAuthority(action, authority);
    if (assessment.decision !== OperationalDecision.ALLOW) {
      reasons.push(`VERCEL_LIVE_PROCESSING_AUTHORITY_${action}_${assessment.decision}`, ...assessment.reasons);
    }
  }

  return { ready: reasons.length === 0, reasons: [...new Set(reasons)], sourceCount: sources.length };
};

export const executeVercelLiveProcessingCron = async ({
  environment,
  firestore,
  firestoreSdkLoader,
  nowUtc = new Date().toISOString() as IsoUtcDateTime,
  groundedClient: injectedGroundedClient,
  articleFetcher: injectedArticleFetcher,
}: {
  readonly environment: VercelLiveProcessingEnvironment;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
  readonly nowUtc?: IsoUtcDateTime;
  readonly groundedClient?: GroundedResearchClient;
  readonly articleFetcher?: LiveArticleFetcher;
}) => {
  const preflight = runVercelLiveProcessingPreflight(environment);
  if (!preflight.ready) throw new Error(`VERCEL_LIVE_PROCESSING_NOT_READY:${preflight.reasons.join(',')}`);

  const durableFirestore = firestore ?? createConfiguredFirestoreClient(environment, firestoreSdkLoader);
  if (!durableFirestore) throw new Error('VERCEL_LIVE_PROCESSING_FIRESTORE_REQUIRED');
  const runtime = resolveProductionRuntimeConfiguration(environment);
  if (!runtime.organizationId) throw new Error('VERCEL_LIVE_PROCESSING_ORGANIZATION_REQUIRED');
  const profile = parseProfile(environment);
  const authoritySnapshot = resolveProductionOperationalAuthoritySnapshot({ runtime, environment });

  const entries = parseEnvironmentSourceRegistry(environment);
  const sourceRegistry = createInMemorySourceRegistry(entries);
  const articleFetcher = injectedArticleFetcher ?? createLiveArticleFetcher({ allowedHosts: entries.map((source) => source.domain) });
  const groundedClient = injectedGroundedClient ?? createGeminiGroundedResearchClient(environment);
  const researchProvider = createLiveResearchProvider({
    articleFetcher,
    groundedClient,
    sourceRegistry,
    clock: () => nowUtc,
  });
  const pipeline = createLiveNewsProcessingPipeline({
    researchProvider,
    clock: () => nowUtc,
    storyIdFactory: (candidate) => `story-${candidate.id}`,
  });
  const processingStore = createFirestoreLiveProcessingStore({ firestore: durableFirestore });
  const editorialSink = createFirestoreLiveEditorialSink({ firestore: durableFirestore });
  const publicStore = createFirestorePublicNewsStore({ firestore: durableFirestore, organizationId: runtime.organizationId });
  const pending = await processingStore.listPending(runtime.organizationId, parseLimit(environment.ORBI_NEWS_LIVE_PROCESSING_LIMIT));
  const results: Array<{ candidateId: string; outcome: LiveProcessingOutcome; storyId: string | null; publicationOutcome: string | null }> = [];

  for (const candidate of pending) {
    const result = await pipeline.process(candidate);
    let storyId: string | null = null;
    let publicationOutcome: string | null = null;
    const receiptReasons = [...result.reasons];

    if (result.outcome === LiveProcessingOutcome.DRAFT_READY && result.story) {
      await editorialSink.persistReadyForReview(result.story, result.reasons);
      storyId = String(result.story.id);

      if (profile === ControlledActivationProfile.WEB_AUTONOMOUS) {
        const publication = await publishStoryAutonomouslyIfEligible({
          story: result.story,
          writer: publicStore,
          existingRecords: await publicStore.listRecords(),
          authoritySnapshot,
          nowUtc,
        });
        publicationOutcome = publication.outcome;
        receiptReasons.push(...publication.reasons);
        if (publication.publishedStory) {
          await editorialSink.markPublished(publication.publishedStory, nowUtc);
        }
      }
    }

    await processingStore.recordReceipt(runtime.organizationId, {
      candidateId: candidate.id,
      outcome: result.outcome,
      storyId,
      reasons: receiptReasons,
      processedAt: nowUtc,
    });
    results.push({ candidateId: candidate.id, outcome: result.outcome, storyId, publicationOutcome });
  }

  return {
    processed: results.length,
    draftsReadyForReview: results.filter((item) => item.outcome === LiveProcessingOutcome.DRAFT_READY).length,
    published: results.filter((item) => item.publicationOutcome === 'PUBLISHED' || item.publicationOutcome === 'ALREADY_PUBLISHED').length,
    results,
  };
};
