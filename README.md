# ⚡ FanVault

**Official licensed merchandise for sports teams, movies & shows.**

A complete microservices e-commerce application built with the MERN stack, containerized with Docker, and ready for Kubernetes.

---

## Project Structure

```
Capstone-Project/
├── frontend/             # React + Vite + Nginx (Port 80)
├── auth-service/         # JWT authentication (Port 3001)
├── user-service/         # User profiles (Port 3002)
├── product-service/      # Product catalog (Port 3003)
├── order-service/        # Order management (Port 3004)
├── email-service/        # Email notifications (Port 3005)
├── docker-compose.yml    # Orchestrates all services
├── .env.example          # Root environment template
├── ARCHITECTURE.md       # Request flow & architecture docs
├── SETUP_STEPS.md        # Manual setup steps (SMTP, etc.)
└── architecture.drawio   # draw.io architecture diagram
```

---

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd Capstone-Project

# Create env file from template
cp .env.example .env

# Edit .env with your values (SMTP credentials, strong secrets)
notepad .env
```

### 2. Run

```bash
docker compose up --build
```

### 3. Open

http://localhost

---

## Services

| Service | URL (internal) | Port |
|---|---|---|
| Frontend | http://localhost | 80 |
| Auth API | http://localhost/api/auth | 3001 (internal) |
| User API | http://localhost/api/users | 3002 (internal) |
| Product API | http://localhost/api/products | 3003 (internal) |
| Order API | http://localhost/api/orders | 3004 (internal) |
| MongoDB | localhost:27017 | 27017 |

---

## Key Features

- **6 independent microservices** — each with its own Dockerfile, package.json, .env
- **JWT auth** — access tokens (15m) + refresh tokens (7d), auto-refresh via Axios interceptor
- **Product catalog** — 16 seeded products across sports (Real Madrid, Mumbai Indians, Chicago Bulls, FC Barcelona), movies (Avengers, Harry Potter), shows (Game of Thrones, Breaking Bad)
- **Order pipeline** — cart → checkout → order confirmation → email notification
- **Email notifications** — beautiful branded HTML emails via Nodemailer (Gmail / Brevo / Mailtrap)
- **API security** — direct browser access to `/api/*` redirects to `/login`
- **Non-root containers** — all Dockerfiles use `appuser`
- **MongoDB** — shared instance with 4 logical databases (auth-db, user-db, product-db, order-db)

---

## Documentation

- 📐 **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Full request flow, data models, network topology
- 🔧 **[SETUP_STEPS.md](./SETUP_STEPS.md)** — SMTP setup, secrets, troubleshooting
- 🖼️ **[architecture.drawio](./architecture.drawio)** — Open in draw.io / diagrams.net

---

## Useful Commands

```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f [service-name]

# Check service health
docker compose ps

# Stop
docker compose down

# Wipe data and restart clean
docker compose down -v && docker compose up --build

# Connect to MongoDB
docker exec -it fanvault-mongo mongosh -u fanvault_admin -p <password> --authenticationDatabase admin
```
