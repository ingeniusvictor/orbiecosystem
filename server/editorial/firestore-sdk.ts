import { Firestore } from '@google-cloud/firestore';
import { getVercelOidcToken } from '@vercel/oidc';
import { ExternalAccountClient, GoogleAuth } from 'google-auth-library';
import type { FirestoreClientLike } from './firestore-persistence.js';

export type EditorialFirestoreAuthMode = 'ADC' | 'VERCEL_OIDC';

export interface EditorialFirestoreEnvironment {
  readonly ORBI_EDITORIAL_FIRESTORE_ENABLED?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_AUTH_MODE?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL?: string;
}

export interface FirestoreConstructorLike {
  new (settings?: {
    readonly projectId?: string;
    readonly databaseId?: string;
    readonly ignoreUndefinedProperties?: boolean;
    readonly auth?: unknown;
  }): FirestoreClientLike;
}

export interface FirestoreSdkModuleLike {
  readonly Firestore: FirestoreConstructorLike;
}

export type FirestoreSdkLoader = () => unknown;

export interface ExternalAccountConfigLike {
  readonly type: 'external_account';
  readonly audience: string;
  readonly subject_token_type: 'urn:ietf:params:oauth:token-type:jwt';
  readonly token_url: 'https://sts.googleapis.com/v1/token';
  readonly service_account_impersonation_url: string;
  readonly subject_token_supplier: {
    getSubjectToken(): Promise<string>;
  };
}

export interface FirestoreVercelOidcDependencies {
  readonly createExternalAccountClient: (config: ExternalAccountConfigLike) => unknown | null;
  readonly createGoogleAuth: (options: {
    readonly projectId: string;
    readonly scopes: readonly string[];
    readonly authClient: unknown;
  }) => unknown;
  readonly getVercelOidcToken: (options: {
    readonly audience: string;
    readonly expirationBufferMs: number;
  }) => Promise<string>;
}

const FIRESTORE_PACKAGE_NAME = '@google-cloud/firestore';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const VERCEL_OIDC_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

const defaultFirestoreSdkLoader: FirestoreSdkLoader = () => ({ Firestore });

const defaultVercelOidcDependencies: FirestoreVercelOidcDependencies = {
  createExternalAccountClient(config) {
    return ExternalAccountClient.fromJSON(config as never);
  },
  createGoogleAuth(options) {
    return new GoogleAuth({
      projectId: options.projectId,
      scopes: [...options.scopes],
      authClient: options.authClient as never,
    });
  },
  getVercelOidcToken,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFirestoreSdkModule = (value: unknown): value is FirestoreSdkModuleLike =>
  isRecord(value) && typeof value.Firestore === 'function';

const parseEnabledFlag = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new Error('EDITORIAL_FIRESTORE_ENABLED_INVALID');
};

const required = (label: string, value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${label}_REQUIRED`);
  return normalized;
};

const resolveAuthMode = (value: string | undefined): EditorialFirestoreAuthMode => {
  const normalized = value?.trim().toUpperCase() || 'ADC';
  if (normalized === 'ADC' || normalized === 'VERCEL_OIDC') return normalized;
  throw new Error('EDITORIAL_FIRESTORE_AUTH_MODE_INVALID');
};

const assertPathSegment = (label: string, value: string): void => {
  if (!/^[a-z0-9-]+$/.test(value)) throw new Error(`${label}_INVALID`);
};

export interface EditorialFirestoreVercelOidcConfiguration {
  readonly projectNumber: string;
  readonly poolId: string;
  readonly providerId: string;
  readonly serviceAccountEmail: string;
  readonly audience: string;
  readonly oidcTokenAudience: string;
}

export const resolveEditorialFirestoreVercelOidcConfiguration = (
  environment: EditorialFirestoreEnvironment,
  projectId: string,
): EditorialFirestoreVercelOidcConfiguration => {
  const projectNumber = required(
    'EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER',
    environment.ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER,
  );
  if (!/^\d+$/.test(projectNumber)) throw new Error('EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER_INVALID');

  const poolId = required(
    'EDITORIAL_FIRESTORE_WIF_POOL_ID',
    environment.ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID,
  );
  assertPathSegment('EDITORIAL_FIRESTORE_WIF_POOL_ID', poolId);

  const providerId = required(
    'EDITORIAL_FIRESTORE_WIF_PROVIDER_ID',
    environment.ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID,
  );
  assertPathSegment('EDITORIAL_FIRESTORE_WIF_PROVIDER_ID', providerId);

  const serviceAccountEmail = required(
    'EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL',
    environment.ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL,
  );
  const expectedSuffix = `@${projectId}.iam.gserviceaccount.com`;
  if (!serviceAccountEmail.endsWith(expectedSuffix)) {
    throw new Error('EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_PROJECT_MISMATCH');
  }

  const providerResourcePath =
    `projects/${projectNumber}/locations/global/` +
    `workloadIdentityPools/${poolId}/providers/${providerId}`;
  const audience = `//iam.googleapis.com/${providerResourcePath}`;
  const oidcTokenAudience = `https://iam.googleapis.com/${providerResourcePath}`;

  return {
    projectNumber,
    poolId,
    providerId,
    serviceAccountEmail,
    audience,
    oidcTokenAudience,
  };
};

