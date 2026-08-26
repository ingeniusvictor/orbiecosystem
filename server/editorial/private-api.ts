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
import {
  createEditorialMutationCommandService,
  type EditorialMutationCommandService,
  type EditorialMutationUnitOfWork,
} from './mutation-command-service';
import { createEditorialControlCenterRouter } from './routes';
import type { EditorialSessionSecurity } from './session-auth';

export interface EditorialPrivateApiDependencies {
  readonly reader?: EditorialQueueReader;
  readonly identityResolver?: EditorialIdentityResolver;
  readonly mutationUnitOfWork?: EditorialMutationUnitOfWork;
  readonly mutationService?: EditorialMutationCommandService;
  readonly sessionSecurity?: EditorialSessionSecurity;
}

export const createEditorialPrivateApi = (
  dependencies: EditorialPrivateApiDependencies = {},
): Router => {
  const service = createEditorialControlCenterReadService(
    dependencies.reader ?? emptyEditorialQueueReader,
  );
  const identityResolver = dependencies.identityResolver ?? notConfiguredEditorialIdentityResolver;
  const mutationService = dependencies.mutationService
    ?? (dependencies.mutationUnitOfWork
      ? createEditorialMutationCommandService(dependencies.mutationUnitOfWork)
      : null);

  return createEditorialControlCenterRouter(
    service,
    identityResolver,
    mutationService,
    dependencies.sessionSecurity ?? null,
  );
};
