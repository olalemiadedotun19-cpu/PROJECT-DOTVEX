import path from 'path';
import fs from 'fs';

export interface ServerConfig {
  port: number;
  host: string;
  appUrl: string;
  nodeEnv: string;
  modelPath: string;
  contextSize: number;
  maxTokens: number;
  generationTimeoutMs: number;
  dataDir: string;
  dbPath: string;
  memoryRetrievalLimit: number;
  corsOrigin: string | string[];
  qwen3GpuEnabled: boolean;
  qwen3GpuType: 'cuda' | 'metal' | 'vulkan' | null;
  qwen3GpuLayers: number | null;
  apiKey: string | null;
  inferenceMode: 'local' | 'remote';
  remoteInferenceUrl: string | null;
  remoteInferenceApiKey: string | null;
}

function getConfig(): ServerConfig {
  const dataDir =
    process.env.DOTVEX_DATA_DIR ||
    process.env.DATABASE_PATH ||
    path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath =
    process.env.DATABASE_PATH ||
    path.join(dataDir, 'dotvex.db');

  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : '*';

  const gpuEnabled = process.env.QWEN3_GPU_ENABLED === 'true';
  const gpuType = process.env.QWEN3_GPU_TYPE as 'cuda' | 'metal' | 'vulkan' | undefined;
  const gpuLayersStr = process.env.QWEN3_GPU_LAYERS;
  const apiKey = process.env.API_KEY || null;
  const inferenceMode = (process.env.QWEN3_INFERENCE_MODE as 'local' | 'remote') || 'local';
  const remoteInferenceUrl = process.env.QWEN3_REMOTE_URL || null;
  const remoteInferenceApiKey = process.env.QWEN3_REMOTE_API_KEY || null;

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    modelPath:
      process.env.QWEN_MODEL_PATH ||
      process.env.QWEN3_MODEL_PATH ||
      path.resolve(process.cwd(), 'Qwen3-4B-Q4_K_M.gguf'),
    contextSize: parseInt(process.env.QWEN3_CONTEXT_SIZE || '2048', 10),
    maxTokens: parseInt(process.env.QWEN3_MAX_TOKENS || '4096', 10),
    generationTimeoutMs: parseInt(process.env.GENERATION_TIMEOUT_MS || '900000', 10),
    dataDir,
    dbPath,
    memoryRetrievalLimit: parseInt(process.env.MEMORY_RETRIEVAL_LIMIT || '5', 10),
    corsOrigin,
    qwen3GpuEnabled: gpuEnabled,
    qwen3GpuType: gpuEnabled && gpuType ? gpuType : null,
    qwen3GpuLayers: gpuLayersStr ? parseInt(gpuLayersStr, 10) : null,
    apiKey,
    inferenceMode,
    remoteInferenceUrl,
    remoteInferenceApiKey,
  };
}

export const config = getConfig();
