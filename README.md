# Jenosize Affiliate Platform

> Affiliate web app for promotion & marketplace price comparison (Lazada / Shopee).

---

## 🌐 Live Demo

| | URL |
|---|---|
| **Public Site** | [https://jenosize-affiliate-platform-web-sigma.vercel.app](https://jenosize-affiliate-platform-web-sigma.vercel.app) |
| **Admin Panel** | [https://jenosize-affiliate-platform-web-sigma.vercel.app/admin](https://jenosize-affiliate-platform-web-sigma.vercel.app/admin) |

**Admin Access:**
- Username: `admin`
- Password: `password123`

**Sample Data:**
- 🎯 Sample Campaign: **"Summer Deal 2025"**
- 🛒 Test Product: **Shopee vs Lazada Matcha Powder**

### 🎬 Demo Video

https://github.com/Nitipatt/Jenosize-AffiliatePlatform/blob/main/Demo.mp4
<video src="https://github.com/Nitipatt/Jenosize-AffiliatePlatform/blob/main/Demo.mp4" controls width="100%"></video>

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph Client["🌐 Client"]
        BROWSER[Web Browser]
    end

    subgraph Vercel["☁️ Vercel"]
        FRONTEND["🖥️ Next.js 15<br/>App Router + SSR"]
    end

    subgraph VPS["🖥️ Backend Server"]
        subgraph API["⚡ NestJS API"]
            AUTH[Auth Module<br/>JWT + Cookies]
            PROD[Products Module<br/>CRUD + Scraping]
            CAMP[Campaigns Module<br/>CRUD + UTM]
            LINK[Links Module<br/>Short Code Gen]
            REDIR[Redirect Module<br/>302 + Click Queue]
            DASH[Dashboard Module<br/>Analytics]
            GUARD[Auth Guard]
        end

        subgraph Worker["🔄 Background Workers"]
            CLICK[Click Processor<br/>BullMQ Consumer]
            CRON[Price Refresh<br/>Daily Cron]
        end
    end

    subgraph Adapters["🔌 Marketplace Adapters"]
        IFACE[MarketplaceAdapter Interface]
        SHOPEE[ShopeeAdapter<br/>HTML + JSON-LD]
        LAZADA[LazadaAdapter<br/>HTML + JSON-LD]
    end

    subgraph Infra["🗄️ Infrastructure"]
        PG[(PostgreSQL 16)]
        REDIS[(Redis 7<br/>Cache + Queue + Sessions)]
    end

    BROWSER --> FRONTEND
    FRONTEND -->|REST API| API
    GUARD -.->|Protects| PROD
    GUARD -.->|Protects| CAMP
    GUARD -.->|Protects| LINK
    GUARD -.->|Protects| DASH
    PROD -->|Scrape| IFACE
    IFACE --> SHOPEE
    IFACE --> LAZADA
    CRON -->|Re-scrape| IFACE
    REDIR -->|Cache Read| REDIS
    REDIR -->|Queue Click| REDIS
    CLICK -->|Batch Insert| PG
    AUTH -->|Store Refresh Token| REDIS
    API -->|Prisma ORM| PG
    LINK -->|Pre-warm Cache| REDIS
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/Nitipatt/Jenosize-AffiliatePlatform.git
cd Jenosize-AffiliatePlatform
cp .env.example .env
npm install
```

### 2. Start Infrastructure
```bash
docker compose -f infra/docker-compose.yml up postgres redis -d
```

### 3. Database Setup
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Optional: loads sample data (campaigns, products, links)
```

### 4. Run Development
```bash
# Terminal 1: API (http://localhost:8080)
npm run dev:api

# Terminal 2: Web (http://localhost:3000)
npm run dev:web
```

### 5. Access
| Service | URL |
|---------|-----|
| Public Site | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin/dashboard |
| API Docs (Swagger) | http://localhost:8080/api/docs |

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:12345@localhost:5555/aff?schema=public` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `API_PORT` | `8080` | API server port |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | API URL for frontend |
| `API_BACKEND_URL` | `http://localhost:8080` | Backend URL for Next.js API proxy |
| `JWT_ACCESS_SECRET` | `your-access-secret` | JWT access token signing key |
| `JWT_REFRESH_SECRET` | `your-refresh-secret` | JWT refresh token signing key |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |

---

## 📦 Project Structure

```
Jenosize-AffiliatePlatform/
├── apps/
│   ├── api/                    # NestJS Backend API
│   │   ├── src/
│   │   │   ├── auth/           # JWT auth, guards, cookies
│   │   │   ├── campaigns/      # Campaign CRUD
│   │   │   ├── dashboard/      # Analytics aggregation
│   │   │   ├── links/          # Short link generation
│   │   │   ├── products/       # Product CRUD + scraping
│   │   │   ├── redirect/       # High-performance redirects
│   │   │   ├── worker/         # BullMQ consumer + cron
│   │   │   ├── prisma/         # Database service
│   │   │   └── redis/          # Redis service
│   │   └── test/               # E2E tests
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/            # Pages (App Router)
│           │   ├── page.tsx           # Public landing page
│           │   └── admin/             # Admin section
│           │       ├── login/         # Login page
│           │       ├── dashboard/     # Analytics dashboard
│           │       ├── products/      # Product management
│           │       ├── campaigns/     # Campaign management
│           │       └── links/         # Link management
│           ├── components/     # Shared components
│           └── lib/            # API helpers, i18n
├── packages/
│   ├── adapters/               # Marketplace scraping adapters
│   │   └── src/
│   │       ├── marketplace-adapter.interface.ts
│   │       ├── shopee.adapter.ts
│   │       ├── lazada.adapter.ts
│   │       └── adapter.factory.ts
│   └── database/               # Prisma ORM schema + migrations
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed.ts
├── infra/
│   └── docker-compose.yml      # Full-stack containerization
├── docs/                       # Detailed project documentation
└── .github/
    └── workflows/
        └── ci.yml              # GitHub Actions CI pipeline
```

---

## 🛠️ Tech Choices & Reasoning

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | Server-side rendering for SEO on public pages, React Server Components for performance, built-in API routes for proxying to backend |
| **Styling** | TailwindCSS 4 | Utility-first approach enables rapid UI development with consistent design tokens; excellent DX with JIT compilation |
| **Backend** | NestJS 11 + TypeScript | Modular architecture maps naturally to domain modules (auth, products, campaigns, links); decorator-based DI simplifies testing and extension |
| **Database** | PostgreSQL 16 | ACID compliance for financial/tracking data integrity; JSONB support for flexible metadata; mature ecosystem |
| **ORM** | Prisma 6 | Type-safe database access with auto-generated client; declarative schema with built-in migration tooling |
| **Cache & Queue** | Redis 7 + BullMQ | Single Redis instance serves three roles: URL cache for low-latency redirects, BullMQ job queue for async click processing, and session store for refresh token revocation |
| **Auth** | JWT (HTTP-only cookies) | Stateless access tokens with `SameSite=strict` cookies prevent XSS token theft; refresh tokens in Redis enable revocation |
| **Scraping** | Cheerio | Lightweight HTML parsing without headless browser overhead; extracts JSON-LD structured data from Shopee/Lazada product pages |
| **Testing** | Jest | Unified test runner for unit, integration, and E2E tests across the monorepo; excellent TypeScript support |
| **CI/CD** | GitHub Actions | Automated lint → test → build pipeline on every push; integrates seamlessly with the GitHub-hosted monorepo |
| **Infrastructure** | Docker Compose | One-command local environment setup; production-ready multi-container orchestration |
| **Monorepo** | npm Workspaces | Native npm workspace support avoids extra tooling; shared packages (`@affiliate/adapters`, `@affiliate/database`) enforce clean dependency boundaries |

---

## 🔑 Key Architectural Decisions

### Adapter Pattern for Marketplaces
The `MarketplaceAdapter` interface in `/packages/adapters` decouples marketplace-specific scraping logic from the core application. Adding a new marketplace (e.g., TikTok Shop) requires only creating a new adapter class implementing the interface and registering it in `AdapterFactory` — zero changes to existing code.

### High-Throughput Redirect Pipeline
`GET /go/:short_code` is the critical high-traffic path. It:
1. Reads the target URL from **Redis cache** (sub-millisecond)
2. Falls back to PostgreSQL on cache miss
3. Pushes click event to a **BullMQ queue** (fire-and-forget)
4. Returns HTTP 302 immediately — no synchronous DB write

### Async Click Processing
The BullMQ worker consumes click events and batch-inserts into PostgreSQL, fully decoupled from redirect response time. This ensures redirects stay fast regardless of analytics volume.

### Cookie-Based Authentication
Access & refresh tokens are stored in HTTP-only cookies with `SameSite=strict` — no tokens in `localStorage`. Refresh tokens are persisted in Redis, enabling server-side revocation (logout invalidates all sessions).

---

## 🧪 Testing

```bash
# Adapter unit tests
npm run test -w packages/adapters

# API unit tests
npm run test -w apps/api

# API e2e tests (requires Postgres + Redis)
npm run test:e2e -w apps/api
```

---

## 🐳 Docker (Full Stack)

```bash
docker compose -f infra/docker-compose.yml up --build
```

This starts all 4 services: PostgreSQL, Redis, API (port 8080), Web (port 3000).

---

## 🔮 Future Roadmap

With more time, these improvements would be prioritized:

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | **Real Marketplace APIs** | Replace web scraping with official Shopee/Lazada Open Platform APIs for reliable, rate-limit-safe data fetching |
| 🔴 High | **Rate Limiting** | Add rate limiting to the redirect endpoint (`/go/:code`) to prevent abuse and DDoS |
| 🟡 Medium | **A/B Testing** | Support multiple target URLs per link for split-testing different landing pages |
| 🟡 Medium | **Webhook Notifications** | Alert subscribers on price drops via LINE Notify or email |
| 🟡 Medium | **Analytics Export** | CSV/PDF report generation for campaign performance data |
| 🟢 Low | **Multi-Tenancy** | Support multiple brands/teams with isolated data and permissioned access |
| 🟢 Low | **Real-Time Dashboard** | WebSocket-based live click counter on the admin dashboard |
| 🟢 Low | **Mobile-Responsive Admin** | Fully responsive admin panel optimized for tablet and mobile |

---

## 📚 Additional Documentation

Detailed documentation is available in the [`/docs`](./docs) directory:

| Document | Description |
|----------|-------------|
| [01 — Business Requirements](./docs/01-business-requirements.md) | Project goals, user stories, and stakeholder needs |
| [02 — Functional Requirements](./docs/02-functional-requirements.md) | Feature specifications and acceptance criteria |
| [03 — Architecture](./docs/03-architecture.md) | Detailed system architecture and module design |
| [04 — Data Model](./docs/04-data-model.md) | Database schema, relationships, and ER diagrams |
| [05 — API Reference](./docs/05-api-reference.md) | REST API endpoints and request/response formats |
| [06 — Sequence Diagrams](./docs/06-sequence-diagrams.md) | Key user flow interactions |
| [07 — Flowcharts](./docs/07-flowcharts.md) | System process flows |
| [08 — Security](./docs/08-security.md) | Authentication, authorization, and security practices |
| [09 — Deployment](./docs/09-deployment.md) | Deployment guide and environment configuration |
| [10 — Testing](./docs/10-testing.md) | Test strategy, coverage, and CI pipeline |
