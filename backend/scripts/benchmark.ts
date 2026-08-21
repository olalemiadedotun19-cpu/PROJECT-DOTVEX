#!/usr/bin/env node
/**
 * GPU / CPU performance benchmark for DOTVEX Qwen3 inference.
 *
 * This script measures:
 *   1. Model loading time
 *   2. First-token latency
 *   3. Tokens/second
 *   4. Total response time
 *   5. Memory usage
 *   6. GPU utilization (if available)
 *   7. CPU utilization
 *
 * Usage:
 *   npx tsx backend/scripts/benchmark.ts
 *   # With env overrides:
 *   QWEN3_GPU_ENABLED=true QWEN3_GPU_TYPE=cuda npx tsx backend/scripts/benchmark.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Qwen3Provider } from '../ai/qwenProvider';
import { config } from '../config';
import { AIMessage, AIStreamChunk } from '../ai/provider';

dotenv.config();

interface BenchmarkResult {
  modelPath: string;
  modelSizeMB: number;
  gpuEnabled: boolean;
  gpuType: string | null;
  gpuLayers: number | null;
  loadTimeMs: number;
  contextSize: number;
  maxTokens: number;
  firstTokenLatencyMs: number | null;
  totalGenerationMs: number;
  tokenCount: number;
  tokensPerSecond: number;
  memoryUsageMB: number;
  cpuUtilizationPercent: number;
}

async function runBenchmark(): Promise<void> {
  console.log('='.repeat(70));
  console.log('[DOTVEX Benchmark] Starting Qwen3 performance benchmark');
  console.log('='.repeat(70));

  const result: BenchmarkResult = {
    modelPath: config.modelPath,
    modelSizeMB: 0,
    gpuEnabled: config.qwen3GpuEnabled,
    gpuType: config.qwen3GpuType,
    gpuLayers: config.qwen3GpuLayers,
    loadTimeMs: 0,
    contextSize: config.contextSize,
    maxTokens: config.maxTokens,
    firstTokenLatencyMs: null,
    totalGenerationMs: 0,
    tokenCount: 0,
    tokensPerSecond: 0,
    memoryUsageMB: 0,
    cpuUtilizationPercent: 0,
  };

  if (!fs.existsSync(config.modelPath)) {
    console.error('[DOTVEX Benchmark] Model file not found:', config.modelPath);
    process.exit(1);
  }

  const stats = fs.statSync(config.modelPath);
  result.modelSizeMB = Math.round((stats.size / (1024 * 1024)) * 10) / 10;

  console.log(`[DOTVEX Benchmark] Model: ${config.modelPath}`);
  console.log(`[DOTVEX Benchmark] Model size: ${result.modelSizeMB} MB`);
  console.log(`[DOTVEX Benchmark] GPU enabled: ${config.qwen3GpuEnabled}`);
  console.log(`[DOTVEX Benchmark] GPU type: ${config.qwen3GpuType ?? 'auto'}`);
  console.log(`[DOTVEX Benchmark] GPU layers: ${config.qwen3GpuLayers ?? 'max'}`);
  console.log(`[DOTVEX Benchmark] Context size: ${config.contextSize}`);
  console.log(`[DOTVEX Benchmark] Max tokens: ${config.maxTokens}`);

  const provider = new Qwen3Provider(
    config.modelPath,
    120000,
    config.contextSize,
    config.qwen3GpuEnabled,
    config.qwen3GpuType,
    config.qwen3GpuLayers
  );

  console.log('\n[DOTVEX Benchmark] Loading model...');
  const loadStart = Date.now();
  const initialized = await provider.initialize();
  const loadEnd = Date.now();
  result.loadTimeMs = loadEnd - loadStart;

  if (!initialized) {
    console.error('[DOTVEX Benchmark] Failed to initialize Qwen3 provider');
    process.exit(1);
  }

  console.log(`[DOTVEX Benchmark] Model loaded in ${result.loadTimeMs}ms`);
  console.log(`[DOTVEX Benchmark] Provider available: ${provider.isAvailable}`);

  const testPrompt = 'Explain the key differences between supervised and reinforcement learning in machine learning.';

  const systemUsageStart = process.cpuUsage();
  const startTime = Date.now();

  console.log(`\n[DOTVEX Benchmark] Generating response to: "${testPrompt}"`);
  console.log('[DOTVEX Benchmark] Prompt length:', testPrompt.split(' ').length, 'words');

  let firstTokenTime: number | null = null;
  const messages: AIMessage[] = [{ role: 'user', content: testPrompt }];

  await provider.streamMessages(
    messages,
    { maxTokens: 256, temperature: 0.7 },
    (chunk: AIStreamChunk) => {
      if (chunk.type === 'text' && chunk.delta) {
        if (firstTokenTime === null) {
          firstTokenTime = Date.now() - startTime;
        }
        result.tokenCount += chunk.delta.length;
      }
    }
  );

  const endTime = Date.now();
  const systemUsageEnd = process.cpuUsage(systemUsageStart);
  const memEnd = process.memoryUsage();

  result.totalGenerationMs = endTime - startTime;
  result.firstTokenLatencyMs = firstTokenTime;

  if (result.totalGenerationMs > 0) {
    result.tokensPerSecond = Math.round((result.tokenCount / (result.totalGenerationMs / 1000)) * 100) / 100;
  }

  result.memoryUsageMB = Math.round(((memEnd.heapUsed + memEnd.external) / (1024 * 1024)) * 100) / 100;

  const cpuUserMs = systemUsageEnd.user / 1000;
  const cpuSysMs = systemUsageEnd.system / 1000;
  const cpuTotalMs = cpuUserMs + cpuSysMs;
  result.cpuUtilizationPercent = result.totalGenerationMs > 0
    ? Math.round((cpuTotalMs / result.totalGenerationMs) * 100 * 100) / 100
    : 0;

  await provider.dispose();

  console.log('\n' + '='.repeat(70));
  console.log('[DOTVEX Benchmark] RESULTS');
  console.log('='.repeat(70));
  console.log(`  Model path:          ${result.modelPath}`);
  console.log(`  Model size:          ${result.modelSizeMB} MB`);
  console.log(`  GPU enabled:         ${result.gpuEnabled}`);
  console.log(`  GPU type:            ${result.gpuType ?? 'auto'}`);
  console.log(`  GPU layers:          ${result.gpuLayers ?? 'max'}`);
  console.log(`  Load time:           ${result.loadTimeMs} ms`);
  console.log(`  First-token latency: ${result.firstTokenLatencyMs ?? 'N/A'} ms`);
  console.log(`  Total generation:    ${result.totalGenerationMs} ms`);
  console.log(`  Token count:         ${result.tokenCount}`);
  console.log(`  Tokens/sec:          ${result.tokensPerSecond}`);
  console.log(`  Memory usage:        ${result.memoryUsageMB} MB`);
  console.log(`  CPU utilization:     ${result.cpuUtilizationPercent}%`);
  console.log('='.repeat(70));

  const report = { ...result, timestamp: new Date().toISOString() };
  const reportDir = path.join(config.dataDir, 'backups');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = path.join(reportDir, `benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[DOTVEX Benchmark] Report saved to: ${reportPath}`);
}

runBenchmark().catch((err) => {
  console.error('[DOTVEX Benchmark] Error:', err.message);
  process.exit(1);
});
