import type { Express } from 'express';
import { createHmacEditorialIdentityResolver } from './hmac-identity-provider';
import { createEditorialPrivateApi } from './private-api';
import type { EditorialQueueReader } from './control-center-read-service';
import type { EditorialMutationUnitOfWork } from './mutation-command-service';
import { createJsonEditorialPersistence } from './json-persistence';
import {
  createFirestoreEditorialPersistence,
  type FirestoreClientLike,
} from './firestore-persistence';
import {
  createConfiguredFirestoreClient,
  type EditorialFirestoreEnvironment,
  type FirestoreSdkLoader,
} from './firestore-sdk';
import {
  combineEditorialIdentityResolvers,
  createEditorialSessionRouter,
  createEditorialSessionSecurity,
  resolveEditorialSessionOptions,
  type EditorialSessionEnvironment,
} from './session-auth';

export interface EditorialRuntimeEnvironment
  extends EditorialFirestoreEnvironment, EditorialSessionEnvironment {
  readonly ORBI_EDITORIAL_AUTH_SECRET?: string;
  readonly ORBI_EDITORIAL_LOCAL_STORE_FILE?: string;
  readonly NODE_ENV?: string;
}

export interface EditorialRuntimeMountOptions {
  readonly reader?: EditorialQueueReader;
  readonly mutationUnitOfWork?: EditorialMutationUnitOfWork;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
}

export const mountEditorialPrivateApiIfConfigured = (
  app: Express,
  environment: EditorialRuntimeEnvironment,
  options: EditorialRuntimeMountOptions = {},
): boolean => {
  const secret = environment.ORBI_EDITORIAL_AUTH_SECRET?.trim();
  if (!secret) return false;

  const localStoreFile = environment.ORBI_EDITORIAL_LOCAL_STORE_FILE?.trim();
  if (localStoreFile && environment.NODE_ENV === 'production') {
    throw new Error('EDITORIAL_LOCAL_STORE_FORBIDDEN_IN_PRODUCTION');
  }

  const hasInjectedPersistence = Boolean(
    options.reader || options.mutationUnitOfWork || options.firestore,
  );
  const configuredFirestore = options.firestore ?? (
    hasInjectedPersistence
      ? null
      : createConfiguredFirestoreClient(environment, options.firestoreSdkLoader)
  );

  if (localStoreFile && configuredFirestore) {
    throw new Error('EDITORIAL_MULTIPLE_PERSISTENCE_BACKENDS_CONFIGURED');
  }

  const localPersistence = localStoreFile
    ? createJsonEditorialPersistence({ filePath: localStoreFile })
    : null;
  const firestorePersistence = configuredFirestore
    ? createFirestoreEditorialPersistence({ firestore: configuredFirestore })
    : null;
  const defaultPersistence = firestorePersistence ?? localPersistence;

  const bearerIdentityResolver = createHmacEditorialIdentityResolver({ secret });
  const sessionSecurity = createEditorialSessionSecurity({ secret });
  const sessionOptions = resolveEditorialSessionOptions(environment, secret);
  const identityResolver = combineEditorialIdentityResolvers(
    bearerIdentityResolver,
    sessionSecurity.identityResolver,
  );

  app.use('/api/editorial', createEditorialSessionRouter(sessionOptions, sessionSecurity));
  app.use('/api/editorial', createEditorialPrivateApi({
    reader: options.reader ?? defaultPersistence ?? undefined,
    mutationUnitOfWork: options.mutationUnitOfWork ?? defaultPersistence ?? undefined,
    identityResolver,
    sessionSecurity,
  }));
  return true;
};
