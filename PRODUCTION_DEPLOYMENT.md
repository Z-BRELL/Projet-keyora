# 🚀 KEYORA - PRODUCTION DEPLOYMENT GUIDE

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Generate strong JWT secrets
- [ ] Configure SMTP credentials
- [ ] Set up Cloudinary account
- [ ] Provision PostgreSQL database
- [ ] Set up Redis instance
- [ ] Configure domain & SSL

---

## 🔐 Required Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/keyora_db"

# Redis
REDIS_URL="redis://host:6379"

# JWT
JWT_SECRET="generate-strong-random-string-here"
JWT_REFRESH_SECRET="generate-another-strong-string-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (SMTP)
SMTP_HOST="smtp.mailtrap.io"  # or your SMTP provider
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"

# Cloudinary (Images)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Frontend URL
FRONTEND_URL="https://keyora.cm"

# App
PORT="4000"
NODE_ENV="production"

# Sentry (Error tracking)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/projectid"
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="https://api.keyora.cm"
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token-if-using-mapbox"
```

---

## 🏗️ Production Infrastructure Setup

### Database Setup (PostgreSQL)

```bash
# Create database user
CREATE USER keyora_user WITH PASSWORD 'strong-password-here';

# Create database
CREATE DATABASE keyora_db OWNER keyora_user;

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE keyora_db TO keyora_user;
```

### Redis Setup

```bash
# Using managed service (recommended for production)
# AWS ElastiCache, Google Cloud Memorystore, or similar

# Connection string
redis://username:password@host:6379/0
```

### SSL/HTTPS Certificate

```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly --standalone -d api.keyora.cm -d keyora.cm

# Certificate location
/etc/letsencrypt/live/keyora.cm/fullchain.pem
/etc/letsencrypt/live/keyora.cm/privkey.pem
```

---

## 🐳 Docker Production Setup

### docker-compose.prod.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: keyora_postgres
    restart: always
    environment:
      POSTGRES_USER: keyora_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: keyora_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U keyora_user']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: keyora_redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/your-org/keyora-backend:latest
    container_name: keyora_backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://keyora_user:${POSTGRES_PASSWORD}@postgres:5432/keyora_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      FRONTEND_URL: https://keyora.cm
      NODE_ENV: production
      SENTRY_DSN: ${SENTRY_DSN}
    ports:
      - "4000:4000"
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:4000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ghcr.io/your-org/keyora-frontend:latest
    container_name: keyora_frontend
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: https://api.keyora.cm
      NODE_ENV: production
    ports:
      - "3000:3000"
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:3000']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## 🔄 Database Backup Strategy

### Automated Daily Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/keyora"
DB_NAME="keyora_db"
DB_USER="keyora_user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/keyora_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "keyora_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/keyora_$TIMESTAMP.sql.gz s3://keyora-backups/

echo "Backup completed: $TIMESTAMP"
```

### Add to Crontab

```bash
# Run daily at 2 AM UTC
0 2 * * * /usr/local/bin/backup.sh >> /var/log/keyora-backup.log 2>&1
```

---

## 🔍 Monitoring & Logging Setup

### Sentry Configuration (Error Tracking)

```bash
# Install Sentry integration
npm install @sentry/nestjs @sentry/tracing

# Add to backend main.ts
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Health Checks

```bash
# Test health endpoint
curl https://api.keyora.cm/health

# Response
{
  "status": "ok",
  "timestamp": "2026-06-12T10:00:00Z",
  "database": "up",
  "redis": "up",
  "uptime": 3600,
  "environment": "production"
}
```

### Logging Setup

```bash
# View logs for each service
docker logs keyora_backend -f
docker logs keyora_frontend -f
docker logs keyora_postgres -f

# Save logs to file
docker logs keyora_backend > /var/log/keyora-backend.log 2>&1
```

---

## 🚀 Deployment Commands

### First-Time Deployment

```bash
# SSH into production server
ssh user@production-server

# Clone repository
git clone https://github.com/your-org/keyora.git
cd keyora

# Create .env file
cp .env.example .env
# Edit .env with production values

# Create docker-compose.prod.yml and edit

# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed database (if needed)
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

### Subsequent Deployments

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if schema changed
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Rollback (if something goes wrong)

```bash
# Checkout previous version
git checkout <previous-commit>

# Rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations rollback (if needed)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve
```

---

## 🔒 Security Checklist

- [ ] All environment variables set
- [ ] SSL/HTTPS certificates installed
- [ ] Firewall rules configured
- [ ] Database backup automated
- [ ] Error monitoring (Sentry) enabled
- [ ] Logging centralized
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database passwords strong
- [ ] JWT secrets rotated regularly
- [ ] No secrets in git repository
- [ ] Security headers configured (Helmet)

---

## 📊 Performance Monitoring

### Monitor Database Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check connection count
SELECT count(*) as connection_count 
FROM pg_stat_activity;

-- Check disk usage
SELECT pg_database.datname, 
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size 
FROM pg_database 
ORDER BY pg_database_size(pg_database.datname) DESC;
```

### Monitor Redis Performance

```bash
# Check memory usage
redis-cli INFO memory

# Check connected clients
redis-cli INFO clients

# Check key count
redis-cli DBSIZE
```

---

## 🆘 Troubleshooting

### Backend won't start

```bash
# Check logs
docker logs keyora_backend

# Check health
curl http://localhost:4000/health

# Restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Database connection issues

```bash
# Check connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U keyora_user -d keyora_db -c "SELECT 1;"

# Check logs
docker logs keyora_postgres
```

### High memory usage

```bash
# Check container memory
docker stats keyora_backend

# Increase memory limit in docker-compose.prod.yml
services:
  backend:
    mem_limit: 512m
```

---

## 📞 Support

For issues or questions:
1. Check logs: `docker logs <container>`
2. Check health endpoint: `curl https://api.keyora.cm/health`
3. Contact DevOps team
4. Review documentation at https://docs.keyora.cm

