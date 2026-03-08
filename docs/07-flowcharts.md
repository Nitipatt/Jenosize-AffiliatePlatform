# 07 — Flowcharts

## 1. User Authentication Decision Flow

```mermaid
flowchart TD
    START([User navigates to /admin/*]) --> CHECK_AUTH{Has valid<br/>access token?}
    
    CHECK_AUTH -->|Yes| IS_LOGIN{Is on<br/>login page?}
    CHECK_AUTH -->|No| HAS_REFRESH{Has refresh<br/>token cookie?}
    
    IS_LOGIN -->|Yes| REDIRECT_DASH[Redirect to /admin/dashboard]
    IS_LOGIN -->|No| SHOW_PAGE[Show requested page]
    
    HAS_REFRESH -->|Yes| REFRESH[Call POST /api/auth/refresh]
    HAS_REFRESH -->|No| REDIRECT_LOGIN[Redirect to /admin/login]
    
    REFRESH --> REFRESH_OK{Refresh<br/>successful?}
    REFRESH_OK -->|Yes| SHOW_PAGE
    REFRESH_OK -->|No| REDIRECT_LOGIN
    
    SHOW_PAGE --> END_OK([Page rendered ✅])
    REDIRECT_DASH --> END_OK
    REDIRECT_LOGIN --> END_LOGIN([Login page shown 🔐])
```

---

## 2. Product Creation Decision Flow

```mermaid
flowchart TD
    START([Admin submits product form]) --> VALIDATE{At least one URL<br/>provided?}
    
    VALIDATE -->|No| ERROR_URL[Show error:<br/>Provide at least one URL]
    VALIDATE -->|Yes| HAS_SHOPEE{Shopee URL<br/>provided?}
    
    HAS_SHOPEE -->|Yes| SCRAPE_SHOPEE[Scrape Shopee product data]
    HAS_SHOPEE -->|No| CHECK_LAZADA{Lazada URL<br/>provided?}
    
    SCRAPE_SHOPEE --> SHOPEE_OK{Scraping<br/>successful?}
    SHOPEE_OK -->|Yes| CHECK_LAZADA
    SHOPEE_OK -->|No| ERROR_SCRAPE[Show error:<br/>Failed to scrape]
    
    CHECK_LAZADA{Lazada URL<br/>provided?} -->|Yes| SCRAPE_LAZADA[Scrape Lazada product data]
    CHECK_LAZADA -->|No| CREATE_PRODUCT[Create Product in DB]
    
    SCRAPE_LAZADA --> LAZADA_OK{Scraping<br/>successful?}
    LAZADA_OK -->|Yes| CREATE_PRODUCT
    LAZADA_OK -->|No| ERROR_SCRAPE
    
    CREATE_PRODUCT --> UPSERT_OFFERS[Upsert offers for each marketplace]
    UPSERT_OFFERS --> SUCCESS([Product created ✅])
    
    ERROR_URL --> END_ERROR([Show error to user ❌])
    ERROR_SCRAPE --> END_ERROR
```

---

## 3. Affiliate Redirect Decision Flow

```mermaid
flowchart TD
    START([GET /go/:short_code]) --> CACHE_CHECK{short_code<br/>in Redis cache?}
    
    CACHE_CHECK -->|Hit| DOMAIN_CHECK
    CACHE_CHECK -->|Miss| DB_LOOKUP[Query PostgreSQL]
    
    DB_LOOKUP --> FOUND{Record<br/>found?}
    FOUND -->|No| NOT_FOUND[Return 404]
    FOUND -->|Yes| WARM_CACHE[Cache target URL in Redis]
    WARM_CACHE --> DOMAIN_CHECK
    
    DOMAIN_CHECK{Target domain<br/>in whitelist?} -->|No| BAD_REQUEST[Return 400:<br/>Domain not allowed]
    DOMAIN_CHECK -->|Yes| QUEUE_CLICK[Push click event<br/>to BullMQ queue]
    
    QUEUE_CLICK --> REDIRECT[Return 302 Redirect]
    REDIRECT --> END_OK([User lands on marketplace ✅])
    
    NOT_FOUND --> END_ERR([Error response ❌])
    BAD_REQUEST --> END_ERR

    style CACHE_CHECK fill:#f0f9ff
    style DOMAIN_CHECK fill:#fff7ed
    style QUEUE_CLICK fill:#f0fdf4
```

