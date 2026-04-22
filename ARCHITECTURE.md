# FanVault – Application Architecture & Request Flow

## Overview

**FanVault** is an e-commerce platform selling official licensed merchandise for sports teams, movies and shows. It is built as a microservices application using the MERN stack (MongoDB, Express, React, Node.js), served via Nginx, and orchestrated with Docker Compose (with Kubernetes as the next layer).

---

## Service Inventory

| Service | Port | Tech | Database | Responsibility |
|---|---|---|---|---|
| **frontend** | 80 | React + Vite + Nginx | -- | SPA + Nginx reverse proxy |
| **auth-service** | 3001 | Node.js + Express | auth-db | Register, Login, JWT issue/verify/refresh |
| **user-service** | 3002 | Node.js + Express | user-db | User profiles, addresses, preferences |
| **product-service** | 3003 | Node.js + Express | product-db | Product catalog, filtering, seeding |
| **order-service** | 3004 | Node.js + Express | order-db | Order lifecycle, triggers email |
| **email-service** | 3005 | Node.js + Nodemailer | -- | Sends transactional emails via SMTP |
| **mongo** | 27017 | MongoDB 7 | -- | Shared database host (4 logical DBs) |

---

## Architecture (Text Diagram)

```
BROWSER
   |
   | HTTP :80
   v
+---------------------------------------------+
|   FRONTEND  (React + Nginx)  :80            |
|  - Serves compiled React SPA (dist/)        |
|  - Reverse-proxies /api/* to microservices  |
|  - Handles SPA routing (try_files)          |
|  - Browser GET /api/* -> 302 /login         |
+---+----------+----------+----------+--------+
    |          |          |          |
/api/auth/*  /api/    /api/     /api/
           users/*   products/  orders/
    |          |          |          |
    v          v          v          v
+--------+ +--------+ +--------+ +--------+
|  AUTH  | |  USER  | |PRODUCT | | ORDER  |
|  :3001 | |  :3002 | |  :3003 | |  :3004 |
+--------+ +--------+ +--------+ +---+----+
    |          |          |          |
    |          |          |          | HTTP internal
    |          |          |          v
    |          |          |     +----------+
    |          |          |     | EMAIL    |
    |          |          |     |  :3005   |
    |          |          |     +----+-----+
    |          |          |          |  SMTP
    |          |          |          v
    |          |          |     +----------+
    |          |          |     |  Gmail / |
    |          |          |     |  Brevo   |
    |          |          |     +----------+
    |          |          |
    +----------+----------+------------------+
                                             |
                                             v
                                    +------------------+
                                    |  MONGODB :27017  |
                                    |   auth-db        |
                                    |   user-db        |
                                    |   product-db     |
                                    |   order-db       |
                                    +------------------+
```

---

## Request Flow Walkthroughs

### 1. User Registration

```
Browser
  |
  |-- POST /api/auth/register  -->  auth-service
  |                                   |
  |                                   |-- Validate email + password
  |                                   |-- Hash password (bcrypt, cost=12)
  |                                   |-- Save AuthUser -> auth-db
  |                                   `-- Return { accessToken, refreshToken, user }
  |
  |-- POST /api/users/me  -->  user-service  (Bearer token)
  |                               |
  |                               |-- Verify JWT locally
  |                               |-- Create UserProfile -> user-db
  |                               `-- Return { profile }
  |
  `-- React stores tokens in localStorage, navigate to /
```

### 2. User Login

```
Browser
  |
  `-- POST /api/auth/login  -->  auth-service
                                   |
                                   |-- Find user by email
                                   |-- Compare password (bcrypt)
                                   |-- Update lastLogin
                                   `-- Return { accessToken (15m), refreshToken (7d), user }
```

### 3. Browse Products (public, no auth required)

```
Browser
  |
  `-- GET /api/products?category=clothing&franchiseType=sports
        |
        `-- Nginx proxy  -->  product-service
                                |
                                |-- Query MongoDB (product-db) with filters
                                |-- Paginate results
                                `-- Return { products[], pagination{} }
```

### 4. Place Order (requires auth)

