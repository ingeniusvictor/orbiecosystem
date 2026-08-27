import test from 'node:test';
import assert from 'node:assert/strict';

import { ControlledActivationProfile, assessControlledActivationProfile } from '../../server/operations/controlled-activation-profile';
import { resolveProductionRuntimeConfiguration } from '../../server/operations/production-runtime-config';

const discoveryEnv = () => ({
  NODE_ENV: 'production',
  ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
  ORBI_NEWS_WORKER_ID: 'worker-a',
  ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1',
  ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
  ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY',
  ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
});

test('DISABLED profile is ready only while runtime remains disabled', () => {
  const disabled = resolveProductionRuntimeConfiguration({});
  assert.equal(assessControlledActivationProfile({ profile: ControlledActivationProfile.DISABLED, runtime: disabled, authorityEnvironment: {} }).ready, true);

  const enabled = resolveProductionRuntimeConfiguration(discoveryEnv());
  assert.equal(assessControlledActivationProfile({ profile: ControlledActivationProfile.DISABLED, runtime: enabled, authorityEnvironment: discoveryEnv() }).ready, false);
});

test('DISCOVERY_ONLY accepts exactly LEVEL_1, AUTO_DISCOVERY and NEWS_DISCOVERY', () => {
  const env = discoveryEnv();
  const runtime = resolveProductionRuntimeConfiguration(env);
  const result = assessControlledActivationProfile({ profile: ControlledActivationProfile.DISCOVERY_ONLY, runtime, authorityEnvironment: env });
  assert.equal(result.ready, true);
  assert.deepEqual(result.reasons, []);
});

test('DISCOVERY_ONLY rejects higher autonomy and any additional toggle/capability', () => {
  const env = {
    ...discoveryEnv(),
    ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_5',
    ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_PUBLISH_WEB',
    ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY,PUBLIC_NEWS_PORTAL',
  };
  const runtime = resolveProductionRuntimeConfiguration(env);
  const result = assessControlledActivationProfile({ profile: ControlledActivationProfile.DISCOVERY_ONLY, runtime, authorityEnvironment: env });
  assert.equal(result.ready, false);
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_AUTONOMY_MUST_EQUAL_LEVEL_1'));
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_FORBIDS_TOGGLE_AUTO_PUBLISH_WEB'));
  assert.ok(result.reasons.includes('DISCOVERY_ONLY_FORBIDS_CAPABILITY_PUBLIC_NEWS_PORTAL'));
});
