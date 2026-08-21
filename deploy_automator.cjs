const { execSync, exec } = require('child_process');
const fs = require('fs');

const TOKEN_PATH = 'C:/Users/USER/.mcp-auth/mcp-remote-0.1.37/47ccabe08d07cd744dec6a0ec36ffe48_tokens.json';
const SLUG = 'dotvex-qwen3-gpu-v2';
const USER = 'olalemiadedotun';
const REMOTE_ENV = 'C:/Users/USER/Downloads/dotvex/dotvex_remote.env';
const LOG = 'C:/Users/USER/Downloads/dotvex/deploy_automator.log';

function log(...a) { const m = `[${new Date().toISOString()}] ${a.join(' ')}`; console.log(m); fs.appendFileSync(LOG, m + '\n'); }
function sleep(s) { return new Promise(r => setTimeout(r, s * 1000)); }

function getToken() { return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')).access_token; }

function mcpCall(toolName, args) {
  const accessToken = getToken();
  const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: toolName, arguments: args } });
  return new Promise((resolve) => {
    const https = require('https');
    const req = https.request({ hostname: 'www.kaggle.com', path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + accessToken, 'Content-Length': Buffer.byteLength(data) } },
      (response) => { let body = ''; response.on('data', c => body += c); response.on('end', () => {
        const lines = body.split('\n');
        for (const l of lines) { if (l.startsWith('data: ')) { try { const j = JSON.parse(l.slice(6)); if (j.result) { resolve(j.result); return; } } catch (e) {} } }
        resolve({ raw: body }); }); });
    req.on('error', e => resolve({ error: e.message })); req.write(data); req.end();
  });
}

function refresh() {
  try { execSync('node refresh_token.cjs', { stdio: 'pipe', encoding: 'utf8' }); log('token refreshed'); }
  catch (e) { log('refresh failed:', e.message); }
}

function extractUrl(text) {
  const m = text && text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  return m ? m[0] : null;
}

async function waitForComplete(maxMin) {
  for (let i = 0; i < maxMin; i++) {
    try { refresh(); } catch (e) {}
    const r = await mcpCall('get_notebook_session_status', { request: { userName: USER, kernelSlug: SLUG } });
    const t = r && r.content ? r.content[0].text : JSON.stringify(r);
    if (t.includes('COMPLETE')) { log('notebook COMPLETE'); return true; }
    if (t.includes('ERROR') || t.includes('FAILED')) { log('notebook failed:', t); return false; }
    await sleep(60);
  }
  return false;
}

async function getOutput() {
  const r = await mcpCall('list_notebook_session_output', { request: { userName: USER, kernelSlug: SLUG } });
  const t = r && r.content ? r.content[0].text : JSON.stringify(r);
  return t;
}

async function attemptSave() {
  log('attempting save_v24...');
  let out = '';
  try { out = execSync('node save_v24.cjs', { encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { out = e.stdout || e.stderr || e.message || ''; }
  log('save output:', out.replace(/\n/g, ' ').slice(0, 300));
  if (out.includes('version_number')) return true;
  if (out.includes('Maximum batch GPU session')) { log('GPU slot full; will retry'); return 'full'; }
  if (out.includes('Unauthenticated')) { log('unauthenticated; refreshing'); return 'auth'; }
  return 'err';
}

(async () => {
  log('=== Deploy automator started ===');
  let deployed = false;
  for (let round = 0; round < 200 && !deployed; round++) {
    refresh();
    const res = await attemptSave();
    if (res === true) {
      log('save accepted; waiting for COMPLETE...');
      const ok = await waitForComplete(45);
      if (ok) {
        const out = await getOutput();
        const url = extractUrl(out);
        if (url) {
          fs.writeFileSync(REMOTE_ENV, [
            'QWEN3_INFERENCE_MODE=remote',
            `QWEN3_REMOTE_URL=${url}`,
            'QWEN3_REMOTE_API_KEY=dotvex-qwen3-gpu-key',
            'QWEN3_MODEL_PATH=Qwen3-4B-Q4_K_M.gguf',
            ''
          ].join('\n'));
          log('SUCCESS: tunnel URL captured ->', url);
          log('Wrote', REMOTE_ENV);
          deployed = true;
          break;
        } else {
          log('COMPLETE but no tunnel URL found in output. Will retry deploy.');
        }
      } else {
        log('did not reach COMPLETE in time. Will retry.');
      }
    } else if (res === 'full') {
      await sleep(300);
      continue;
    } else if (res === 'auth') {
      await sleep(120);
      continue;
    } else {
      await sleep(180);
      continue;
    }
    await sleep(60);
  }
  if (!deployed) log('Automator exhausted retries without capturing tunnel URL.');
  log('=== Deploy automator finished ===');
})();