```
Browser (Authorization: Bearer <token>)
  |
  `-- POST /api/orders  -->  order-service
                               |
                               |-- Verify JWT locally
                               |-- Calculate subtotal + GST (18%) + shipping
                               |-- Save Order -> order-db
                               |
                               `-- Fire-and-forget (non-blocking):
                                     POST http://email-service:3005/api/email/order-confirmation
                                       |
                                       |-- Validate x-internal-secret header
                                       |-- Build branded HTML email
                                       `-- Send via SMTP -> User inbox
```

### 5. Access Token Refresh (automatic)

```
Browser receives 401 (token expired)
  |
  `-- Axios interceptor: POST /api/auth/refresh  -->  auth-service
                                                         |
                                                         |-- Verify refreshToken
                                                         `-- Return new accessToken
  Interceptor retries original request with new token.
```

### 6. Direct API URL Access (browser navigation, no AJAX)

```
User types: http://localhost/api/products  in browser address bar
  |
  `-- Nginx location ~ ^/api/
        |
        `-- Detects GET method (browser navigation)
              `-- Returns HTTP 302 -> /login
                    |
                    `-- React Router renders <LoginPage />
```

---

## Docker Network Topology

All containers are on **`fanvault-network`** (bridge driver). They use container names as hostnames:

| From | To | Internal URL |
|---|---|---|
| Nginx (frontend) | auth-service | http://auth-service:3001 |
| Nginx | user-service | http://user-service:3002 |
| Nginx | product-service | http://product-service:3003 |
| Nginx | order-service | http://order-service:3004 |
| order-service | email-service | http://email-service:3005 |
| Any backend service | MongoDB | mongodb://user:pass@mongo:27017/db?authSource=admin |

No service calls `localhost` for inter-service communication.

---

## Security Model

| Concern | Implementation |
|---|---|
| Password storage | bcrypt cost factor 12 |
| Auth tokens | JWT HS256; access 15 min, refresh 7 days |
| Service-to-service auth | `x-internal-secret` shared header |
| Container user | Non-root `appuser` in every Dockerfile |
| Rate limiting | 100 req / 15 min on `/api/auth/*` |
| Input validation | `express-validator` on all write endpoints |
| CORS | Restricted to `CORS_ORIGIN` env var |
| Direct browser API access | Nginx 302 redirect to `/login` |

---

## Data Models

### AuthUser (auth-db)
```
email, password (bcrypt hash), role (user|admin), isActive, lastLogin, createdAt, updatedAt
```

### UserProfile (user-db)
```
authId (FK to AuthUser._id), email, firstName, lastName, phone, avatar,
addresses[{line1, line2, city, state, postalCode, country, isDefault}],
preferences{newsletter, smsAlerts}, createdAt, updatedAt
```

### Product (product-db)
```
name, description, price, comparePrice, category (clothing|accessories|shoes|ornaments),
franchise (Real Madrid|Mumbai Indians|Avengers|...), franchiseType (sports|movie|show),
tags[], images[], sku (unique), stock, sizes[], colors[], rating{average, count},
isActive, createdAt, updatedAt
```

### Order (order-db)
```
userId, userEmail, orderNumber (auto: FAN-xxxxx), items[], shippingAddress{},
subtotal, shippingCost (0 if >1999), tax (18% GST), total,
paymentMethod (cod|card|upi|netbanking), paymentStatus (pending|paid|failed|refunded),
status (placed|confirmed|processing|shipped|delivered|cancelled),
notificationSent, createdAt, updatedAt
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite 5, Axios |
| Styling | Vanilla CSS (custom design system, green accent, light mode) |
| Backend | Node.js 18, Express 4 |
| Auth | jsonwebtoken, bcryptjs |
| Database | MongoDB 7 (Mongoose ODM) |
| Email | Nodemailer (SMTP transport) |
| Containers | Docker (Alpine/slim images, non-root) |
| Orchestration | Docker Compose v3.9 (local), Kubernetes (next stage) |
| Web server | Nginx 1.25 Alpine |

---

## Environment Variable Flow

```
.env (root, never committed to git)
  |
  v
docker-compose.yml reads ${VAR}
  |
  |-- Injects into containers via `environment:` block
  `-- Each service .env via `env_file:` (service-specific extras only)
        |
        `-- dotenv loaded at service startup (require('dotenv').config())
```
