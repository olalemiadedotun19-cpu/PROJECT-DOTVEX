FROM node:24 AS base

WORKDIR /app

# Install Python and build tools for native dependencies (node-llama-cpp)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ curl wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ——————————————————————
# CPU-only Builder layer
# ——————————————————————
FROM base AS builder-cpu

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Install node-llama-cpp CPU build
RUN npx node-llama-cpp install --cdyes 2>/dev/null || true

# Build the frontend and backend
RUN npm run build

# ——————————————————————
# GPU (CUDA) Builder layer
# ——————————————————————
FROM nvidia/cuda:12.6.1-devel-ubuntu22.04 AS builder-gpu

# Install Node.js on CUDA base
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=24
RUN mkdir -p /usr/local/nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
SHELL ["/bin/bash", "-c"]
ENV NVM_DIR=/usr/local/nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install $NODE_VERSION && nvm use $NODE_VERSION && nvm alias default $NODE_VERSION && node --version && npm --version

WORKDIR /app

# Install build tools for node-llama-cpp CUDA build
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ curl wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder-gpu /usr/local/nvm/nvm.sh "$NVM_DIR/nvm.sh"
ENV PATH="/usr/local/nvm/versions/node/v${NODE_VERSION}/bin:${PATH}"

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Install node-llama-cpp with CUDA GPU support
# This compiles llama.cpp with CUDA backend via npm preinstall scripts
RUN npx node-llama-cpp install --gpu cuda 2>/dev/null || true

# Build the frontend and backend
RUN npm run build

# ——————————————————————
# CPU Runtime layer
# ——————————————————————
FROM base AS runtime-cpu

ENV NODE_ENV=production

# Copy node_modules (runtime-only dependencies)
COPY --from=builder-cpu /app/node_modules ./node_modules
COPY --from=builder-cpu /app/dist ./dist

COPY --from=builder-cpu /app/backend ./backend
COPY --from=builder-cpu /app/server.ts ./server.ts
COPY --from=builder-cpu /app/package.json ./package.json
COPY --from=builder-cpu /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /data /models

ENV PORT=3000
ENV HOST=0.0.0.0
ENV DOTVEX_DATA_DIR=/data
ENV DATABASE_PATH=/data/dotvex.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]

# ——————————————————————
# GPU Runtime layer
# ——————————————————————
FROM builder-gpu AS runtime-gpu

ENV NODE_ENV=production
ENV PATH="/usr/local/nvm/versions/node/v24/bin:${PATH}"

# Copy node_modules (includes CUDA-enabled llama.cpp bindings)
COPY --from=builder-gpu /app/node_modules ./node_modules
COPY --from=builder-gpu /app/dist ./dist

COPY --from=builder-gpu /app/backend ./backend
COPY --from=builder-gpu /app/server.ts ./server.ts
COPY --from=builder-gpu /app/package.json ./package.json
COPY --from=builder-gpu /app/tsconfig.json ./tsconfig.json

# Copy CUDA runtime libraries needed by llama.cpp GPU binaries
RUN apt-get update && \
    apt-get install -y --no-install-recommends libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /data /models

ENV PORT=3000
ENV HOST=0.0.0.0
ENV DOTVEX_DATA_DIR=/data
ENV DATABASE_PATH=/data/dotvex.db
ENV QWEN3_GPU_ENABLED=true
ENV QWEN3_GPU_TYPE=cuda

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
