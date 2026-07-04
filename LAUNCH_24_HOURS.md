# 🚀 KEYORA - LAUNCH IN 24 HOURS GUIDE

**Status:** ✅ **100% CODE COMPLETE**  
**Time to Production:** 24-48 hours  
**Team Size:** 1 DevOps engineer + 1 QA tester

---

## ⏰ HOUR-BY-HOUR TIMELINE

### HOURS 1-2: Environment Setup
```bash
# 1. Generate secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET

# 2. Create .env file with all values
cp .env.example .env
# Edit with production values

# 3. Create docker-compose.prod.yml
# (Already provided in PRODUCTION_DEPLOYMENT.md)
```

### HOURS 2-4: Infrastructure Provisioning
```bash
# 1. Database (PostgreSQL)
# Use AWS RDS, Google Cloud SQL, or self-hosted
# Connection: postgresql://user:pass@host:5432/keyora_db

# 2. Redis
# Use AWS ElastiCache, Google Memorystore, or Redis Cloud
# Connection: redis://host:6379

# 3. Domain & SSL
# Configure DNS A record
# Get SSL cert (Let's Encrypt)

# 4. Sentry
# Create account at sentry.io
# Get DSN
```

### HOURS 4-6: Deploy Containers
```bash
# SSH into production server
ssh user@prod-server
cd /opt/keyora

# Pull latest code
git clone https://github.com/your-org/keyora.git

# Copy prod config
cp docker-compose.prod.yml docker-compose.yml

# Start services
docker-compose up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### HOURS 6-8: Verify Deployment
```bash
# Check health
curl https://api.keyora.cm/health

# Check containers
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test core flows:
# 1. Register new user
# 2. Login
# 3. View listings
# 4. Create listing
# 5. Search listings
# 6. Send message
```

### HOURS 8-12: Monitoring & Alerts
```bash
# 1. Verify Sentry is capturing errors
# 2. Set up uptime monitoring
# 3. Configure backup scripts
# 4. Test backup restoration
# 5. Set up log aggregation
```

### HOURS 12-24: Final Testing & Launch
```bash
# 1. Full regression testing
# 2. Load testing (basic)
# 3. Security check
# 4. Email verification
# 5. Launch announcement
```

---

## ✅ CRITICAL SETUP ITEMS

### Must Do (Non-Negotiable)
- [ ] Set `.env` with strong secrets
- [ ] Configure SMTP (email will fail without it)
- [ ] Set up PostgreSQL database
- [ ] Set up Redis cache
- [ ] Configure Cloudinary API keys
- [ ] Get SSL certificate
- [ ] Configure domain DNS
- [ ] Test health endpoint

### Should Do (Before Users Access)
- [ ] Set up Sentry error tracking
- [ ] Configure uptime monitoring
- [ ] Set up database backups
- [ ] Test email sending
- [ ] Test payment system (if enabled)

### Nice to Have (Can do after launch)
- [ ] Advanced monitoring
- [ ] Log aggregation
- [ ] CDN for images
- [ ] Rate limiting tuning

---

## 🐳 QUICK DOCKER COMMANDS

```bash
# Start all services
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend      # Backend logs
docker-compose logs -f frontend     # Frontend logs
docker-compose logs -f postgres     # Database logs

# Execute command in container
docker-compose exec backend npm run build

# Rebuild specific service
docker-compose up -d --build backend

# SSH into container
docker-compose exec backend sh

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed
```

---

## 🔍 HEALTH CHECK ENDPOINTS

```bash
# Application health
curl https://api.keyora.cm/health
# Expected: {"status":"ok","database":"up","redis":"up",...}

# Readiness (for load balancers)
curl https://api.keyora.cm/health/ready
# Expected: {"ready":true}

# Liveness (for Kubernetes)
curl https://api.keyora.cm/health/live
# Expected: {"alive":true}
```

---

## 🆘 Troubleshooting (5 min fixes)

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. DATABASE_URL not set → Check .env
# 2. Migrations failed → Run: docker-compose exec backend npx prisma migrate deploy
# 3. Port conflict → Change port in .env or firewall
# 4. Secrets wrong → Regenerate and update .env
```

### Frontend won't load
```bash
# Check logs
docker-compose logs frontend

# Common issues:
# 1. API_URL wrong → Update .env
# 2. Build failed → Clear cache: docker-compose build --no-cache frontend
# 3. Port conflict → Change port in docker-compose
```

