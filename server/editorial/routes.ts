import { Router, type Request, type Response } from 'express';
import { EditorialQueueBucket } from '../../domain/editorial';
import type { EditorialControlCenterReadService } from './control-center-read-service';
import type { EditorialIdentityResolver } from './identity';

const parseBucket = (value: unknown): EditorialQueueBucket | null | 'INVALID' => {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'INVALID';
  return Object.values(EditorialQueueBucket).includes(value as EditorialQueueBucket)
    ? value as EditorialQueueBucket
    : 'INVALID';
};

export const createEditorialControlCenterRouter = (
  service: EditorialControlCenterReadService,
  identityResolver: EditorialIdentityResolver,
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

  return router;
};
