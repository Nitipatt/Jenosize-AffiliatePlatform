# 05 — API Reference

Base URL: `http://localhost:8080`

All endpoints return JSON. Protected endpoints require authentication via HTTP-only cookies (set automatically on login).

---

## 1. Authentication

### POST `/api/auth/register`
Create a new admin account.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `username` | string | ✅ | Min 3 chars |
| `password` | string | ✅ | Min 6 chars |

**Response** `201`:
```json
{
  "id": "uuid",
  "username": "admin"
}
```

---

### POST `/api/auth/login`
Authenticate and receive JWT cookies.

| Field | Type | Required |
|-------|------|----------|
| `username` | string | ✅ |
| `password` | string | ✅ |

**Response** `200`:
```json
{
  "id": "uuid",
  "username": "admin"
}
```

**Cookies set**: `access_token` (15min), `refresh_token` (7d), both HTTP-only, SameSite=strict.

---

### POST `/api/auth/refresh`
Refresh the access token using the refresh token cookie.

**Response** `200`:
```json
{ "message": "Token refreshed" }
```

---

### POST `/api/auth/logout`
Clear auth cookies and invalidate the refresh token.

**Response** `200`:
```json
{ "message": "Logged out" }
```

---

### GET `/api/auth/me`
Get current authenticated user info.

**Response** `200`:
```json
{
  "id": "uuid",
  "username": "admin"
}
```

---

## 2. Products 🔒

All endpoints require authentication.

### GET `/api/products`
List all products with their offers.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "title": "Product Name",
    "imageUrl": "https://...",
    "createdAt": "2026-03-08T12:00:00Z",
    "offers": [
      {
        "id": "uuid",
        "marketplace": "SHOPEE",
        "storeName": "Official Store",
        "price": 599.00,
        "externalUrl": "https://shopee.co.th/...",
        "lastCheckedAt": "2026-03-08T00:00:00Z"
      }
    ]
  }
]
```

---

### POST `/api/products`
Add a product by providing marketplace URLs. The system scrapes product data automatically.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shopee_url` | string (URL) | One of two | Shopee product page URL |
| `lazada_url` | string (URL) | One of two | Lazada product page URL |

**Response** `201`: Created product with scraped offers.

---

### PATCH `/api/products/:id`
Update a product's title.

| Field | Type | Required |
|-------|------|----------|
| `title` | string | ❌ (optional) |

**Response** `200`: Updated product.

---

### DELETE `/api/products/:id`
Delete a product and cascade-delete all related offers, links, and clicks.

**Response** `200`: Deleted product.

---

## 3. Campaigns 🔒

### GET `/api/campaigns`
List all campaigns with their link counts.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "name": "Summer Deal 2025",
    "utmCampaign": "summer-deal-2025",
    "startAt": "2025-06-01T00:00:00Z",
    "endAt": "2025-08-31T23:59:59Z",
    "createdAt": "2025-05-15T10:00:00Z",
    "links": [{ "id": "uuid" }]
  }
]
```

---

### POST `/api/campaigns`
Create a new campaign.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ✅ | — |
| `utm_campaign` | string | ✅ | — |
| `start_at` | ISO date string | ✅ | Valid date |
| `end_at` | ISO date string | ✅ | Valid date |

**Response** `201`: Created campaign.

---

## 4. Links 🔒

### GET `/api/links`
List all links with product, campaign, and click count.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "shortCode": "aBcD1234",
    "targetUrl": "https://shopee.co.th/product?utm_source=affiliate&utm_campaign=summer",
    "createdAt": "2026-03-08T12:00:00Z",
    "product": { "title": "Product Name" },
    "campaign": { "name": "Summer Deal" },
    "_count": { "clicks": 42 }
  }
]
```

---

### POST `/api/links`
Generate a new affiliate short link.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `product_id` | UUID | ✅ | Must exist |
| `campaign_id` | UUID | ✅ | Must exist |

**Response** `201`: Created link with short code.

---

## 5. Redirect (Public)

### GET `/go/:short_code`
Redirect to the target marketplace URL.

**Flow**:
1. Look up `short_code` in Redis cache
2. On cache miss, query PostgreSQL and warm cache
3. Validate target domain against whitelist
4. Push click event to BullMQ queue
5. Return HTTP 302 redirect

**Response** `302`: Redirect to target URL with UTM parameters.

**Error** `404`: Short code not found.

**Error** `400`: Target domain not in whitelist.

---

## 6. Dashboard 🔒

### GET `/api/dashboard`
Get aggregated analytics data.

**Response** `200`:
```json
{
  "total_clicks": 1234,
  "top_campaigns": [
    { "id": "uuid", "name": "Summer Deal", "clicks": 500 }
  ],
  "top_products": [
    {
      "id": "uuid",
      "title": "Product",
      "clicks": 300,
      "offers": [{ "marketplace": "SHOPEE", "price": 599 }]
    }
  ],
  "clicks_over_time": [
    { "date": "2026-03-01", "count": 50 }
  ]
}
```

---

## 7. Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

| Code | Meaning |
|------|---------|
| `400` | Validation error or bad request |
| `401` | Unauthorized (missing/invalid token) |
| `404` | Resource not found |
| `500` | Internal server error |
