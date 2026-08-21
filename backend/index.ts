import express from 'express';
import cors from 'cors';
import { config } from './config';
import { apiRouter } from './routes/api';
import { healthHandler } from './controllers/healthController';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, requestSizeLimiter } from './middleware/security';
import { rateLimit } from './middleware/rateLimit';
import { conditionalApiKeyAuth } from './middleware/auth';
import { Qwen3Provider } from './ai/qwenProvider';
import { RemoteQwen3Provider } from './ai/remoteQwenProvider';
import { aiService } from './services/aiService';
import { initializeDatabase, closeDatabase } from './database';
import { logger } from './utils/logger';

let server: any = null;
let qwen3Provider: any = null;

export async function createApp(): Promise<express.Express> {
  const app = express();

  app.use(securityHeaders);

  const corsOptions: cors.CorsOptions = {
    origin: config.corsOrigin,
    credentials: true,
  };
  app.use(cors(corsOptions));

  app.use(requestSizeLimiter(10));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/api/chat', rateLimit('chat'));
  app.use('/api/memories', rateLimit('memory'));

  // Health check endpoint is exempt from auth (for load balancer probes)
  app.get('/api/health', healthHandler);

  app.use('/api', conditionalApiKeyAuth);

  app.use('/api', apiRouter);

  app.use(errorHandler);

  initializeDatabase();
  await initializeProviders();

  return app;
}

async function initializeProviders(): Promise<void> {
  try {
    if (config.inferenceMode === 'remote' && config.remoteInferenceUrl) {
      console.log('[DOTVEX] Using remote inference mode');
      console.log('[DOTVEX] Remote URL:', config.remoteInferenceUrl);

      const provider = new RemoteQwen3Provider(
        config.remoteInferenceUrl,
        config.remoteInferenceApiKey,
        'Qwen3-4B-Q4_K_M',
        config.generationTimeoutMs
      );
      await provider.initialize();

      aiService.setProvider(provider);
      qwen3Provider = provider;
      globalThis.__qwen3Provider = provider;

      console.log('[DOTVEX] Remote Qwen3 provider registered as active AI provider');
      console.log('[DOTVEX] Inference mode: remote');
      console.log('[DOTVEX] CORS origins:', Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin);
      console.log('[DOTVEX] API auth:', config.apiKey ? 'enabled' : 'disabled');
    } else {
      const provider = new Qwen3Provider(
        config.modelPath,
        config.generationTimeoutMs,
        config.contextSize,
        config.qwen3GpuEnabled,
        config.qwen3GpuType,
        config.qwen3GpuLayers
      );
      const initialized = await provider.initialize();

      aiService.setProvider(provider);

      if (initialized) {
        qwen3Provider = provider;
        globalThis.__qwen3Provider = provider;
        console.log('[DOTVEX] Qwen3 registered as active AI provider');
        console.log('[DOTVEX] Model path:', config.modelPath);
        console.log('[DOTVEX] Context size:', config.contextSize);
        console.log('[DOTVEX] Generation timeout:', config.generationTimeoutMs, 'ms');
        console.log('[DOTVEX] GPU:', config.qwen3GpuEnabled ? (config.qwen3GpuType || 'auto') : 'disabled (CPU)');
        console.log('[DOTVEX] GPU layers:', config.qwen3GpuLayers ?? 'max');
        console.log('[DOTVEX] CORS origins:', Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin);
        console.log('[DOTVEX] API auth:', config.apiKey ? 'enabled' : 'disabled');
      } else {
        console.log('[DOTVEX] Qwen3 provider not available. AI endpoints will return 503.');
      }
    }
  } catch (err: any) {
    console.error('[DOTVEX] Qwen3 provider initialization failed:', err.message);
    console.log('[DOTVEX] Qwen3 provider not available. AI endpoints will return 503.');
  }
}

export async function shutdown(): Promise<void> {
  console.log('[DOTVEX] Shutting down gracefully...');

  try {
    if (globalThis.__qwen3Provider) {
      await globalThis.__qwen3Provider.dispose();
    }
  } catch (err: any) {
    console.error('[DOTVEX] Error disposing Qwen3 provider:', err.message);
  }

  try {
    closeDatabase();
    console.log('[DOTVEX] Database closed');
  } catch (err: any) {
    console.error('[DOTVEX] Error closing database:', err.message);
  }

  if (server) {
    server.close(() => {
      console.log('[DOTVEX] Server stopped');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[DOTVEX] Force shutting down after timeout');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
}

export { config };
export { closeDatabase };