#!/bin/bash
# Test script: verify the Kaggle llama.cpp server is working
# Run this AFTER start_server() in the Kaggle notebook

set -e

TUNNEL_URL="${1:-http://127.0.0.1:8000}"
API_KEY="${2:-}"

echo "=== DOTVEX Kaggle Inference Server Test ==="
echo "URL: $TUNNEL_URL"
echo ""

# 1. Health check
echo "[1/4] Health check..."
if [ -n "$API_KEY" ]; then
    HEALTH=$(curl -s -H "Authorization: Bearer $API_KEY" "$TUNNEL_URL/health")
else
    HEALTH=$(curl -s "$TUNNEL_URL/health")
fi
echo "$HEALTH"
echo ""

# 2. Models endpoint
echo "[2/4] Available models..."
if [ -n "$API_KEY" ]; then
    MODELS=$(curl -s -H "Authorization: Bearer $API_KEY" "$TUNNEL_URL/v1/models")
else
    MODELS=$(curl -s "$TUNNEL_URL/v1/models")
fi
echo "$MODELS"
echo ""

# 3. Chat completion (non-streaming)
echo "[3/4] Chat completion test..."
AUTH_HEADER=""
if [ -n "$API_KEY" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $API_KEY\""
fi

eval curl -s "$TUNNEL_URL/v1/chat/completions" \
    -H "Content-Type: application/json" \
    $AUTH_HEADER \
    -d '{
        "model": "Qwen3",
        "messages": [
            {"role": "system", "content": "You are DOTVEX, an AI assistant created by Dotman."},
            {"role": "user", "content": "Explain the difference between RAM and disk storage in one sentence."}
        ],
        "max_tokens": 128,
        "temperature": 0.7
    }' | python3 -m json.tool

echo ""
echo "[4/4] Test complete."
