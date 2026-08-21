const path = require('path');
const { getLlama, LlamaChatSession } = require('node-llama-cpp');

(async () => {
  console.log('Loading llama backend...');
  const llama = await getLlama();
  console.log('llama loaded. Loading model...');
  const model = await llama.loadModel({
    modelPath: path.resolve('Qwen3-4B-Q4_K_M.gguf'),
    gpuLayers: 0,
  });
  console.log('Model loaded. Creating context...');
  const context = await model.createContext({ contextSize: 2048 });
  const session = new LlamaChatSession({ contextSequence: context.getSequence() });
  console.log('Generating...');
  const start = Date.now();
  const res = await session.prompt('What GPU are you? Reply in one short sentence.', { maxTokens: 64 });
  const dt = ((Date.now() - start) / 1000).toFixed(1);
  console.log('REPLY:', res);
  console.log(`Time: ${dt}s`);
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
