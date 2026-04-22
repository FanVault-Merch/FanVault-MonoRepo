# FanVault – Setup Steps (What YOU Need to Do)

This document lists all manual steps required from your side before the application is fully functional. The code is complete — these are the external configuration tasks.

---

## Step 1: Configure SMTP / Email (Required for Order Notifications)

The email-service uses Nodemailer to send order confirmation emails. You need an SMTP provider.

### Option A – Gmail (Easiest for dev/testing)

1. **Enable 2-Factor Authentication** on your Google account:
   - Go to: https://myaccount.google.com/security
   - Turn on "2-Step Verification"

2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select App: **Mail** / Device: **Other** (type "FanVault")
   - Copy the 16-character password generated

3. **Update your root `.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx     # the 16-char app password (spaces OK)
   SMTP_FROM=FanVault Store <your-gmail@gmail.com>
   ```

> **Note:** Gmail free tier allows ~500 emails/day. Sufficient for testing.

---

### Option B – Brevo (SendinBlue) – Recommended for Production

1. Create a free account at https://www.brevo.com
2. Go to **SMTP & API** settings
3. Copy your SMTP credentials

   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-brevo-login@email.com
   SMTP_PASS=your-brevo-smtp-key
   SMTP_FROM=FanVault Store <noreply@yourdomain.com>
   ```

> Brevo free tier: 300 emails/day, no credit card required.

---

### Option C – Mailtrap (For Testing Only – No Real Emails)

Mailtrap catches all emails in a sandbox inbox — great for dev/testing without spamming.

1. Create free account at https://mailtrap.io
2. Go to **Email Testing > Inboxes > SMTP Settings**
3. Copy credentials:

   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=<your mailtrap user>
   SMTP_PASS=<your mailtrap pass>
   SMTP_FROM=FanVault Store <noreply@fanvault.store>
   ```

> Emails appear in your Mailtrap inbox, never reach real users.

---

## Step 2: Create the Root `.env` File

```bash
# In the project root:
cp .env.example .env
```

Then open `.env` and fill in **all** values:

```env
# MongoDB credentials
MONGO_ROOT_USER=fanvault_admin
MONGO_ROOT_PASS=choose_a_strong_password_here

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
JWT_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<another 64-char random hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Internal secret (any long random string)
INTERNAL_SECRET=<32+ char random string>

# SMTP (from Step 1)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=FanVault Store <your@gmail.com>

# CORS (frontend URL)
CORS_ORIGIN=http://localhost
```

**Generate random secrets quickly:**
```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Step 3: Install Docker Desktop

1. Download: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Verify:
   ```powershell
   docker --version
   docker compose version
   ```

---

## Step 4: Build and Run with Docker Compose

```powershell
# From the project root (where docker-compose.yml lives):
cd C:\Users\jayab\Study\UST-Devops\Mern-Hipster\Capstone-Project

# First run (builds all images):
docker compose up --build

# Subsequent runs (faster):
docker compose up

# Run in background (detached):
docker compose up -d --build

# View logs:
docker compose logs -f

# Stop:
docker compose down

# Stop and remove volumes (wipes MongoDB data):
docker compose down -v
```

---

## Step 5: Verify Everything is Running

After `docker compose up`, check all containers are healthy:

```powershell
docker compose ps
```

Expected output (all should be "healthy" or "running"):
```
NAME                    STATUS
fanvault-mongo          running (healthy)
fanvault-auth           running (healthy)
fanvault-user           running (healthy)
fanvault-product        running (healthy)
fanvault-order          running (healthy)
fanvault-email          running (healthy)
fanvault-frontend       running (healthy)
```

**Open the app:**  http://localhost

---

## Step 6: Test the Application

### Create your first user:
1. Go to http://localhost/register
2. Enter any email + password (min 8 chars)
3. You'll be logged in and redirected to the homepage

### Test email notifications:
1. Register / login
2. Browse products → add to cart
3. Go to cart → Checkout
4. Fill in a shipping address
5. Click "Place Order"
6. Check your SMTP inbox for the confirmation email

### Test API redirect (browser security):
1. While logged out, type: http://localhost/api/products
2. Should redirect to: http://localhost/login

---

## Step 7: Troubleshooting

### MongoDB connection fails
```powershell
# Check mongo logs
docker compose logs mongo