### Database connection error
```bash
# Test connection
docker-compose exec postgres psql -U user -d keyora_db -c "SELECT 1;"

# Common issues:
# 1. Wrong credentials → Update DATABASE_URL
# 2. Database doesn't exist → Create manually
# 3. Network issue → Verify connection string
```

### Email not sending
```bash
# Verify SMTP settings
# Test with:
docker-compose exec backend \
  node -e "require('./dist/common/email/email.service').default.test()"

# Common issues:
# 1. SMTP credentials wrong → Update .env
# 2. SMTP port blocked → Try port 465 instead of 587
# 3. API key invalid → Regenerate in email service
```

---

## 📊 Monitoring Checklist

After launch, monitor these every 5 minutes for first hour:

```
✅ [ ] API responding (curl /health)
✅ [ ] No error spike in Sentry
✅ [ ] Database connections healthy
✅ [ ] Redis cache working
✅ [ ] Emails sending
✅ [ ] Images uploading (Cloudinary)
✅ [ ] Users can register
✅ [ ] Users can login
✅ [ ] Chat is working
✅ [ ] Listings loading
```

---

## 🎯 Day 1 After Launch

### Morning (First 4 hours)
1. Monitor error rates in Sentry
2. Check database performance
3. Monitor server resources (CPU, memory, disk)
4. Test all core features manually
5. Collect early user feedback

### Afternoon
1. Review all error logs
2. Fix any critical issues immediately
3. Optimize slow queries if needed
4. Prepare for scaling if needed
5. Update status page

### Evening
1. Full security check
2. Database backup test
3. Disaster recovery test
4. Team sync-up

---

## 📋 Rollback Procedure (If Needed)

```bash
# If something critical fails:

# 1. Stop current version
docker-compose down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker-compose up -d --build

# 4. Run rollback migrations (if schema changed)
docker-compose exec backend npx prisma migrate resolve

# 5. Notify users
# Send status update to Slack/Twitter
```

---

## 🔑 Critical Files Location

```
.env                               → All secrets
docker-compose.prod.yml            → Production config
docker-compose.yml                 → Local development
PRODUCTION_DEPLOYMENT.md           → Full deployment guide
backend/prisma/schema.prisma       → Database schema
backend/src/                       → All APIs
frontend/src/                      → All pages
.github/workflows/ci-cd.yml        → CI/CD pipeline
```

---

## 📞 Emergency Contacts

**Who to call if...**

- **Backend crashes** → Check logs: `docker-compose logs backend`
- **Database down** → Check connection: `docker-compose logs postgres`
- **Frontend won't load** → Check build: `docker-compose logs frontend`
- **Email not working** → Check SMTP in `.env`
- **High error rate** → Check Sentry dashboard
- **Performance issues** → Monitor: `docker stats`
- **Out of disk space** → Run: `docker system prune`

---

## ✨ Success Criteria

**Launch is successful when:**

✅ All services return 200 status  
✅ At least 10 users can register  
✅ At least 5 users can login  
✅ At least 3 listings can be created  
✅ Search returns results  
✅ Messages can be sent  
✅ No error spike (< 1% error rate)  
✅ Response time < 1 second  
✅ CPU usage < 50%  
✅ Memory usage < 70%  

---

## 🚀 GO/NO-GO Decision (End of Hour 8)

**GO if:**
- ✅ All services responding
- ✅ No critical errors in logs
- ✅ Health checks passing
- ✅ Database accessible
- ✅ Email sending

**NO-GO if:**
- ❌ Services failing to start
- ❌ Database connection error
- ❌ High error rate (> 5%)
- ❌ Email system broken
- ❌ API timeout (> 5 seconds)

**Decision maker:** DevOps Lead

---

## 📝 Launch Announcement Template

```
🎉 Keyora is now LIVE! 🎉

✨ Features:
- Browse 1000+ verified properties
- Direct messaging with agents
- Smart search with maps
- Real-time alerts
- Secure payments

🔗 Visit: https://keyora.cm
📱 Mobile: https://app.keyora.cm (coming soon)

Questions? support@keyora.cm
```

---

## 🎓 Post-Launch Tasks

### Week 1
- Monitor all metrics daily
- Fix any reported bugs
- Collect user feedback
- Optimize slow features

### Week 2-4
- Promote to target users
- Monitor growth
- Optimize for scale
- Plan next features

### Month 2+
- Add real-time messaging (WebSocket)
- Add advanced features
- Mobile app launch
- International expansion

---

**Ready to launch? Let's go! 🚀**

Questions? Check `PRODUCTION_DEPLOYMENT.md` for full guide.

