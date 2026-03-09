FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/adapters/package.json ./packages/adapters/
RUN npm install --workspace=apps/api

# Generate Prisma client
FROM deps AS prisma
COPY packages/database ./packages/database/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build
FROM prisma AS builder
WORKDIR /app
COPY packages/adapters ./packages/adapters/
COPY apps/api ./apps/api/
COPY tsconfig.base.json ./
RUN npm run build -w apps/api

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY packages/database/prisma ./packages/database/prisma

EXPOSE 8080
CMD ["node", "apps/api/dist/main.js"]
