import type { OrganizationId } from '../../domain/common/types';
import type { PublicNewsReader, PublishedNewsSourceRecord } from '../../domain/publications/public-news';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';

export const FIRESTORE_PUBLIC_NEWS_ROOT_COLLECTION = 'orbiNewsOrganizations';
export const FIRESTORE_PUBLIC_NEWS_ARTICLES_COLLECTION = 'publishedArticles';

export interface PublicNewsWriter {
  publish(record: PublishedNewsSourceRecord): Promise<void>;
}

export interface FirestorePublicNewsStore extends PublicNewsReader, PublicNewsWriter {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPublishedNewsSourceRecord = (value: unknown): value is PublishedNewsSourceRecord => {
  if (!isRecord(value) || !isRecord(value.article)) return false;
  const article = value.article;
  return typeof value.storyStatus === 'string'
    && typeof value.publicationStatus === 'string'
    && typeof value.publicationChannel === 'string'
    && typeof article.id === 'string'
    && typeof article.slug === 'string'
    && typeof article.headline === 'string'
    && typeof article.dek === 'string'
    && typeof article.category === 'string'
    && typeof article.publishedAt === 'string'
    && Array.isArray(article.sections)
    && Array.isArray(article.sources);
};

const collectionFor = (firestore: FirestoreClientLike, organizationId: OrganizationId) =>
  firestore.collection(FIRESTORE_PUBLIC_NEWS_ROOT_COLLECTION)
    .doc(organizationId)
    .collection(FIRESTORE_PUBLIC_NEWS_ARTICLES_COLLECTION);

export const createFirestorePublicNewsStore = ({
  firestore,
  organizationId,
}: {
  readonly firestore: FirestoreClientLike;
  readonly organizationId: OrganizationId;
}): FirestorePublicNewsStore => ({
  async listRecords() {
    const snapshot = await collectionFor(firestore, organizationId).get();
    return snapshot.docs.map((document) => document.data()).map((value) => {
      if (!isPublishedNewsSourceRecord(value)) throw new Error('PUBLIC_NEWS_FIRESTORE_INVALID_RECORD');
      return value;
    });
  },

  async publish(record) {
    const articleId = record.article.id.trim();
    if (!articleId) throw new Error('PUBLIC_NEWS_ARTICLE_ID_REQUIRED');
    const reference = collectionFor(firestore, organizationId).doc(articleId);
    await firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        const current = existing.data();
        if (!isPublishedNewsSourceRecord(current)) throw new Error('PUBLIC_NEWS_FIRESTORE_INVALID_RECORD');
        if (
          current.article.slug === record.article.slug
          && current.article.publishedAt === record.article.publishedAt
          && current.publicationStatus === record.publicationStatus
        ) return;
        throw new Error('PUBLIC_NEWS_PUBLICATION_CONFLICT');
      }
      transaction.create(reference, record);
    });
  },
});