# Verify credentials match between .env and mongo container
```

### Email not sending
```powershell
# Check email-service logs
docker compose logs email-service

# Common causes:
# - Gmail: 2FA not enabled / App Password not used
# - Port 587 blocked by firewall (try port 465 with SMTP_SECURE=true)
# - Wrong SMTP_USER / SMTP_PASS
```

### Frontend shows blank page
```powershell
# Check frontend build logs
docker compose logs frontend

# Ensure all backend services are healthy first
docker compose ps
```

### Service won't start
```powershell
# Force rebuild
docker compose up --build --force-recreate
```

### Port 80 already in use
- Stop any local web server (IIS, Apache, Nginx)
- Or change frontend port in docker-compose.yml: `"8080:80"`

---

## Step 8: Create an Admin User (Optional)

To manage products (create/edit/delete), you need a user with `role: "admin"`.

Connect to MongoDB and update the role:
```powershell
# Connect to mongo container
docker exec -it fanvault-mongo mongosh -u fanvault_admin -p <your_password> --authenticationDatabase admin

# Switch to auth-db
use auth-db

# Find your user and promote to admin
db.authusers.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)

# Verify
db.authusers.findOne({ email: "your@email.com" }, { email: 1, role: 1 })
```

---

## Step 9: Prepare for Kubernetes (Next Stage)

When you're ready to move to Kubernetes:
1. Push your Docker images to a registry (DockerHub / ECR / GCR):
   ```powershell
   docker build -t yourdockerhub/fanvault-auth:v1 ./auth-service
   docker push yourdockerhub/fanvault-auth:v1
   # Repeat for each service
   ```
2. Create Kubernetes Secrets for all env vars (JWT, SMTP, Mongo credentials)
3. Create Deployments + Services for each microservice
4. Use a single shared MongoDB (StatefulSet) or managed MongoDB Atlas
5. Configure Ingress (or Gateway API) to replace Nginx proxy role

---

## Quick Reference – Service Ports

| Service | Internal Port | External (Docker) |
|---|---|---|
| Frontend (Nginx) | 80 | 80 |
| Auth Service | 3001 | Not exposed |
| User Service | 3002 | Not exposed |
| Product Service | 3003 | Not exposed |
| Order Service | 3004 | Not exposed |
| Email Service | 3005 | Not exposed |
| MongoDB | 27017 | 27017 (dev only) |

> In production / K8s: remove the MongoDB port exposure from docker-compose.yml.

---

## Environment Variables Summary

| Variable | Used By | Description |
|---|---|---|
| `MONGO_ROOT_USER` | Compose, all backends | MongoDB admin username |
| `MONGO_ROOT_PASS` | Compose, all backends | MongoDB admin password |
| `JWT_SECRET` | auth, user, product, order | Sign/verify access tokens |
| `JWT_REFRESH_SECRET` | auth | Sign/verify refresh tokens |
| `JWT_EXPIRES_IN` | auth | Access token TTL (default 15m) |
| `JWT_REFRESH_EXPIRES_IN` | auth | Refresh token TTL (default 7d) |
| `INTERNAL_SECRET` | email, user | Service-to-service auth header |
| `SMTP_HOST` | email | SMTP server hostname |
| `SMTP_PORT` | email | SMTP port (587 or 465) |
| `SMTP_SECURE` | email | true for port 465, false for 587 |
| `SMTP_USER` | email | SMTP username/email |
| `SMTP_PASS` | email | SMTP password / App Password |
| `SMTP_FROM` | email | From address in emails |
| `CORS_ORIGIN` | all backends | Allowed origin for CORS |
