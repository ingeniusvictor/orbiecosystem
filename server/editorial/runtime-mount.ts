import type { Express } from 'express';
import { createHmacEditorialIdentityResolver } from './hmac-identity-provider';
import { createEditorialPrivateApi } from './private-api';
import type { EditorialQueueReader } from './control-center-read-service';

export interface EditorialRuntimeEnvironment {
  readonly ORBI_EDITORIAL_AUTH_SECRET?: string;
}

export interface EditorialRuntimeMountOptions {
  readonly reader?: EditorialQueueReader;
}

export const mountEditorialPrivateApiIfConfigured = (
  app: Express,
  environment: EditorialRuntimeEnvironment,
  options: EditorialRuntimeMountOptions = {},
): boolean => {
  const secret = environment.ORBI_EDITORIAL_AUTH_SECRET?.trim();
  if (!secret) return false;

  const identityResolver = createHmacEditorialIdentityResolver({ secret });
  app.use('/api/editorial', createEditorialPrivateApi({
    reader: options.reader,
    identityResolver,
  }));
  return true;
};
