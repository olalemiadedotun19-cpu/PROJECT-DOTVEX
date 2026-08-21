import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createApp, shutdown, config } from './backend/index';
import { aiService } from './backend/services/aiService';

dotenv.config();

async function startServer() {
  const app = await createApp();

  let server: any;

  if (config.nodeEnv !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err: any) {
      console.error('[DOTVEX] Vite dev server middleware failed to start:', err.message);
      console.log('[DOTVEX] Continuing without Vite middleware (production static files only).');
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server = app.listen(config.port, config.host, () => {
    console.log('[DOTVEX Server] Core listening on port ' + config.port + ' (' + config.host + ':' + config.port + ')');
    console.log('[DOTVEX Server] Provider: ' + (aiService.getProviderName() ?? 'none'));
    console.log('[DOTVEX Server] Model available: ' + aiService.isModelAvailable());
    console.log('[DOTVEX Server] CORS origins: ' + (Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin));
    console.log('[DOTVEX Server] Database: ' + config.dbPath);
    console.log('[DOTVEX Server] Environment: ' + config.nodeEnv);
  });

  process.on('SIGTERM', () => {
    console.log('[DOTVEX] SIGTERM received, initiating graceful shutdown...');
    shutdown();
  });

  process.on('SIGINT', () => {
    console.log('[DOTVEX] SIGINT received, initiating graceful shutdown...');
    shutdown();
  });

  process.on('uncaughtException', (err) => {
    console.error('[DOTVEX] Uncaught exception:', err.message || err);
    shutdown();
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('[DOTVEX] Unhandled rejection:', reason?.message || reason);
  });
}

startServer().catch((err) => {
  console.error('[DOTVEX] Fatal error during server startup:', err);
  process.exit(1);
});
