import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import {
  createConfiguredFirestoreClient,
  EDITORIAL_FIRESTORE_SERVER_SDK_PACKAGE,
  EDITORIAL_FIRESTORE_VERCEL_OIDC_EXPIRATION_BUFFER_MS,
  EDITORIAL_FIRESTORE_VERCEL_OIDC_SCOPE,
  type ExternalAccountConfigLike,
  type FirestoreVercelOidcDependencies,
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

test('default loader resolves the statically linked official Firestore SDK', () => {
  const client = createConfiguredFirestoreClient({
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-packaging-test',
  });

  assert.ok(client);
  assert.equal(typeof client.collection, 'function');
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

test('Firestore auth mode rejects unknown values', () => {
  assert.throws(
    () => createConfiguredFirestoreClient({
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
      ORBI_EDITORIAL_FIRESTORE_AUTH_MODE: 'STATIC_KEY',
    }, () => sdkModule),
    /EDITORIAL_FIRESTORE_AUTH_MODE_INVALID/,
  );
});

test('Vercel OIDC mode wires exact WIF audience, impersonation and renewable token supplier', async () => {
  MinimalFirestore.lastSettings = null;
  let externalConfig: ExternalAccountConfigLike | null = null;
  let googleAuthOptions: {
    readonly projectId: string;
    readonly scopes: readonly string[];
    readonly authClient: unknown;
  } | null = null;
  let tokenOptions: {
    readonly audience: string;
    readonly expirationBufferMs: number;
  } | null = null;

  const externalClient = { kind: 'external-account-client' };
  const googleAuth = { kind: 'google-auth' };
  const dependencies: FirestoreVercelOidcDependencies = {
    createExternalAccountClient(config) {
      externalConfig = config;
      return externalClient;
    },
    createGoogleAuth(options) {
      googleAuthOptions = options;
      return googleAuth;
    },
    async getVercelOidcToken(options) {
      tokenOptions = options;
      return 'vercel-oidc-token';
    },
  };

  const client = createConfiguredFirestoreClient({
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'cs-project-95cg3lcv',
    ORBI_EDITORIAL_FIRESTORE_DATABASE_ID: 'orbi-news-staging',
    ORBI_EDITORIAL_FIRESTORE_AUTH_MODE: 'VERCEL_OIDC',
    ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER: '1028562296104',
    ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID: 'orbi-vercel',
    ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID: 'orbi-news-preview',
    ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL:
      'orbi-news-vercel@cs-project-95cg3lcv.iam.gserviceaccount.com',
  }, () => sdkModule, dependencies);

  assert.ok(client instanceof MinimalFirestore);
  assert.ok(externalConfig);
  const audience =
    'https://iam.googleapis.com/projects/1028562296104/locations/global/' +
    'workloadIdentityPools/orbi-vercel/providers/orbi-news-preview';
  assert.equal(externalConfig.audience, audience);
  assert.equal(externalConfig.subject_token_type, 'urn:ietf:params:oauth:token-type:jwt');
  assert.equal(externalConfig.token_url, 'https://sts.googleapis.com/v1/token');
  assert.equal(
    externalConfig.service_account_impersonation_url,
    'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/' +
      'orbi-news-vercel@cs-project-95cg3lcv.iam.gserviceaccount.com:generateAccessToken',
  );

  assert.equal(await externalConfig.subject_token_supplier.getSubjectToken(), 'vercel-oidc-token');
  assert.deepEqual(tokenOptions, {
    audience,
    expirationBufferMs: EDITORIAL_FIRESTORE_VERCEL_OIDC_EXPIRATION_BUFFER_MS,
  });
  assert.deepEqual(googleAuthOptions, {
    projectId: 'cs-project-95cg3lcv',
    scopes: [EDITORIAL_FIRESTORE_VERCEL_OIDC_SCOPE],
    authClient: externalClient,
  });
  assert.deepEqual(MinimalFirestore.lastSettings, {
    projectId: 'cs-project-95cg3lcv',
    databaseId: 'orbi-news-staging',
    ignoreUndefinedProperties: true,
    auth: googleAuth,
  });
});

test('Vercel OIDC mode fails closed when identity metadata is incomplete or mismatched', () => {
  const base = {
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'cs-project-95cg3lcv',
    ORBI_EDITORIAL_FIRESTORE_AUTH_MODE: 'VERCEL_OIDC',
    ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER: '1028562296104',
    ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID: 'orbi-vercel',
    ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID: 'orbi-news-preview',
    ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL:
      'orbi-news-vercel@cs-project-95cg3lcv.iam.gserviceaccount.com',
  };

  assert.throws(
    () => createConfiguredFirestoreClient({
      ...base,
      ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER: 'not-a-number',
    }, () => sdkModule),
    /EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER_INVALID/,
  );

  assert.throws(
    () => createConfiguredFirestoreClient({
      ...base,
      ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL:
        'orbi-news-vercel@different-project.iam.gserviceaccount.com',
    }, () => sdkModule),
    /EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_PROJECT_MISMATCH/,
  );
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
