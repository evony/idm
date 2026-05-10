# ============================================
# TARKAM WA Bot — Dockerfile for Railway v3
# ============================================
FROM node:20-slim

# Install git (needed by Baileys), OpenSSL (needed by Prisma), curl (health checks)
RUN apt-get update && apt-get install -y git openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json package-lock.json* ./

# Copy prisma schema (needed for prisma generate)
COPY prisma ./prisma/

# Install dependencies
RUN npm install 2>&1 && echo "✅ npm install completed"

# Copy source code
COPY . .

# Ensure prisma client is generated (idempotent)
RUN npx prisma generate 2>&1 && echo "✅ prisma generate completed"

# Create local auth directory (fallback when no volume)
RUN mkdir -p /app/auth_info_baileys

# Create /data directory for Railway Volume mount
# If a volume is mounted at /data, it will override this
RUN mkdir -p /data/auth_info_baileys

# Verify critical files exist
RUN echo "📂 Checking files..." && \
    ls -la index.ts && \
    ls -la lib/ && \
    ls -la prisma/ && \
    echo "✅ All critical files present"

# Railway sets PORT env var automatically
EXPOSE 3004

# Start with diagnostics — v1.6 with explicit npx tsx
CMD ["sh", "-c", "echo '🚀 Starting IDM WA Bot v1.6...' && echo \"Node: $(node -v)\" && echo \"CWD: $(pwd)\" && echo \"PORT: $PORT\" && echo \"DATABASE_URL set: $([ -n \\\"$DATABASE_URL\\\" ] && echo YES || echo NO)\" && echo \"Volume /data: $([ -d /data ] && echo EXISTS || echo MISSING)\" && ls -la /data/ 2>/dev/null && exec npx tsx index.ts"]
