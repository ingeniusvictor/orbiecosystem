import type { Router } from 'express';
import {
  createEditorialControlCenterReadService,
  emptyEditorialQueueReader,
  type EditorialQueueReader,
} from './control-center-read-service';
import {
  notConfiguredEditorialIdentityResolver,
  type EditorialIdentityResolver,
} from './identity';
import { createEditorialControlCenterRouter } from './routes';

export interface EditorialPrivateApiDependencies {
  readonly reader?: EditorialQueueReader;
  readonly identityResolver?: EditorialIdentityResolver;
}

export const createEditorialPrivateApi = (
  dependencies: EditorialPrivateApiDependencies = {},
): Router => {
  const service = createEditorialControlCenterReadService(
    dependencies.reader ?? emptyEditorialQueueReader,
  );
  const identityResolver = dependencies.identityResolver ?? notConfiguredEditorialIdentityResolver;

  return createEditorialControlCenterRouter(service, identityResolver);
};
