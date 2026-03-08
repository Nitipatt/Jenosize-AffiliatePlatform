# 06 — Sequence Diagrams

## 1. User Login Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant NextJS as Next.js Frontend
    participant API as NestJS API
    participant Redis
    participant DB as PostgreSQL

    Admin->>Browser: Enter username + password
    Browser->>NextJS: Submit login form
    NextJS->>API: POST /api/auth/login
    API->>DB: Find user by username
    DB-->>API: User record
    API->>API: Verify password (bcrypt)
    API->>API: Generate access token (JWT, 15min)
    API->>API: Generate refresh token (JWT, 7d)
    API->>Redis: Store refresh token
    API-->>NextJS: 200 OK + Set-Cookie (access_token, refresh_token)
    NextJS-->>Browser: Redirect to /admin/dashboard
    Browser-->>Admin: Dashboard loaded
```

---

## 2. Token Refresh Flow

```mermaid
sequenceDiagram
    participant Browser
    participant API as NestJS API
    participant Redis

    Browser->>API: Any protected request (expired access token)
    API-->>Browser: 401 Unauthorized
    Browser->>API: POST /api/auth/refresh (refresh_token cookie)
    API->>API: Verify refresh token JWT
    API->>Redis: Check refresh token exists
    Redis-->>API: Token valid
    API->>API: Generate new access token
    API->>API: Generate new refresh token
    API->>Redis: Replace old refresh token
    API-->>Browser: 200 OK + Set-Cookie (new tokens)
    Browser->>API: Retry original request (new access token)
    API-->>Browser: 200 OK with data
```

---

## 3. Product Creation Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant API as NestJS API
    participant Factory as AdapterFactory
    participant Shopee as ShopeeAdapter
    participant Lazada as LazadaAdapter
    participant DB as PostgreSQL

    Admin->>Browser: Paste Shopee + Lazada URLs
    Browser->>API: POST /api/products {shopee_url, lazada_url}
    
    par Scrape Shopee
        API->>Factory: getAdapter("SHOPEE")
        Factory-->>API: ShopeeAdapter
        API->>Shopee: fetchProduct(shopee_url)
        Shopee->>Shopee: HTTP GET → Parse HTML + JSON-LD
        Shopee-->>API: {title, price, image, store}
    and Scrape Lazada
        API->>Factory: getAdapter("LAZADA")
        Factory-->>API: LazadaAdapter
        API->>Lazada: fetchProduct(lazada_url)
        Lazada->>Lazada: HTTP GET → Parse HTML + JSON-LD
        Lazada-->>API: {title, price, image, store}
    end

    API->>DB: Create Product
    API->>DB: Upsert Offer (Shopee)
    API->>DB: Upsert Offer (Lazada)
    DB-->>API: Product with Offers
    API-->>Browser: 201 Created
    Browser-->>Admin: Product appears in table
```

---

## 4. Affiliate Link Generation Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Redis

    Admin->>Browser: Select product + campaign
    Browser->>API: POST /api/links {product_id, campaign_id}
    API->>DB: Verify product exists
    API->>DB: Verify campaign exists
    API->>DB: Get product's first offer URL
    API->>API: Generate random short code (8 chars)
    API->>API: Build target URL (offer URL + UTM params)
    API->>DB: Create Link record
    API->>Redis: Pre-warm cache (short_code → target_url)
    DB-->>API: Link with short code
    API-->>Browser: 201 Created {shortCode, targetUrl}
    Browser-->>Admin: Link appears in table
```

---

## 5. Affiliate Redirect + Click Tracking Flow

```mermaid
sequenceDiagram
    actor Visitor
    participant Browser
    participant API as NestJS API
    participant Redis
    participant DB as PostgreSQL
    participant BullMQ as BullMQ Queue
    participant Worker as Click Worker

    Visitor->>Browser: Click affiliate link /go/aBcD1234
    Browser->>API: GET /go/aBcD1234

    API->>Redis: GET link:aBcD1234
    
    alt Cache Hit
        Redis-->>API: target_url
    else Cache Miss
        Redis-->>API: null
        API->>DB: SELECT link WHERE short_code = 'aBcD1234'
        DB-->>API: Link record
        API->>Redis: SET link:aBcD1234 (cache warm)
    end

    API->>API: Validate domain (whitelist check)
    API->>BullMQ: Push click event (async, fire-and-forget)
    API-->>Browser: 302 Redirect → target_url
    Browser-->>Visitor: Marketplace product page

    Note over BullMQ,Worker: Async processing
    BullMQ->>Worker: Dequeue click event
    Worker->>DB: INSERT click (link_id, referrer, user_agent, timestamp)
```

---

## 6. Daily Price Refresh Flow

```mermaid
sequenceDiagram
    participant Cron as Cron Scheduler
    participant Service as PriceRefreshService
    participant DB as PostgreSQL
    participant Factory as AdapterFactory
    participant Adapter as Marketplace Adapter

    Cron->>Service: Trigger at 00:00 daily
    Service->>DB: SELECT all offers with external_url
    DB-->>Service: List of offers

    loop For each offer
        Service->>Factory: getAdapter(offer.marketplace)
        Factory-->>Service: Adapter instance
        Service->>Adapter: fetchProduct(offer.external_url)
        Adapter-->>Service: {price, title, store}
        Service->>DB: UPDATE offer SET price = new_price, last_checked_at = now()
    end

    Service->>Service: Log refresh summary
```

---

## 7. Dashboard Analytics Query Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant API as NestJS API
    participant DB as PostgreSQL

    Admin->>Browser: Navigate to /admin/dashboard
    Browser->>API: GET /api/dashboard
    
    par Total Clicks
        API->>DB: COUNT(*) FROM clicks
        DB-->>API: total_clicks
    and Top Campaigns
        API->>DB: GROUP BY campaign, COUNT clicks, ORDER BY count DESC
        DB-->>API: top_campaigns[]
    and Top Products
        API->>DB: GROUP BY product, COUNT clicks, JOIN offers
        DB-->>API: top_products[]
    and Clicks Over Time
        API->>DB: GROUP BY DATE(timestamp), COUNT clicks
        DB-->>API: clicks_over_time[]
    end

    API-->>Browser: {total_clicks, top_campaigns, top_products, clicks_over_time}
    Browser-->>Admin: Render charts + stats
```