export const validateEditorialFirestoreAuthConfiguration = (
  environment: EditorialFirestoreEnvironment,
): void => {
  const projectId = required(
    'EDITORIAL_FIRESTORE_PROJECT_ID',
    environment.ORBI_EDITORIAL_FIRESTORE_PROJECT_ID,
  );
  const authMode = resolveAuthMode(environment.ORBI_EDITORIAL_FIRESTORE_AUTH_MODE);
  if (authMode === 'VERCEL_OIDC') {
    resolveEditorialFirestoreVercelOidcConfiguration(environment, projectId);
  }
};

const createVercelOidcAuth = (
  environment: EditorialFirestoreEnvironment,
  projectId: string,
  dependencies: FirestoreVercelOidcDependencies,
): unknown => {
  const { audience, oidcTokenAudience, serviceAccountEmail } =
    resolveEditorialFirestoreVercelOidcConfiguration(environment, projectId);

  const externalAccountClient = dependencies.createExternalAccountClient({
    type: 'external_account',
    audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url:
      'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/' +
      `${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => dependencies.getVercelOidcToken({
        audience: oidcTokenAudience,
        expirationBufferMs: VERCEL_OIDC_EXPIRATION_BUFFER_MS,
      }),
    },
  });

  if (!externalAccountClient) {
    throw new Error('EDITORIAL_FIRESTORE_VERCEL_OIDC_CLIENT_UNAVAILABLE');
  }

  return dependencies.createGoogleAuth({
    projectId,
    scopes: [FIRESTORE_SCOPE],
    authClient: externalAccountClient,
  });
};

export const createConfiguredFirestoreClient = (
  environment: EditorialFirestoreEnvironment,
  loader: FirestoreSdkLoader = defaultFirestoreSdkLoader,
  authDependencies: FirestoreVercelOidcDependencies = defaultVercelOidcDependencies,
): FirestoreClientLike | null => {
  if (!parseEnabledFlag(environment.ORBI_EDITORIAL_FIRESTORE_ENABLED)) return null;

  const projectId = environment.ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?.trim();
  if (!projectId) throw new Error('EDITORIAL_FIRESTORE_PROJECT_ID_REQUIRED');

  const databaseId = environment.ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?.trim();
  const authMode = resolveAuthMode(environment.ORBI_EDITORIAL_FIRESTORE_AUTH_MODE);

  let loaded: unknown;
  try {
    loaded = loader();
  } catch {
    throw new Error('EDITORIAL_FIRESTORE_SDK_NOT_INSTALLED');
  }

  if (!isFirestoreSdkModule(loaded)) {
    throw new Error('EDITORIAL_FIRESTORE_SDK_INVALID');
  }

  const auth = authMode === 'VERCEL_OIDC'
    ? createVercelOidcAuth(environment, projectId, authDependencies)
    : undefined;

  return new loaded.Firestore({
    projectId,
    ...(databaseId ? { databaseId } : {}),
    ignoreUndefinedProperties: true,
    ...(auth ? { auth } : {}),
  });
};

export const EDITORIAL_FIRESTORE_SERVER_SDK_PACKAGE = FIRESTORE_PACKAGE_NAME;
export const EDITORIAL_FIRESTORE_VERCEL_OIDC_SCOPE = FIRESTORE_SCOPE;
export const EDITORIAL_FIRESTORE_VERCEL_OIDC_EXPIRATION_BUFFER_MS = VERCEL_OIDC_EXPIRATION_BUFFER_MS;
