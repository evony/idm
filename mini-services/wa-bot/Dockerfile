# ============================================
# TARKAM WA Bot — Dockerfile for Railway v3
# ============================================
FROM node:22-slim

# Install git (needed by Baileys), OpenSSL, curl (health checks)
RUN apt-get update && apt-get install -y git openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN npm install 2>&1 && echo "✅ npm install completed"

# Copy source code
COPY . .

# Create local auth directory (fallback when no volume)
RUN mkdir -p /app/sessions

# Create /data directory for Railway Volume mount
RUN mkdir -p /data/auth_info_baileys

# Verify critical files exist
RUN echo "📂 Checking files..." && \
    ls -la src/ && \
    echo "✅ All critical files present"

# Railway sets PORT env var automatically
EXPOSE 3004

# Start with diagnostics
CMD ["sh", "-c", "echo '🚀 Starting IDM WA Bot v2.0...' && echo \"Node: $(node -v)\" && echo \"CWD: $(pwd)\" && echo \"PORT: $PORT\" && echo \"DATABASE_URL set: $([ -n \\\"$DATABASE_URL\\\" ] && echo YES || echo NO)\" && exec npx tsx src/index.ts"]
