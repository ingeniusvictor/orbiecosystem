import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { ORBI_EDITORIAL_TIME_ZONE } from '../../domain/operations/scheduler';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createConfiguredFirestoreClient, type EditorialFirestoreEnvironment, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import { createFirestorePublicNewsStore } from '../news/firestore-public-news-store';
import { createPublicNewsService } from '../news/public-news-service';
import { createResendDigestMailProvider, type DigestMailProvider, type ResendMailEnvironment } from './resend-mail-provider';

export interface DailyNewsDigestEnvironment extends EditorialFirestoreEnvironment, ResendMailEnvironment {
  readonly ORBI_NEWS_ORGANIZATION_ID?: string;
  readonly ORBI_PUBLIC_BASE_URL?: string;
}

export type DailyNewsDigestOutcome = 'SKIPPED_OUTSIDE_WINDOW' | 'ALREADY_SENT' | 'IN_PROGRESS' | 'SENT';

export interface DailyNewsDigestResult {
  readonly outcome: DailyNewsDigestOutcome;
  readonly editorialDate: string;
  readonly articleCount: number;
  readonly emailId: string | null;
}

const ROOT = 'orbiNewsOrganizations';
const DIGESTS = 'dailyDigests';
const SEND_HOUR = 9;
const CLAIM_TTL_MS = 15 * 60_000;

const required = (label: string, value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label}_REQUIRED`);
  return normalized;
};

const editorialParts = (value: IsoUtcDateTime): { date: string; hour: number } => {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new RangeError('DAILY_DIGEST_NOW_INVALID');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORBI_EDITORIAL_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  const year = part('year'); const month = part('month'); const day = part('day'); const hour = Number(part('hour'));
  if (!year || !month || !day || !Number.isInteger(hour)) throw new Error('DAILY_DIGEST_TIME_RESOLUTION_FAILED');
  return { date: `${year}-${month}-${day}`, hour };
};

const editorialDateOf = (value: string): string | null => {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORBI_EDITORIAL_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  const year = part('year'); const month = part('month'); const day = part('day');
  return year && month && day ? `${year}-${month}-${day}` : null;
};

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const publicBaseUrl = (environment: DailyNewsDigestEnvironment): string => {
  const value = required('ORBI_PUBLIC_BASE_URL', environment.ORBI_PUBLIC_BASE_URL);
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('ORBI_PUBLIC_BASE_URL_HTTPS_REQUIRED');
  return url.toString().replace(/\/$/, '');
};

const buildMessage = (date: string, articles: readonly { headline: string; dek: string; slug: string; category: string }[], baseUrl: string) => {
  const subject = `ORBI News — Resumen diario ${date}`;
  if (articles.length === 0) {
    return {
      subject,
      text: `ORBI News — ${date}\n\nHoy no hubo noticias que superaran los filtros editoriales para publicación.`,
      html: `<h1>ORBI News — ${escapeHtml(date)}</h1><p>Hoy no hubo noticias que superaran los filtros editoriales para publicación.</p>`,
    };
  }
  const textItems = articles.map((article, index) => `${index + 1}. ${article.headline}\n${article.category} — ${article.dek}\n${baseUrl}/news/${article.slug}`).join('\n\n');
  const htmlItems = articles.map((article) => `<li><h2>${escapeHtml(article.headline)}</h2><p><strong>${escapeHtml(article.category)}</strong> — ${escapeHtml(article.dek)}</p><p><a href="${baseUrl}/news/${encodeURIComponent(article.slug)}">Leer en ORBI News</a></p></li>`).join('');
  return {
    subject,
    text: `ORBI News — ${date}\n\n${textItems}`,
    html: `<h1>ORBI News — ${escapeHtml(date)}</h1><p>Resumen de las noticias publicadas por ORBI durante el día.</p><ol>${htmlItems}</ol>`,
  };
};

export const executeDailyNewsDigest = async ({
  environment,
  firestore,
  firestoreSdkLoader,
  mailProvider,
  nowUtc = new Date().toISOString() as IsoUtcDateTime,
}: {
  readonly environment: DailyNewsDigestEnvironment;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
  readonly mailProvider?: DigestMailProvider;
  readonly nowUtc?: IsoUtcDateTime;
}): Promise<DailyNewsDigestResult> => {
  const editorial = editorialParts(nowUtc);
  if (editorial.hour !== SEND_HOUR) return { outcome: 'SKIPPED_OUTSIDE_WINDOW', editorialDate: editorial.date, articleCount: 0, emailId: null };

  const organizationId = required('ORBI_NEWS_ORGANIZATION_ID', environment.ORBI_NEWS_ORGANIZATION_ID) as OrganizationId;
  const durableFirestore = firestore ?? createConfiguredFirestoreClient(environment, firestoreSdkLoader);
  if (!durableFirestore) throw new Error('DAILY_DIGEST_FIRESTORE_REQUIRED');
  const baseUrl = publicBaseUrl(environment);
  const receipt = durableFirestore.collection(ROOT).doc(organizationId).collection(DIGESTS).doc(editorial.date);
  const nowMs = Date.parse(nowUtc);

  const claim = await durableFirestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(receipt);
    const data = snapshot.data() as Record<string, unknown> | undefined;
    if (snapshot.exists && data?.status === 'SENT') return 'ALREADY_SENT' as const;
    if (snapshot.exists && data?.status === 'CLAIMED' && typeof data.claimedAt === 'string') {
      const claimedMs = Date.parse(data.claimedAt);
      if (Number.isFinite(claimedMs) && nowMs - claimedMs < CLAIM_TTL_MS) return 'IN_PROGRESS' as const;
    }
    const next = { organizationId, editorialDate: editorial.date, status: 'CLAIMED', claimedAt: nowUtc, updatedAt: nowUtc };
    if (snapshot.exists) transaction.set(receipt, next); else transaction.create(receipt, next);
    return 'CLAIMED' as const;
  });

  if (claim === 'ALREADY_SENT' || claim === 'IN_PROGRESS') {
    return { outcome: claim, editorialDate: editorial.date, articleCount: 0, emailId: null };
  }

  try {
    const store = createFirestorePublicNewsStore({ firestore: durableFirestore, organizationId });
    const feed = await createPublicNewsService(store).listLatest();
    const articles = feed.items.filter((article) => editorialDateOf(article.publishedAt) === editorial.date);
    const message = buildMessage(editorial.date, articles, baseUrl);
    const provider = mailProvider ?? createResendDigestMailProvider({ environment });
    const sent = await provider.send({ ...message, idempotencyKey: `orbi-news-digest/${organizationId}/${editorial.date}` });
    await durableFirestore.runTransaction(async (transaction) => {
      transaction.set(receipt, {
        organizationId, editorialDate: editorial.date, status: 'SENT', articleCount: articles.length,
        emailId: sent.id, sentAt: nowUtc, updatedAt: nowUtc,
      });
    });
    return { outcome: 'SENT', editorialDate: editorial.date, articleCount: articles.length, emailId: sent.id };
  } catch (error) {
    await durableFirestore.runTransaction(async (transaction) => {
      transaction.set(receipt, {
        organizationId, editorialDate: editorial.date, status: 'FAILED', failedAt: nowUtc,
        error: error instanceof Error ? error.message.slice(0, 300) : 'DAILY_DIGEST_FAILED', updatedAt: nowUtc,
      });
    });
    throw error;
  }
};
