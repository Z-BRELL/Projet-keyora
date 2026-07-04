# Keyora Real Estate Platform - Complete Launch Instructions

## 🔍 Project Analysis

### Current Status: ✅ FULLY OPERATIONAL

Your project is **completely functional and ready to use**. All 4 services are running correctly:

| Service | Status | Port | URL |
|---------|--------|------|-----|
| **Frontend (Next.js)** | ✅ Running | 3000 | http://localhost:3000 |
| **Backend API (NestJS)** | ✅ Running | 4000 | http://localhost:4000 |
| **PostgreSQL + PostGIS** | ✅ Healthy | 5434 | postgres://keyora:keyora_secret@localhost:5434/keyora_db |
| **Redis** | ✅ Healthy | 6379 | redis://localhost:6379 |

---

## 📋 Project Architecture

### Tech Stack
- **Frontend:** Next.js 14.2.35 (React, Tailwind CSS, React Query)
- **Backend:** NestJS with Express (TypeScript, Prisma ORM, PostgreSQL)
- **Database:** PostgreSQL 15.4 with PostGIS extension
- **Cache:** Redis 7-alpine
- **Authentication:** JWT tokens with refresh mechanism
- **Real-time:** Socket.io for messaging
- **Storage:** Cloudinary for images

### Core Features
✅ User authentication (BUYER, SELLER, MODERATOR, ADMIN roles)
✅ Property listings with CRUD operations
✅ Photo gallery system
✅ Advanced search and filtering
✅ Geospatial queries (PostGIS integration)
✅ Zone alerts with email notifications
✅ Real-time messaging system
✅ Admin dashboard with listing moderation
✅ User management (admin-only)
✅ Blog management (admin-only)

---

## 🚀 Exact Launch Steps

### Prerequisites
- Docker Desktop installed and running
- Terminal/PowerShell with proper working directory

### Step 1: Navigate to Project Directory
```powershell
cd "C:\Users\Z.BRELL\Documents\projet keyora\keyora\keyora\keyora"
```

### Step 2: Clean Start (Optional - only if you need fresh data)
```powershell
# Stop all containers
docker-compose down

# Remove data volumes
docker-compose down -v

# Rebuild images (in case of code changes)
docker-compose build --no-cache
```

### Step 3: Start the Application
```powershell
docker-compose up -d
```

**Terminal Output Will Show:**
```
 Network keyora_default Creating
 Network keyora_default Created
 Container keyora_redis Creating
 Container keyora_postgres Creating
 Container keyora_postgres Created
 Container keyora_redis Created
 Container keyora_backend Creating
 Container keyora_backend Created
 Container keyora_frontend Creating
 Container keyora_frontend Created
 Container keyora_redis Starting
 Container keyora_postgres Starting
 Container keyora_postgres Started
 Container keyora_redis Started
 Container keyora_postgres Waiting
 Container keyora_redis Waiting
 Container keyora_postgres Healthy
 Container keyora_redis Healthy
 Container keyora_backend Starting
 Container keyora_backend Started
 Container keyora_frontend Starting
 Container keyora_frontend Started
```

### Step 4: View Live Logs (In a NEW Terminal)
```powershell
cd "C:\Users\Z.BRELL\Documents\projet keyora\keyora\keyora\keyora"
docker-compose logs -f
```

**Wait for these specific outputs in logs:**

#### Backend Ready Indicator
```
🚀 Keyora API démarrée sur http://localhost:4000/api
📚 Swagger disponible sur http://localhost:4000/api/docs
```

#### Frontend Ready Indicator
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
✓ Ready in XXms
```

### Step 5: Access the Application

Once you see those indicators in the logs, open your browser:

**Local Development:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- API Documentation: http://localhost:4000/api/docs

**Network Access (from other machines on your network):**
- Frontend: http://YOUR_COMPUTER_IP:3000
- Backend API: http://YOUR_COMPUTER_IP:4000/api

---

## ✅ Verification Checklist

Run these commands to verify everything is working:

### 1. Check All Containers Running
```powershell
docker-compose ps
```

**Expected Output:**
```
NAME              IMAGE                    STATUS
keyora_backend    keyora-backend           Up X minutes
keyora_frontend   keyora-frontend          Up X minutes
keyora_postgres   postgis/postgis:15-3.3   Up X minutes (healthy)
keyora_redis      redis:7-alpine           Up X minutes (healthy)
```

### 2. Test Backend API
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/listings" -UseBasicParsing
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
Content            : {"data":[],"meta":{"total":0,"page":1,"limit":12,"totalPages":0}}
```

