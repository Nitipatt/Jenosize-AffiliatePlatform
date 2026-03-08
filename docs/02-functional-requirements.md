# 02 — Functional Requirements Document (FRD)

## 1. User Roles

| Role | Description | Authentication |
|------|-------------|---------------|
| **Admin** | Manages products, campaigns, links; accesses dashboard | JWT (username + password) |
| **Public Visitor** | Browses public landing page, clicks affiliate links | None |

---

## 2. Feature Matrix

| Feature | Admin | Public |
|---------|:-----:|:------:|
| View product comparisons | ✅ | ✅ |
| Add/edit/delete products | ✅ | ❌ |
| Create campaigns | ✅ | ❌ |
| Generate affiliate links | ✅ | ❌ |
| View analytics dashboard | ✅ | ❌ |
| Click affiliate links | ✅ | ✅ |
| Switch language (EN/TH) | ✅ | ✅ |

---

## 3. User Stories

### 3.1 Authentication

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-01 | As an admin, I want to log in with username/password | Given valid credentials, when I submit the login form, then I am redirected to the dashboard and receive HTTP-only JWT cookies |
| US-02 | As an admin, I want to stay logged in across page refreshes | Given active cookies, when I reload, then I remain authenticated via token refresh |
| US-03 | As an admin, I want to log out | When I click logout, then cookies are cleared and I'm redirected to login |
| US-04 | As a visitor, I should not access admin pages | When I navigate to `/admin/*` without auth, then I'm redirected to login |

### 3.2 Product Management

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-05 | As an admin, I want to add a product by pasting a Shopee URL | When I paste a valid Shopee URL and submit, then the system scrapes title, price, image, store name and creates the product with an offer |
| US-06 | As an admin, I want to add a product by pasting a Lazada URL | Same as US-05 but for Lazada |
| US-07 | As an admin, I want to add a product with both URLs for comparison | When I paste both Shopee and Lazada URLs, then one product is created with two offers (one per marketplace) |
| US-08 | As an admin, I want to edit a product title | When I click edit, modify the title, and save, then the product title is updated |
| US-09 | As an admin, I want to delete a product | When I confirm deletion, then the product and all associated offers, links, and clicks are removed (cascade) |
| US-10 | As an admin, I want to see which marketplace has the best price | On the products table, the lowest-price marketplace is highlighted in green |

### 3.3 Campaign Management

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-11 | As an admin, I want to create a campaign with name, UTM, and dates | When I fill the form and submit, then a campaign is created and shown in the table |
| US-12 | As an admin, I want to see if a campaign is active or inactive | Campaigns within their start/end date range show "Active" badge, others show "Inactive" |
| US-13 | As an admin, I want to see how many links are in each campaign | The campaigns table shows the link count per campaign |

### 3.4 Link Generation

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-14 | As an admin, I want to generate a short link for a product + campaign | When I select a product and campaign then click generate, a unique short code is created |
| US-15 | As an admin, I want to copy the generated link to clipboard | When I click the copy button, the full URL is copied to the clipboard |
| US-16 | As an admin, I want to see click counts per link | The links table displays the total click count for each link |

### 3.5 Redirect & Click Tracking

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-17 | As a visitor, when I click an affiliate link (`/go/:code`), I should be redirected to the product page | The system returns HTTP 302 to the target marketplace URL |
| US-18 | As the system, I want to record each click asynchronously | Click events are pushed to BullMQ queue and processed by the worker, storing referrer and user-agent |
| US-19 | As the system, I want to validate the redirect domain | Only known marketplace domains (shopee.co.th, lazada.co.th) are allowed; others return 400 |

### 3.6 Dashboard Analytics

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-20 | As an admin, I want to see total clicks across all links | Dashboard shows a "Total Clicks" stat card |
| US-21 | As an admin, I want to see clicks over time as a bar chart | Dashboard shows a time-series chart of daily click counts |
| US-22 | As an admin, I want to see clicks by campaign as a pie chart | Dashboard shows a donut chart with campaign click distribution |
| US-23 | As an admin, I want to see top products by clicks | Dashboard shows a table of products ranked by click count |

### 3.7 Internationalization (i18n)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-24 | As a user, I want to switch between English and Thai | A language switcher is visible on all pages; clicking it instantly translates all UI text |
| US-25 | As a user, I want my language preference to persist | Language choice is stored in localStorage and survives page reloads |

### 3.8 Background Jobs

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-26 | As the system, I want to refresh all product prices daily | A cron job runs at midnight, re-scraping prices for all tracked products |

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Redirect latency | < 100ms (P95) via Redis cache |
| NFR-02 | Concurrent users | Support 100+ concurrent admin sessions |
| NFR-03 | Data integrity | Cascade deletes for products → offers/links/clicks |
| NFR-04 | Security | HTTP-only cookies, env validation, domain whitelist |
| NFR-05 | Accessibility | Semantic HTML, proper heading hierarchy |
| NFR-06 | Browser support | Chrome, Firefox, Safari (latest 2 versions) |
| NFR-07 | Test coverage | Unit + integration + e2e tests with CI |
