import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import {
  createConfiguredFirestoreClient,
  EDITORIAL_FIRESTORE_SERVER_SDK_PACKAGE,
} from '../../server/editorial/firestore-sdk';
import {
  mountEditorialPrivateApiIfConfigured,
} from '../../server/editorial/runtime-mount';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import type { EditorialQueueReader } from '../../server/editorial/control-center-read-service';

class MinimalCollection implements FirestoreCollectionReferenceLike {
  doc(): any {
    return { collection: () => new MinimalCollection() };
  }
  async get(): Promise<FirestoreQuerySnapshotLike> {
    return { docs: [] };
  }
}

class MinimalFirestore implements FirestoreClientLike {
  static lastSettings: Record<string, unknown> | null = null;

  constructor(settings?: Record<string, unknown>) {
    MinimalFirestore.lastSettings = settings ?? null;
  }

  collection(): FirestoreCollectionReferenceLike {
    return new MinimalCollection();
  }

  async runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T> {
    throw new Error(`UNUSED_TRANSACTION:${String(operation)}`);
  }
}

const sdkModule = { Firestore: MinimalFirestore };

test('Firestore SDK remains disabled by default and does not invoke loader', () => {
  let calls = 0;
  const client = createConfiguredFirestoreClient({}, () => {
    calls += 1;
    return sdkModule;
  });

  assert.equal(client, null);
  assert.equal(calls, 0);
  assert.equal(EDITORIAL_FIRESTORE_SERVER_SDK_PACKAGE, '@google-cloud/firestore');
});

test('Firestore enabled flag accepts true/1 and rejects ambiguous values', () => {
  assert.throws(
    () => createConfiguredFirestoreClient({ ORBI_EDITORIAL_FIRESTORE_ENABLED: 'sometimes' }, () => sdkModule),
    /EDITORIAL_FIRESTORE_ENABLED_INVALID/,
  );
});

test('Firestore enabled mode requires explicit project id before loading SDK', () => {
  let calls = 0;
  assert.throws(
    () => createConfiguredFirestoreClient({ ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true' }, () => {
      calls += 1;
      return sdkModule;
    }),
    /EDITORIAL_FIRESTORE_PROJECT_ID_REQUIRED/,
  );
  assert.equal(calls, 0);
});

test('missing official SDK fails closed with explicit configuration error', () => {
  assert.throws(
    () => createConfiguredFirestoreClient({
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
    }, () => {
      throw new Error('MODULE_NOT_FOUND');
    }),
    /EDITORIAL_FIRESTORE_SDK_NOT_INSTALLED/,
  );
});

test('invalid SDK module shape is rejected', () => {
  assert.throws(
    () => createConfiguredFirestoreClient({
      ORBI_EDITORIAL_FIRESTORE_ENABLED: '1',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
    }, () => ({ nope: true })),
    /EDITORIAL_FIRESTORE_SDK_INVALID/,
  );
});

test('official SDK constructor receives explicit project/database and safe undefined handling', () => {
  MinimalFirestore.lastSettings = null;
  const client = createConfiguredFirestoreClient({
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: ' orbi-prod ',
    ORBI_EDITORIAL_FIRESTORE_DATABASE_ID: ' orbi-news ',
  }, () => sdkModule);

  assert.ok(client instanceof MinimalFirestore);
  assert.deepEqual(MinimalFirestore.lastSettings, {
    projectId: 'orbi-prod',
    databaseId: 'orbi-news',
    ignoreUndefinedProperties: true,
  });
});

test('runtime auto-loads Firestore only when no persistence dependency was injected', () => {
  let calls = 0;
  const app = express();
  const mounted = mountEditorialPrivateApiIfConfigured(app, {
    ORBI_EDITORIAL_AUTH_SECRET: 'a-secure-editorial-secret',
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  }, {
    firestoreSdkLoader: () => {
      calls += 1;
      return sdkModule;
    },
  });

  assert.equal(mounted, true);
  assert.equal(calls, 1);
});

test('injected reader prevents implicit Firestore SDK loading', () => {
  let calls = 0;
  const reader: EditorialQueueReader = {
    async listQueueSources() {
      return [];
    },
  };

  const mounted = mountEditorialPrivateApiIfConfigured(express(), {
    ORBI_EDITORIAL_AUTH_SECRET: 'a-secure-editorial-secret',
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  }, {
    reader,
    firestoreSdkLoader: () => {
      calls += 1;
      return sdkModule;
    },
  });

  assert.equal(mounted, true);
  assert.equal(calls, 0);
});

test('runtime rejects simultaneous Firestore and local JSON persistence', () => {
  assert.throws(
    () => mountEditorialPrivateApiIfConfigured(express(), {
      ORBI_EDITORIAL_AUTH_SECRET: 'a-secure-editorial-secret',
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
      ORBI_EDITORIAL_LOCAL_STORE_FILE: '.data/editorial.json',
      NODE_ENV: 'development',
    }, {
      firestoreSdkLoader: () => sdkModule,
    }),
    /EDITORIAL_MULTIPLE_PERSISTENCE_BACKENDS_CONFIGURED/,
  );
});