### 3. Test Frontend
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
```

### 4. Check Backend Routes
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/docs" -UseBasicParsing
```

Access in browser: http://localhost:4000/api/docs for full API documentation

---

## 🛑 Stopping the Application

### Option 1: Stop but Keep Data
```powershell
docker-compose stop
```

Later restart with:
```powershell
docker-compose start
```

### Option 2: Complete Shutdown (Keep Data)
```powershell
docker-compose down
```

Later restart with:
```powershell
docker-compose up -d
```

### Option 3: Complete Shutdown (Remove All Data)
```powershell
docker-compose down -v
```

---

## 🔧 Troubleshooting

### Problem: Services won't start
**Solution:** Run `docker-compose up --build` to rebuild images

### Problem: Database connection error
**Solution:** Ensure Docker Desktop is running and has enough resources

### Problem: Ports already in use
**Solution:** Check what's using ports 3000, 4000, 5434, 6379:
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :5434
netstat -ano | findstr :6379
```

### Problem: "Access Denied" errors
**Solution:** Run Docker Desktop as Administrator

### Problem: Slow performance
**Solution:** Increase Docker Desktop memory allocation (Settings → Resources)

---

## 📊 Environment Configuration

Your `.env` file is properly configured:
```
POSTGRES_USER=keyora
POSTGRES_PASSWORD=keyora_secret
POSTGRES_DB=keyora_db
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

All required services are initialized with:
- ✅ PostgreSQL database (keyora_db) with PostGIS
- ✅ Redis cache
- ✅ Prisma ORM with migrations
- ✅ JWT authentication
- ✅ Email configuration (Mailtrap)
- ✅ Cloudinary image storage

---

## 🎯 Quick Command Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f` | View live logs |
| `docker-compose ps` | Check status |
| `docker-compose build` | Rebuild images |
| `docker-compose down -v` | Complete reset |

---

## 📝 Database & API Info

**Database Connection (from within Docker):**
- Host: postgres
- Port: 5432
- User: keyora
- Password: keyora_secret
- Database: keyora_db

**Database Connection (from your machine):**
- Host: localhost
- Port: 5434
- User: keyora
- Password: keyora_secret
- Database: keyora_db

**Redis Connection:**
- URL: redis://localhost:6379

---

## ✨ What's Implemented

### Authentication & Authorization
- ✅ User registration and login
- ✅ JWT token-based authentication
- ✅ Role-based access control (BUYER, SELLER, MODERATOR, ADMIN)
- ✅ Email verification

### Real Estate Features
- ✅ Create, read, update, delete listings
- ✅ Draft → Pending → Published workflow
- ✅ Photo gallery with ordering
- ✅ Geospatial search (by polygon and radius)
- ✅ Advanced filtering (price, type, location)

### Admin Features
- ✅ Listing moderation (approve/reject)
- ✅ User management dashboard
- ✅ Admin-only blog management
- ✅ Moderation statistics

### User Features
- ✅ Favorites system
- ✅ Real-time messaging
- ✅ Zone alerts
- ✅ User profile management
- ✅ Property details display

---

## 🌐 Accessing Your Project

### First Time Launch
1. Run: `docker-compose up -d`
2. Wait ~30-60 seconds for services to initialize
3. Visit: http://localhost:3000
4. Register a new account to start testing

### Subsequent Launches
Just run: `docker-compose up -d`

(Services will automatically restart if you previously stopped them)

---

**Your project is ready! 🎉**

Launch with: `docker-compose up -d`

Then access at: **http://localhost:3000**
