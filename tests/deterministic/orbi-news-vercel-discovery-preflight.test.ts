import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVercelDiscoveryPreflightReport,
  resolvePreflightEnvironmentFile,
} from '../../scripts/orbi-news-vercel-discovery-preflight';

const sourceRegistry = JSON.stringify([
  {
    id: 'source-openai-news',
    organizationId: 'orbi-ecosystem-staging',
    name: 'OpenAI News',
    domain: 'openai.com',
    homepageUrl: 'https://openai.com/news/',
    feedUrl: 'https://openai.com/news/rss.xml',
    sourceType: 'OFFICIAL',
    credibilityBand: 'AUTHORITATIVE',
    allowedOrigins: ['RSS'],
    categories: ['AI', 'TECH', 'SOFTWARE'],
    status: 'ACTIVE',
    isPrimaryPreferred: true,
    notes: 'fixture',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  },
]);

const validEnvironment = {
  NODE_ENV: 'production',
  ORBI_NEWS_ACTIVATION_PROFILE: 'DISCOVERY_ONLY',
  ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem-staging',
  ORBI_NEWS_WORKER_ID: 'vercel-staging',
  ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1',
  ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY',
  ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
  ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
  ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-staging-project',
  ORBI_EDITORIAL_FIRESTORE_DATABASE_ID: 'orbi-news-staging',
  ORBI_EDITORIAL_FIRESTORE_AUTH_MODE: 'VERCEL_OIDC',
  ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER: '1028562296104',
  ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID: 'orbi-vercel',
  ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID: 'orbi-news-preview',
  ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL:
    'orbi-news-vercel@orbi-staging-project.iam.gserviceaccount.com',
  ORBI_NEWS_SOURCE_REGISTRY_JSON: sourceRegistry,
  CRON_SECRET: 'c'.repeat(40),
};

test('Vercel discovery preflight report is ready for the exact discovery-only profile', () => {
  const report = buildVercelDiscoveryPreflightReport(validEnvironment);

  assert.equal(report.ready, true);
  assert.equal(report.stage, 'DISCOVERY_ONLY');
  assert.equal(report.profile, 'DISCOVERY_ONLY');
  assert.equal(report.sourceCount, 1);
  assert.equal(report.rssSourceCount, 1);
  assert.deepEqual(report.reasons, []);
  assert.equal(report.fatalError, null);
  assert.equal(report.configurationPresent.firestoreDatabaseId, true);
  assert.equal(report.configurationPresent.firestoreAuthMode, true);
  assert.equal(report.configurationPresent.firestoreGcpProjectNumber, true);
  assert.equal(report.configurationPresent.firestoreWifPoolId, true);
  assert.equal(report.configurationPresent.firestoreWifProviderId, true);
  assert.equal(report.configurationPresent.firestoreServiceAccountEmail, true);
  assert.equal(report.configurationPresent.cronSecret, true);
  assert.equal(report.configurationPresent.sourceRegistry, true);
});

test('Vercel discovery preflight report fails closed when CRON_SECRET is absent', () => {
  const environment = { ...validEnvironment, CRON_SECRET: undefined };
  const report = buildVercelDiscoveryPreflightReport(environment);

  assert.equal(report.ready, false);
  assert.ok(report.reasons.includes('VERCEL_DISCOVERY_CRON_SECRET_REQUIRED'));
  assert.equal(report.configurationPresent.cronSecret, false);
});

test('Vercel discovery preflight fails closed when keyless Firestore identity metadata is incomplete', () => {
  const environment = {
    ...validEnvironment,
    ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID: undefined,
  };
  const report = buildVercelDiscoveryPreflightReport(environment);

  assert.equal(report.ready, false);
  assert.ok(report.reasons.includes('VERCEL_DISCOVERY_FIRESTORE_AUTH_CONFIGURATION_INVALID'));
  assert.equal(report.configurationPresent.firestoreWifProviderId, false);
});

test('Vercel discovery preflight requires the Vercel OIDC Firestore auth mode', () => {
  const environment = {
    ...validEnvironment,
    ORBI_EDITORIAL_FIRESTORE_AUTH_MODE: 'ADC',
  };
  const report = buildVercelDiscoveryPreflightReport(environment);

  assert.equal(report.ready, false);
  assert.ok(report.reasons.includes('VERCEL_DISCOVERY_FIRESTORE_VERCEL_OIDC_REQUIRED'));
  assert.equal(report.configurationPresent.firestoreAuthMode, false);
});

test('Vercel discovery preflight report never emits configured secret or source-registry payload values', () => {
  const report = buildVercelDiscoveryPreflightReport(validEnvironment);
  const serialized = JSON.stringify(report);

  assert.doesNotMatch(serialized, /cccccccccccccccccccccccccccccccccccccccc/);
  assert.doesNotMatch(serialized, /openai\.com\/news\/rss\.xml/);
  assert.doesNotMatch(serialized, /orbi-staging-project/);
});

test('Vercel discovery preflight report converts invalid configuration into a fail-closed report', () => {
  const report = buildVercelDiscoveryPreflightReport({
    ...validEnvironment,
    ORBI_NEWS_ACTIVATION_PROFILE: 'NOT_A_PROFILE',
  });

  assert.equal(report.ready, false);
  assert.deepEqual(report.reasons, ['VERCEL_DISCOVERY_PREFLIGHT_EXCEPTION']);
  assert.equal(report.fatalError, 'ORBI_NEWS_ACTIVATION_PROFILE_INVALID');
});

test('staging preflight uses a dedicated local env file by default and allows an explicit override', () => {
  assert.equal(resolvePreflightEnvironmentFile({}), '.env.staging.local');
  assert.equal(
    resolvePreflightEnvironmentFile({ ORBI_NEWS_PREFLIGHT_ENV_FILE: ' C:/tmp/orbi-news.env ' }),
    'C:/tmp/orbi-news.env',
  );
});
