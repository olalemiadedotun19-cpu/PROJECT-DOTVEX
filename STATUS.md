# DOTVEX Qwen3 GPU Pipeline Status

## Architecture (final, in code)
- `backend/index.ts` switches provider by `QWEN3_INFERENCE_MODE`:
  - `local`  -> `Qwen3Provider` (node-llama-cpp, reads `QWEN3_MODEL_PATH`)
  - `remote` -> `RemoteQwen3Provider` (OpenAI-compatible `/v1/chat/completions`,
                Bearer `QWEN3_REMOTE_API_KEY`, base `QWEN3_REMOTE_URL`)
- Kaggle notebook `olalemiadedotun/dotvex-qwen3-gpu-v2` runs llama-cpp-python
  server on :8080 with `--api_key dotvex-qwen3-gpu-key` + cloudflared tunnel.
- `dotvex_remote.env` (when written) holds the remote-mode env vars.

## Completed
- Real NVIDIA GPU confirmed (Tesla P100-PCIE-16GB).
- llama-cpp-python installed w/ CUDA wheel on Kaggle.
- Qwen3-4B-Q4_K_M.gguf (2.33 GB) downloaded locally to project root AND on Kaggle.
- Server deps installed on Kaggle: starlette-context, fastapi, uvicorn, pydantic-settings.
- Kaggle token refresh works (refresh_token.cjs) -> `get_user_profile`,
  `get_accelerator_quota`, `get_notebook_info`, `get_notebook_session_status`,
  `list_notebook_session_output`, `save_notebook` all callable again.
- Local CPU smoke test: node-llama-cpp loads Qwen3-4B-Q4_K_M.gguf and generates
  (too slow for prod, but proves the model + provider pipeline).

## Current Blocker (Kaggle)
- 2 concurrent GPU notebook sessions are occupying the account limit:
  v23 (`olalemiadedotun/dotvex-qwen3-gpu-v2`, RUNNING, infinite keep-alive loop)
  + an orphaned `create_notebook_session` on the same slug from earlier.
- Cannot create v24 (save returns "Maximum batch GPU session count of 2 reached").
- `cancel_notebook_session` denied: `Permission 'kernelSessions.cancel' was denied`
  (OAuth scope `resources.admin:*` does NOT grant session cancel/download).
- `download_notebook_output` / `list_notebook_files` denied
  (`kernels.get` / `kernelSessions.get`), so v23's LIVE tunnel URL cannot be read.
  => v23's tunnel is up but its URL is unreachable from here.

## Fix Applied (automated)
- Wrote `save_v24.cjs`: same deploy notebook but with NO blocking infinite loop
  (detached server+tunnel via `start_new_session=True`); cell completes so the
  TUNNEL URL is captured in output and written to /kaggle/working/tunnel_url.txt.
- Wrote `deploy_automator.cjs` (running in background, id bgp_...):
  refreshes token, retries `save_v24` every 5 min until a GPU slot frees,
  then waits for COMPLETE, extracts the `*.trycloudflare.com` URL from output,
  and writes `dotvex_remote.env` (QWEN3_INFERENCE_MODE=remote + URL + API key).

## To finish manually (if automator can't)
1. Wait for the 2 GPU sessions to auto-terminate (~9-12h from their start).
   OR re-authorize Kaggle OAuth with scopes granting `kernelSessions.cancel`
   + `kernels.get`, then `cancel_notebook_session` to free the slot now.
2. Once a slot is free, save v24 (no loop) and read its output for the URL.
3. Set remote env: (already prepared by automator in dotvex_remote.env)
   QWEN3_INFERENCE_MODE=remote
   QWEN3_REMOTE_URL=<tunnel>
   QWEN3_REMOTE_API_KEY=dotvex-qwen3-gpu-key
4. `npm run dev` / `npm start` -> backend talks to the GPU tunnel.
