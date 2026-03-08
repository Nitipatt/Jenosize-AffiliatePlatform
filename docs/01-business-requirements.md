# 01 — Business Requirements Document (BRD)

## 1. Project Overview

### 1.1 Project Name
**Jenosize Affiliate Platform**

### 1.2 Project Description
A full-stack affiliate marketing platform that enables administrators to manage product price comparisons across Thai e-commerce marketplaces (Shopee and Lazada), generate trackable affiliate short links, run promotional campaigns, and monitor click analytics through a centralized dashboard.

### 1.3 Business Context
Thai e-commerce is dominated by two major marketplaces — **Shopee** and **Lazada**. Consumers frequently compare prices between these platforms before purchasing. This platform bridges that gap by:
- Automatically scraping and comparing prices from both marketplaces
- Generating tracked affiliate links for promotional campaigns
- Providing analytics to measure campaign effectiveness

---

## 2. Stakeholders

| Stakeholder | Role | Responsibilities |
|-------------|------|-----------------|
| **Affiliate Manager (Admin)** | Primary user | Manages products, campaigns, links; monitors analytics |
| **End Consumer (Public)** | Visitor | Browses products, compares prices, clicks affiliate links |
| **Marketing Team** | Business user | Defines campaigns, reviews click/conversion data |
| **Engineering Team** | Developer | Maintains and extends the platform |

---

## 3. Business Objectives

| ID | Objective | Priority |
|----|-----------|----------|
| BO-1 | Enable real-time price comparison between Shopee and Lazada | **High** |
| BO-2 | Generate trackable short links for affiliate campaigns | **High** |
| BO-3 | Provide campaign analytics with click tracking | **High** |
| BO-4 | Support multi-language interface (English + Thai) | **Medium** |
| BO-5 | Automate daily price refresh across all tracked products | **Medium** |
| BO-6 | Ensure sub-100ms redirect latency for affiliate links | **High** |

---

## 4. Scope

### 4.1 In Scope
- Product management (add, edit, delete) via marketplace URLs
- Automated product data extraction from Shopee and Lazada
- Daily price refresh via background cron job
- Campaign management with UTM tracking parameters
- Short link generation with unique codes
- Click tracking with referrer and user-agent capture
- Admin dashboard with analytics charts
- JWT-based authentication (HTTP-only cookies)
- Internationalization (English and Thai)
- CI/CD pipeline with GitHub Actions

### 4.2 Out of Scope
- Payment processing
- Commission calculation and payouts
- Marketplace API integrations (uses web scraping)
- User registration (admin accounts only)
- Mobile application
- A/B testing for links
- Multi-tenancy

---

## 5. Success Criteria

| # | Criterion | Metric |
|---|-----------|--------|
| SC-1 | Redirect latency | < 100ms (95th percentile) |
| SC-2 | Price data freshness | Updated within 24 hours |
| SC-3 | Uptime | 99.5% availability |
| SC-4 | Admin workflow efficiency | Product → Link generation in < 60 seconds |
| SC-5 | Language coverage | 100% UI strings translated to EN and TH |

---

## 6. Assumptions and Constraints

### Assumptions
- Shopee and Lazada product pages expose metadata (JSON-LD, Open Graph) for scraping
- Redis is available for caching and session management
- PostgreSQL is the primary data store
- System operates in a single-region deployment

### Constraints
- Web scraping is subject to rate limiting and page structure changes
- No official marketplace API access (Shopee/Lazada Open Platform)
- Single admin role (no role-based access control)
- Thai Baht (฿) is the only supported currency

---

## 7. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Marketplace page structure changes | Price scraping breaks | **High** | Adapter pattern isolates changes; easy to swap implementations |
| Rate limiting by marketplaces | Unable to refresh prices | **Medium** | Daily cron (not real-time); respect rate limits |
| Redis downtime | Slow redirects, auth failures | **Medium** | Redirect falls back to PostgreSQL; graceful degradation |
| JWT secret exposure | Unauthorized access | **Low** | Startup validation ensures secrets are set; `.env` gitignored |