---

## 4. Link Generation Decision Flow

```mermaid
flowchart TD
    START([Admin selects product + campaign]) --> VALIDATE{Both product_id<br/>and campaign_id<br/>provided?}
    
    VALIDATE -->|No| ERROR_VALID[Validation error]
    VALIDATE -->|Yes| CHECK_PRODUCT{Product<br/>exists?}
    
    CHECK_PRODUCT -->|No| ERROR_404[Product not found]
    CHECK_PRODUCT -->|Yes| CHECK_CAMPAIGN{Campaign<br/>exists?}
    
    CHECK_CAMPAIGN -->|No| ERROR_404_2[Campaign not found]
    CHECK_CAMPAIGN -->|Yes| GET_OFFER[Get product's first offer URL]
    
    GET_OFFER --> HAS_OFFER{Offer<br/>URL available?}
    HAS_OFFER -->|No| ERROR_OFFER[No offers to link]
    HAS_OFFER -->|Yes| GEN_CODE[Generate 8-char unique short code]
    
    GEN_CODE --> BUILD_URL[Build target URL<br/>with UTM parameters]
    BUILD_URL --> SAVE_DB[Save Link to DB]
    SAVE_DB --> CACHE_WARM[Pre-warm Redis cache]
    CACHE_WARM --> SUCCESS([Link generated ✅])
    
    ERROR_VALID --> END_ERR([Error response ❌])
    ERROR_404 --> END_ERR
    ERROR_404_2 --> END_ERR
    ERROR_OFFER --> END_ERR
```

---

## 5. Daily Price Refresh Process Flow

```mermaid
flowchart TD
    START([Cron trigger: 00:00 daily]) --> FETCH_OFFERS[Fetch all offers from DB]
    
    FETCH_OFFERS --> HAS_OFFERS{Any offers<br/>to refresh?}
    HAS_OFFERS -->|No| LOG_SKIP[Log: No offers to refresh]
    HAS_OFFERS -->|Yes| LOOP_START[Start processing offers]
    
    LOOP_START --> GET_ADAPTER[Get adapter for marketplace]
    GET_ADAPTER --> SCRAPE[Scrape current price]
    
    SCRAPE --> SCRAPE_OK{Scrape<br/>successful?}
    SCRAPE_OK -->|Yes| PRICE_CHANGED{Price<br/>changed?}
    SCRAPE_OK -->|No| LOG_ERROR[Log error, continue]
    
    PRICE_CHANGED -->|Yes| UPDATE_DB[Update offer price + last_checked_at]
    PRICE_CHANGED -->|No| UPDATE_TIME[Update last_checked_at only]
    
    UPDATE_DB --> MORE{More offers?}
    UPDATE_TIME --> MORE
    LOG_ERROR --> MORE
    
    MORE -->|Yes| GET_ADAPTER
    MORE -->|No| LOG_DONE[Log refresh summary]
    
    LOG_DONE --> END_OK([Refresh complete ✅])
    LOG_SKIP --> END_OK
```

---

## 6. Campaign Status State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: Admin creates campaign
    
    Created --> Upcoming: start_at > now
    Created --> Active: start_at ≤ now ≤ end_at
    Created --> Expired: end_at < now
    
    Upcoming --> Active: Current time reaches start_at
    Active --> Expired: Current time passes end_at
    
    Active --> Active: Links generated\nClicks tracked
    
    note right of Active
        Campaigns are "active" when:
        start_at ≤ current_time ≤ end_at
        
        Status is computed, not stored.
    end note
```

---

## 7. Request Processing Pipeline

```mermaid
flowchart LR
    REQ([HTTP Request]) --> CORS[CORS Middleware]
    CORS --> VALIDATION[ValidationPipe<br/>whitelist + forbidNonWhitelisted]
    VALIDATION --> GUARD{Auth Guard}
    
    GUARD -->|Public route| CONTROLLER[Controller]
    GUARD -->|Protected + Valid token| CONTROLLER
    GUARD -->|Protected + Invalid token| REJECT[401 Unauthorized]
    
    CONTROLLER --> SERVICE[Service Layer]
    SERVICE --> DB[(PostgreSQL)]
    SERVICE --> CACHE[(Redis)]
    SERVICE --> QUEUE[(BullMQ)]
    
    CONTROLLER --> RES([HTTP Response])
    REJECT --> RES
```
