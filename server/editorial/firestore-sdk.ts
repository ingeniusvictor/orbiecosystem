import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { FirestoreClientLike } from './firestore-persistence';

export interface EditorialFirestoreEnvironment {
  readonly ORBI_EDITORIAL_FIRESTORE_ENABLED?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?: string;
}

export interface FirestoreConstructorLike {
  new (settings?: {
    readonly projectId?: string;
    readonly databaseId?: string;
    readonly ignoreUndefinedProperties?: boolean;
  }): FirestoreClientLike;
}

export interface FirestoreSdkModuleLike {
  readonly Firestore: FirestoreConstructorLike;
}

export type FirestoreSdkLoader = () => unknown;

const FIRESTORE_PACKAGE_NAME = '@google-cloud/firestore';

const defaultFirestoreSdkLoader: FirestoreSdkLoader = () => {
  const requireFromProject = createRequire(join(process.cwd(), 'package.json'));
  return requireFromProject(FIRESTORE_PACKAGE_NAME);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFirestoreSdkModule = (value: unknown): value is FirestoreSdkModuleLike =>
  isRecord(value) && typeof value.Firestore === 'function';

const parseEnabledFlag = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new Error('EDITORIAL_FIRESTORE_ENABLED_INVALID');
};

export const createConfiguredFirestoreClient = (
  environment: EditorialFirestoreEnvironment,
  loader: FirestoreSdkLoader = defaultFirestoreSdkLoader,
): FirestoreClientLike | null => {
  if (!parseEnabledFlag(environment.ORBI_EDITORIAL_FIRESTORE_ENABLED)) return null;

  const projectId = environment.ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?.trim();
  if (!projectId) throw new Error('EDITORIAL_FIRESTORE_PROJECT_ID_REQUIRED');

  const databaseId = environment.ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?.trim();

  let loaded: unknown;
  try {
    loaded = loader();
  } catch {
    throw new Error('EDITORIAL_FIRESTORE_SDK_NOT_INSTALLED');
  }

  if (!isFirestoreSdkModule(loaded)) {
    throw new Error('EDITORIAL_FIRESTORE_SDK_INVALID');
  }

  return new loaded.Firestore({
    projectId,
    ...(databaseId ? { databaseId } : {}),
    ignoreUndefinedProperties: true,
  });
};

export const EDITORIAL_FIRESTORE_SERVER_SDK_PACKAGE = FIRESTORE_PACKAGE_NAME;
