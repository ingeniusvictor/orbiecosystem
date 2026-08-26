import type { Express } from 'express';
import { createHmacEditorialIdentityResolver } from './hmac-identity-provider';
import { createEditorialPrivateApi } from './private-api';
import type { EditorialQueueReader } from './control-center-read-service';
import type { EditorialMutationUnitOfWork } from './mutation-command-service';
import { createJsonEditorialPersistence } from './json-persistence';

export interface EditorialRuntimeEnvironment {
  readonly ORBI_EDITORIAL_AUTH_SECRET?: string;
  readonly ORBI_EDITORIAL_LOCAL_STORE_FILE?: string;
  readonly NODE_ENV?: string;
}

export interface EditorialRuntimeMountOptions {
  readonly reader?: EditorialQueueReader;
  readonly mutationUnitOfWork?: EditorialMutationUnitOfWork;
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

  const localPersistence = localStoreFile
    ? createJsonEditorialPersistence({ filePath: localStoreFile })
    : null;

  const identityResolver = createHmacEditorialIdentityResolver({ secret });
  app.use('/api/editorial', createEditorialPrivateApi({
    reader: options.reader ?? localPersistence ?? undefined,
    mutationUnitOfWork: options.mutationUnitOfWork ?? localPersistence ?? undefined,
    identityResolver,
  }));
  return true;
};
