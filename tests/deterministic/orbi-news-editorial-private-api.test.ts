import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';

import type { OrganizationId } from '../../domain/common/types';
import { EditorialQueueBucket, EditorialRole } from '../../domain/editorial';
import type {
  EditorialControlCenterReadService,
  EditorialQueueQuery,
} from '../../server/editorial/control-center-read-service';
import {
  notConfiguredEditorialIdentityResolver,
  type EditorialIdentityResolver,
} from '../../server/editorial/identity';
import { createEditorialControlCenterRouter } from '../../server/editorial/routes';

const organizationId = 'orbi-ecosystem' as OrganizationId;

const request = async (
  identityResolver: EditorialIdentityResolver,
  service: EditorialControlCenterReadService,
  path = '/api/editorial/queue',
): Promise<Response> => {
  const app = express();
  app.use('/api/editorial', createEditorialControlCenterRouter(service, identityResolver));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as AddressInfo).port;

  try {
    return await fetch(`http://127.0.0.1:${port}${path}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    );
  }
};

const service = (onQuery?: (query: EditorialQueueQuery) => void): EditorialControlCenterReadService => ({
  async listQueue(query) {
    onQuery?.(query);
    return [];
  },
});

test('private editorial API fails closed when authentication is not configured', async () => {
  let called = false;
  const response = await request(
    notConfiguredEditorialIdentityResolver,
    service(() => { called = true; }),
  );

  assert.equal(response.status, 401);
  assert.equal(called, false);
  assert.deepEqual(await response.json(), { error: 'EDITORIAL_AUTHENTICATION_REQUIRED' });
});

test('authenticated actor without editorial role receives 403', async () => {
  const resolver: EditorialIdentityResolver = {
    async resolve() {
      return { organizationId, actorId: 'actor-1', role: null };
    },
  };

  const response = await request(resolver, service());
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'EDITORIAL_ROLE_REQUIRED' });
});

test('invalid queue bucket is rejected before read service execution', async () => {
  let called = false;
  const resolver: EditorialIdentityResolver = {
    async resolve() {
      return { organizationId, actorId: 'actor-1', role: EditorialRole.EDITOR };
    },
  };

  const response = await request(
    resolver,
    service(() => { called = true; }),
    '/api/editorial/queue?bucket=NOT_REAL',
  );

  assert.equal(response.status, 400);
  assert.equal(called, false);
  const body = await response.json() as { error: string; allowed: string[] };
  assert.equal(body.error, 'INVALID_EDITORIAL_QUEUE_BUCKET');
  assert.ok(body.allowed.includes(EditorialQueueBucket.NEEDS_REVIEW));
});

test('authorized editorial read is scoped by authenticated organization and role', async () => {
  let received: EditorialQueueQuery | null = null;
  const resolver: EditorialIdentityResolver = {
    async resolve() {
      return { organizationId, actorId: 'owner-1', role: EditorialRole.OWNER };
    },
  };

  const response = await request(
    resolver,
    service((query) => { received = query; }),
    `/api/editorial/queue?bucket=${EditorialQueueBucket.NEEDS_REVIEW}`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items: [] });
  assert.deepEqual(received, {
    organizationId,
    role: EditorialRole.OWNER,
    bucket: EditorialQueueBucket.NEEDS_REVIEW,
  });
});
