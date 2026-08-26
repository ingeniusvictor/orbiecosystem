import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import type { AddressInfo } from 'node:net';
import type { OrganizationId, CanonicalStoryId } from '../../domain/common/types';
import {
  EditorialControlAction,
  EditorialRole,
} from '../../domain/editorial';
import { createEditorialPrivateApi } from '../../server/editorial/private-api';
import type { EditorialIdentityResolver } from '../../server/editorial/identity';
import type {
  EditorialMutationCommand,
  EditorialMutationCommandService,
} from '../../server/editorial/mutation-command-service';

const startApi = async (
  identityResolver: EditorialIdentityResolver,
  mutationService?: EditorialMutationCommandService,
) => {
  const app = express();
  app.use(express.json());
  app.use('/api/editorial', createEditorialPrivateApi({
    identityResolver,
    mutationService,
  }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
};

const authenticated = (
  role: EditorialRole | null = EditorialRole.EDITOR,
): EditorialIdentityResolver => ({
  async resolve() {
    return {
      organizationId: 'org-authenticated' as OrganizationId,
      actorId: 'actor-authenticated',
      role,
    };
  },
});

test('mutation route requires authentication before mutation configuration', async () => {
  const api = await startApi({ async resolve() { return null; } });
  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY }),
    });
    assert.equal(response.status, 401);
  } finally {
    await api.close();
  }
});

test('mutation route rejects authenticated actor without editorial role', async () => {
  const api = await startApi(authenticated(null));
  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY }),
    });
    assert.equal(response.status, 403);
  } finally {
    await api.close();
  }
});

test('mutation route fails closed when unit of work is not configured', async () => {
  const api = await startApi(authenticated(EditorialRole.OWNER));
  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY }),
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'EDITORIAL_MUTATION_NOT_CONFIGURED');
  } finally {
    await api.close();
  }
});

test('mutation route ignores actor, role and organization supplied by client body', async () => {
  let received: EditorialMutationCommand | null = null;
  const service: EditorialMutationCommandService = {
    async execute(command) {
      received = command;
      return {
        ok: true,
        action: command.action,
        storyId: command.storyId,
        revision: 'rev-2',
      };
    },
  };
  const api = await startApi(authenticated(EditorialRole.EDITOR), service);

  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: EditorialControlAction.APPROVE_STORY,
        expectedRevision: 'rev-1',
        reason: 'Reviewed',
        actorId: 'attacker',
        organizationId: 'other-org',
        role: EditorialRole.OWNER,
      }),
    });

    assert.equal(response.status, 200);
    assert.ok(received);
    assert.equal(received.actor.actorId, 'actor-authenticated');
    assert.equal(received.actor.organizationId, 'org-authenticated');
    assert.equal(received.actor.role, EditorialRole.EDITOR);
    assert.equal(received.storyId, 'story-1' as CanonicalStoryId);
    assert.equal(received.expectedRevision, 'rev-1');
    assert.equal(received.reason, 'Reviewed');
  } finally {
    await api.close();
  }
});

test('mutation route validates action before calling service', async () => {
  let calls = 0;
  const service: EditorialMutationCommandService = {
    async execute() {
      calls += 1;
      throw new Error('should not be called');
    },
  };
  const api = await startApi(authenticated(EditorialRole.OWNER), service);

  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'MAKE_ME_OWNER' }),
    });
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally {
    await api.close();
  }
});

test('mutation route maps stale and concurrent revisions to HTTP 409', async () => {
  let code: 'EDITORIAL_STALE_CLIENT_REVISION' | 'EDITORIAL_CONCURRENT_MODIFICATION' = 'EDITORIAL_STALE_CLIENT_REVISION';
  const service: EditorialMutationCommandService = {
    async execute() {
      return { ok: false, code, reasons: ['REVISION_MISMATCH'] };
    },
  };
  const api = await startApi(authenticated(EditorialRole.OWNER), service);

  try {
    for (const nextCode of ['EDITORIAL_STALE_CLIENT_REVISION', 'EDITORIAL_CONCURRENT_MODIFICATION'] as const) {
      code = nextCode;
      const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY }),
      });
      assert.equal(response.status, 409);
      assert.equal((await response.json()).error, nextCode);
    }
  } finally {
    await api.close();
  }
});

test('mutation route maps deterministic action denial to HTTP 403', async () => {
  const service: EditorialMutationCommandService = {
    async execute() {
      return {
        ok: false,
        code: 'EDITORIAL_ACTION_NOT_ALLOWED',
        reasons: ['ROLE_NOT_AUTHORIZED'],
      };
    },
  };
  const api = await startApi(authenticated(EditorialRole.EDITOR), service);

  try {
    const response = await fetch(`${api.baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: EditorialControlAction.PUBLISH_WEB_NOW }),
    });
    assert.equal(response.status, 403);
    assert.deepEqual((await response.json()).reasons, ['ROLE_NOT_AUTHORIZED']);
  } finally {
    await api.close();
  }
});
