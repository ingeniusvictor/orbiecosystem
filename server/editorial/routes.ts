import { Router, type Request, type Response } from 'express';
import {
  EditorialControlAction,
  EditorialQueueBucket,
} from '../../domain/editorial';
import type { CanonicalStoryId } from '../../domain/common/types';
import type { EditorialControlCenterReadService } from './control-center-read-service';
import type { EditorialIdentityResolver } from './identity';
import type { EditorialMutationCommandService } from './mutation-command-service';

const parseBucket = (value: unknown): EditorialQueueBucket | null | 'INVALID' => {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'INVALID';
  return Object.values(EditorialQueueBucket).includes(value as EditorialQueueBucket)
    ? value as EditorialQueueBucket
    : 'INVALID';
};

const parseAction = (value: unknown): EditorialControlAction | null =>
  typeof value === 'string' && Object.values(EditorialControlAction).includes(value as EditorialControlAction)
    ? value as EditorialControlAction
    : null;

const parseExpectedRevision = (value: unknown): string | null | 'INVALID' => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.trim()) return 'INVALID';
  return value.trim();
};

const parseReason = (value: unknown): string | null | 'INVALID' => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return 'INVALID';
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.length <= 500 ? normalized : 'INVALID';
};

export const createEditorialControlCenterRouter = (
  service: EditorialControlCenterReadService,
  identityResolver: EditorialIdentityResolver,
  mutationService: EditorialMutationCommandService | null = null,
): Router => {
  const router = Router();

  router.get('/queue', async (request: Request, response: Response) => {
    try {
      const actor = await identityResolver.resolve(request);
      if (!actor) {
        response.status(401).json({ error: 'EDITORIAL_AUTHENTICATION_REQUIRED' });
        return;
      }

      if (!actor.role) {
        response.status(403).json({ error: 'EDITORIAL_ROLE_REQUIRED' });
        return;
      }

      const bucket = parseBucket(request.query.bucket);
      if (bucket === 'INVALID') {
        response.status(400).json({
          error: 'INVALID_EDITORIAL_QUEUE_BUCKET',
          allowed: Object.values(EditorialQueueBucket),
        });
        return;
      }

      const items = await service.listQueue({
        organizationId: actor.organizationId,
        role: actor.role,
        bucket,
      });

      response.json({ items });
    } catch (error) {
      console.error('Editorial Control Center read error:', error);
      response.status(500).json({ error: 'EDITORIAL_CONTROL_CENTER_READ_FAILED' });
    }
  });

  router.post('/stories/:storyId/actions', async (request: Request, response: Response) => {
    try {
      const actor = await identityResolver.resolve(request);
      if (!actor) {
        response.status(401).json({ error: 'EDITORIAL_AUTHENTICATION_REQUIRED' });
        return;
      }

      if (!actor.role) {
        response.status(403).json({ error: 'EDITORIAL_ROLE_REQUIRED' });
        return;
      }

      if (!mutationService) {
        response.status(503).json({ error: 'EDITORIAL_MUTATION_NOT_CONFIGURED' });
        return;
      }

      const storyId = request.params.storyId?.trim();
      if (!storyId) {
        response.status(400).json({ error: 'EDITORIAL_STORY_ID_REQUIRED' });
        return;
      }

      const action = parseAction(request.body?.action);
      if (!action) {
        response.status(400).json({
          error: 'INVALID_EDITORIAL_ACTION',
          allowed: Object.values(EditorialControlAction),
        });
        return;
      }

      const expectedRevision = parseExpectedRevision(request.body?.expectedRevision);
      if (expectedRevision === 'INVALID') {
        response.status(400).json({ error: 'INVALID_EDITORIAL_EXPECTED_REVISION' });
        return;
      }

      const reason = parseReason(request.body?.reason);
      if (reason === 'INVALID') {
        response.status(400).json({ error: 'INVALID_EDITORIAL_REASON' });
        return;
      }

      const result = await mutationService.execute({
        actor: {
          organizationId: actor.organizationId,
          actorId: actor.actorId,
          role: actor.role,
        },
        storyId: storyId as CanonicalStoryId,
        action,
        expectedRevision,
        reason,
      });

      if (result.ok) {
        response.status(200).json({ result });
        return;
      }

      const status = result.code === 'EDITORIAL_STORY_NOT_FOUND'
        ? 404
        : result.code === 'EDITORIAL_STALE_CLIENT_REVISION' || result.code === 'EDITORIAL_CONCURRENT_MODIFICATION'
          ? 409
          : result.code === 'EDITORIAL_ACTION_NOT_ALLOWED'
            ? 403
            : 422;

      response.status(status).json({ error: result.code, reasons: result.reasons });
    } catch (error) {
      console.error('Editorial mutation error:', error);
      response.status(500).json({ error: 'EDITORIAL_MUTATION_REQUEST_FAILED' });
    }
  });

  return router;
};
