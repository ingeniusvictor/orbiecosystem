import express from 'express';
import dotenv from 'dotenv';
import { mountControlledDiscoveryRuntimeIfConfigured } from './server/operations/controlled-discovery-mount';
import { runControlledActivationPreflight } from './server/operations/controlled-activation-preflight';

dotenv.config();

export const createOrbiNewsRuntimeApp = (environment: NodeJS.ProcessEnv = process.env) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/healthz', (_req, res) => {
    try {
      const preflight = runControlledActivationPreflight(environment);
      res.status(preflight.ready || preflight.profile === 'DISABLED' ? 200 : 503).json({
        service: 'orbi-news-runtime',
        activationProfile: preflight.profile,
        ready: preflight.ready,
        sourceCount: preflight.sourceCount,
        rssSourceCount: preflight.rssSourceCount,
        reasons: preflight.reasons,
      });
    } catch (error) {
      res.status(503).json({
        service: 'orbi-news-runtime',
        ready: false,
        reasons: [error instanceof Error ? error.message : 'RUNTIME_PREFLIGHT_FAILED'],
      });
    }
  });

  mountControlledDiscoveryRuntimeIfConfigured(app, environment);
  return app;
};

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 8080;
  const app = createOrbiNewsRuntimeApp(process.env);
  app.listen(port, '0.0.0.0', () => {
    console.log(`ORBI News runtime listening on port ${port}`);
  });
}
