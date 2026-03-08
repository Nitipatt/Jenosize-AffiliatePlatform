# 10 — Testing Strategy

## 1. Test Pyramid

```mermaid
graph TD
    subgraph Pyramid["🧪 Test Pyramid"]
        E2E["🔺 E2E Tests<br/>(Integration)<br/>Full API flow"]
        UNIT["🔷 Unit Tests<br/>(Components)<br/>Services, adapters"]
        LINT["🟩 Static Analysis<br/>(Linting)<br/>ESLint"]
    end

    E2E --> UNIT
    UNIT --> LINT
```

---

## 2. Test Categories

### 2.1 Unit Tests

| Test File | Module | What's Tested |
|-----------|--------|---------------|
| `auth.service.spec.ts` | Auth | User registration, login, token generation, password validation |
| `products.service.spec.ts` | Products | Product creation, marketplace scraping integration |
| `redirect.service.spec.ts` | Redirect | Cache hit/miss, DB fallback, unknown short codes |
| `adapters.spec.ts` | Adapters | Shopee/Lazada HTML parsing, error handling |

### 2.2 E2E / Integration Tests

| Test File | Coverage |
|-----------|----------|
| `app.e2e-spec.ts` | Full user journey: register → login → add product → create campaign → generate link → redirect → dashboard |

### 2.3 Test Details

#### Auth Service Tests
```
✓ should register a new user with hashed password
✓ should reject duplicate usernames
✓ should login and return JWT tokens  
✓ should reject invalid passwords
✓ should refresh expired access tokens
✓ should reject invalid refresh tokens
```

#### Redirect Service Tests
```
✓ should return cached URL on Redis hit
✓ should query DB and warm cache on Redis miss
✓ should throw NotFoundException for unknown codes
```

#### Adapter Tests
```
✓ should parse Shopee product data from HTML
✓ should parse Lazada product data from HTML
✓ should handle network errors gracefully
✓ should handle malformed HTML gracefully
```

---

## 3. Running Tests

### Unit Tests

```bash
# All unit tests
npm run test -w apps/api

# Specific test file
npx jest --config apps/api/jest.config.js auth.service.spec

# With coverage
npx jest --config apps/api/jest.config.js --coverage

# Adapter tests
npm run test -w packages/adapters
```

### E2E Tests

Requires running PostgreSQL and Redis:

```bash
# Start infrastructure
docker compose -f infra/docker-compose.yml up postgres redis -d

# Run e2e tests
npm run test:e2e -w apps/api
```

### Linting

```bash
# Lint adapters
npm run lint -w packages/adapters

# Lint API (if configured)
npx eslint apps/api/src --ext .ts
```

---

## 4. CI/CD Pipeline (GitHub Actions)

### Pipeline Diagram

```mermaid
flowchart TD
    TRIGGER([Push to any branch<br/>or Pull Request]) --> SETUP[Setup Environment]
    
    SETUP --> SERVICES[Start Docker Services]
    SERVICES --> PG[(PostgreSQL :5432)]
    SERVICES --> REDIS[(Redis :6379)]
    
    SETUP --> NODE[Setup Node.js 20]
    NODE --> INSTALL[npm install]
    INSTALL --> GENERATE[Generate Prisma Client]
    GENERATE --> MIGRATE[Run DB Migrations]
    
    MIGRATE --> LINT[Step 1: Lint Adapters]
    LINT --> UNIT[Step 2: Unit Tests API]
    UNIT --> E2E[Step 3: E2E Tests API]
    E2E --> BUILD[Step 4: Build Web App]
    
    BUILD --> RESULT{All passed?}
    RESULT -->|Yes| SUCCESS([✅ Pipeline Green])
    RESULT -->|No| FAIL([❌ Pipeline Failed])
```

### Pipeline Configuration

**File**: `.github/workflows/ci.yml`

| Step | Command | Purpose |
|------|---------|---------|
| Lint | `npm run lint -w packages/adapters` | Static analysis |
| Unit Tests | `npm run test -w apps/api` | Service-level tests |
| E2E Tests | `npm run test:e2e -w apps/api` | Integration tests |
| Build Web | `npm run build -w apps/web` | Verify frontend compiles |

### Docker Services in CI

| Service | Image | Port | Health Check |
|---------|-------|------|-------------|
| PostgreSQL | `postgres:16` | 5432 | `pg_isready` |
| Redis | `redis:7` | 6379 | `redis-cli ping` |

### Environment Variables in CI

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aff_test?schema=public
  REDIS_HOST: localhost
  REDIS_PORT: 6379
  JWT_ACCESS_SECRET: test-access-secret
  JWT_REFRESH_SECRET: test-refresh-secret
```

---

## 5. Test Configuration

### Jest Config (API)

```javascript
// apps/api/jest.config.js
{
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
}
```

### Jest E2E Config

```javascript
// apps/api/test/jest-e2e.config.js
{
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
}
```

---

## 6. Test Coverage Goals

| Area | Target | Current |
|------|--------|---------|
| Auth Service | > 80% | ✅ Covered |
| Redirect Service | > 80% | ✅ Covered |
| Products Service | > 60% | ✅ Covered |
| Adapters | > 70% | ✅ Covered |
| E2E (Critical Paths) | 100% | ✅ Covered |
| Frontend Components | — | Not yet |

---

## 7. Testing Best Practices

1. **Isolation**: Unit tests mock external dependencies (Prisma, Redis, adapters)
2. **Determinism**: E2E tests create and clean up their own data
3. **Speed**: Unit tests run without Docker services
4. **CI Parity**: CI uses the same Docker images as local development
5. **Fail-Fast**: Lint runs first; tests are skipped if lint fails
