import test from 'node:test';
import assert from 'node:assert/strict';

import { ControlledActivationProfile, assessControlledActivationProfile } from '../../server/operations/controlled-activation-profile';
import { runControlledActivationPreflight } from '../../server/operations/controlled-activation-preflight';
import { resolveProductionRuntimeConfiguration } from '../../server/operations/production-runtime-config';

const TOKEN = '0123456789abcdef0123456789abcdef';
const source = {
  id: 'source-example', organizationId: 'orbi-ecosystem', name: 'Example Official', domain: 'example.com',
  homepageUrl: 'https://example.com/', feedUrl: 'https://example.com/rss.xml', sourceType: 'OFFICIAL',
  credibilityBand: 'HIGH', allowedOrigins: ['RSS'], categories: ['AI'], status: 'ACTIVE',
  isPrimaryPreferred: true, notes: null, createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z',
};
const env = () => ({
  NODE_ENV: 'production', ORBI_NEWS_ACTIVATION_PROFILE: 'DISCOVERY_ONLY', ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem', ORBI_NEWS_WORKER_ID: 'worker-a', ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1', ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true', ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY', ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
  ORBI_NEWS_SCHEDULER_TOKEN: TOKEN, ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([source]),
});

test('FULL GATE: disabled profile remains non-operational by default', () => {
  const runtime = resolveProductionRuntimeConfiguration({});
  const result = assessControlledActivationProfile({ profile: ControlledActivationProfile.DISABLED, runtime, authorityEnvironment: {} });
  assert.equal(runtime.enabled, false);
  assert.equal(result.ready, true);
});

test('FULL GATE: exact discovery-only production profile passes preflight', () => {
  const result = runControlledActivationPreflight(env());
  assert.equal(result.profile, ControlledActivationProfile.DISCOVERY_ONLY);
  assert.equal(result.ready, true);
  assert.equal(result.sourceCount, 1);
  assert.equal(result.rssSourceCount, 1);
  assert.deepEqual(result.reasons, []);
});

test('FULL GATE: publication toggle makes discovery-only activation fail closed', () => {
  const unsafe = { ...env(), ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_PUBLISH_WEB' };
  const result = runControlledActivationPreflight(unsafe);
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_FORBIDS_TOGGLE_AUTO_PUBLISH_WEB'));
});

test('FULL GATE: missing scheduler token or active RSS source prevents activation', () => {
  const noToken = { ...env(), ORBI_NEWS_SCHEDULER_TOKEN: undefined };
  assert.equal(runControlledActivationPreflight(noToken).ready, false);
  const noSources = { ...env(), ORBI_NEWS_SOURCE_REGISTRY_JSON: '[]' };
  const result = runControlledActivationPreflight(noSources);
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_ACTIVE_RSS_SOURCE_REQUIRED'));
});

test('FULL GATE: source organization mismatch prevents activation', () => {
  const mismatch = { ...source, organizationId: 'another-org' };
  const result = runControlledActivationPreflight({ ...env(), ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([mismatch]) });
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_SOURCE_ORGANIZATION_MISMATCH'));
});
