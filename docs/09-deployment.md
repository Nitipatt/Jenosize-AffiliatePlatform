# 09 — Deployment Guide

## 1. Deployment Architecture

```mermaid
graph LR
    subgraph Local["🖥️ Local Development"]
        DEV_WEB[Next.js Dev Server<br/>:3000]
        DEV_API[NestJS Dev Server<br/>:8080]
        DEV_PG[(PostgreSQL<br/>:5555)]
        DEV_REDIS[(Redis<br/>:6379)]
    end

    subgraph Docker["🐳 Docker Compose"]
        WEB[Web Container<br/>:3000]
        API[API Container<br/>:8080]
        PG[(PostgreSQL<br/>:5432)]
        REDIS[(Redis<br/>:6379)]
    end

    subgraph CI["🔄 GitHub Actions"]
        LINT[Lint]
        TEST[Unit Tests]
        E2E[E2E Tests]
        BUILD[Build]
    end
```

---

## 2. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime |
| npm | ≥ 10 | Package manager |
| Docker | ≥ 24 | Container runtime |
| Docker Compose | ≥ 2.20 | Multi-container orchestration |
| Git | ≥ 2.40 | Version control |

---

## 3. Local Development Setup

### Step 1: Clone & Install

```bash
git clone https://github.com/Nitipatt/Jenosize-AffiliatePlatform.git
cd Jenosize-AffiliatePlatform
cp .env.example .env
npm install
```

### Step 2: Start Infrastructure

```bash
docker compose -f infra/docker-compose.yml up postgres redis -d
```

This starts:
- **PostgreSQL** on port `5555` (mapped to internal `5432`)
- **Redis** on port `6379`

### Step 3: Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Optional: seed sample data
npm run db:seed
```

### Step 4: Start Development Servers

```bash
# Terminal 1 — API (http://localhost:8080)
npm run dev:api

# Terminal 2 — Web (http://localhost:3000)
npm run dev:web
```

### Step 5: Access

| Service | URL |
|---------|-----|
| Public Site | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin/dashboard |
| API Swagger | http://localhost:8080/api/docs |

---

## 4. Docker Compose Deployment

### Full-Stack (All Services)

```bash
docker compose -f infra/docker-compose.yml up --build
```

This starts 4 containers:

| Service | Container Name | Port | Image |
|---------|---------------|------|-------|
| PostgreSQL | `affiliate-postgres` | 5555 | `postgres:16-alpine` |
| Redis | `affiliate-redis` | 6379 | `redis:7-alpine` |
| API | `affiliate-api` | 8080 | Custom (NestJS) |
| Web | `affiliate-web` | 3000 | Custom (Next.js) |

### Health Checks

Both PostgreSQL and Redis have built-in health checks:
- PostgreSQL: `pg_isready -U postgres`
- Redis: `redis-cli ping`

The API service waits for both to be healthy before starting.

---

## 5. Environment Variables

### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:12345@localhost:5555/aff?schema=public` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_ACCESS_SECRET` | `your-access-secret` | JWT access token signing key |
| `JWT_REFRESH_SECRET` | `your-refresh-secret` | JWT refresh token signing key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `8080` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | API URL for frontend |

---

## 6. Docker Images

### API Dockerfile (`apps/api/Dockerfile`)

```
Multi-stage build:
1. Builder stage: Install deps, generate Prisma, build TypeScript
2. Production stage: Copy built artifacts, run with node
```

### Web Dockerfile (`apps/web/Dockerfile`)

```
Multi-stage build:
1. Builder stage: Install deps, build Next.js
2. Production stage: Copy .next output, run with node
```

---

## 7. Database Migrations

Migrations are managed by Prisma and stored in `packages/database/prisma/migrations/`.

```bash
# Create a new migration after schema changes
npm run db:migrate -- --name description_of_change

# Apply pending migrations
npm run db:migrate

# Reset database (⚠️ destructive)
npx prisma migrate reset --schema packages/database/prisma/schema.prisma
```

---

## 8. CI/CD Pipeline

See [10-testing.md](./10-testing.md) for the full GitHub Actions pipeline configuration.

```mermaid
graph LR
    PUSH[Git Push] --> CI[GitHub Actions]
    CI --> LINT[Lint Adapters]
    LINT --> UNIT[Unit Tests]
    UNIT --> E2E[E2E Tests]
    E2E --> BUILD_WEB[Build Web]
    BUILD_WEB --> DONE([Pipeline Complete ✅])
```
