import { ContentCategory } from '../../domain/common/enums';
import type { OrganizationId } from '../../domain/common/types';
import { createConfiguredFirestoreClient, type EditorialFirestoreEnvironment, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createFirestorePublicNewsStore } from '../news/firestore-public-news-store';
import { createPublicNewsService } from '../news/public-news-service';

export interface VercelPublicNewsEnvironment extends EditorialFirestoreEnvironment {
  readonly ORBI_NEWS_ORGANIZATION_ID?: string;
}

const requiredOrganizationId = (environment: VercelPublicNewsEnvironment): OrganizationId => {
  const value = environment.ORBI_NEWS_ORGANIZATION_ID?.trim();
  if (!value) throw new Error('PUBLIC_NEWS_ORGANIZATION_ID_REQUIRED');
  return value as OrganizationId;
};

export const createVercelPublicNewsService = ({
  environment,
  firestore,
  firestoreSdkLoader,
}: {
  readonly environment: VercelPublicNewsEnvironment;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
}) => {
  const organizationId = requiredOrganizationId(environment);
  const durableFirestore = firestore ?? createConfiguredFirestoreClient(environment, firestoreSdkLoader);
  if (!durableFirestore) throw new Error('PUBLIC_NEWS_FIRESTORE_REQUIRED');
  return createPublicNewsService(createFirestorePublicNewsStore({ firestore: durableFirestore, organizationId }));
};

export const parsePublicNewsCategory = (value: string): ContentCategory | null => {
  const normalized = value.trim().toUpperCase() as ContentCategory;
  return Object.values(ContentCategory).includes(normalized) ? normalized : null;
};

export const isPublicNewsSlug = (value: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
