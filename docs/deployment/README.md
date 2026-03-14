# 📚 Deployment Documentation

This folder contains all documentation needed to deploy the Intern-Galing Platform to production.

---

## 📋 Table of Contents

1. [Production Environment Variables Setup](#production-environment-variables-setup) ⭐ **START HERE**
2. [Quick Reference Guide](#quick-reference-guide)
3. [Deployment Step-by-Step](#deployment-step-by-step)
4. [Security Checklist](#security-checklist)
5. [Environment Variables Details](#environment-variables-details)

---

## 🚀 Production Environment Variables Setup

**File:** [`PRODUCTION_ENV_SETUP.md`](./PRODUCTION_ENV_SETUP.md)

**⭐ Start here for first-time deployment!**

This comprehensive guide covers:
- Overview of environment files structure
- Service-by-service configuration (Backend, Frontend, Document Service, AI Service)
- Where to get each environment variable value
- Security best practices & checklist
- Deployment workflow (step-by-step order)
- Troubleshooting common issues
- Final pre-launch checklist

**Who should read this:** Developers deploying the platform for the first time, IT professionals setting up production environments.

---

## ⚡ Quick Reference Guide

**File:** [`ENV_VARIABLES_QUICK_REF.md`](./ENV_VARIABLES_QUICK_REF.md)

**Quick lookup table for all environment variables!**

Perfect for:
- Quick lookups during deployment
- Updating environment variables after initial setup
- Verifying configuration values
- Troubleshooting connectivity issues

Contains:
- Environment variables by service (table format)
- Where to add variables in each platform (Vercel/Render/Railway)
- Deployment order & URL dependencies
- Common mistakes & fixes
- Quick diagnostic commands

**Who should read this:** Anyone who needs to quickly look up or update environment variables.

---

## 📖 Deployment Step-by-Step

**File:** [`deployment-guide.md`](./deployment-guide.md)

**Complete deployment process from start to finish.**

Covers:
- Prerequisites (accounts, tools needed)
- Service deployment order
- Platform-specific instructions (Vercel, Render, Railway)
- Post-deployment verification
- Monitoring & logging setup

**Who should read this:** DevOps engineers, system administrators, thesis advisors overseeing deployment.

---

## 🔐 Security Checklist

**File:** [`SECURITY_PRE_DEPLOYMENT_CHECKLIST.md`](./SECURITY_PRE_DEPLOYMENT_CHECKLIST.md)

**Security audit checklist before going live.**

Essential checks:
- Authentication & authorization
- API security (CORS, rate limiting)
- Database security (RLS, SSL)
- Secret management
- Data validation & sanitization
- Monitoring & logging

**Who should read this:** Security team, thesis panel evaluators, IT professionals.

---

## 📝 Environment Variables Details

**File:** [`environment-variables.md`](./environment-variables.md)

**Detailed explanation of each environment variable.**

Contains:
- Variable descriptions & purposes
- Default values & recommendations
- Security implications
- Platform-specific notes

**Who should read this:** Developers needing deep understanding of configuration options.

---

## 🎯 Recommended Reading Order

### For First-Time Deployment:

1. **Read:** [`PRODUCTION_ENV_SETUP.md`](./PRODUCTION_ENV_SETUP.md) - Understand the full setup
2. **Reference:** [`ENV_VARIABLES_QUICK_REF.md`](./ENV_VARIABLES_QUICK_REF.md) - Look up values as you go
3. **Follow:** [`deployment-guide.md`](./deployment-guide.md) - Deploy services step-by-step
4. **Verify:** [`SECURITY_PRE_DEPLOYMENT_CHECKLIST.md`](./SECURITY_PRE_DEPLOYMENT_CHECKLIST.md) - Security audit before launch

### For Updating Existing Deployment:

1. **Reference:** [`ENV_VARIABLES_QUICK_REF.md`](./ENV_VARIABLES_QUICK_REF.md) - Find the variable you need
2. **Check:** [`environment-variables.md`](./environment-variables.md) - Understand impact of changes
3. **Update:** Platform dashboard (Vercel/Render)
4. **Verify:** Health check endpoints

---

## 📁 Environment Files Location

Each service has production environment templates in the repository:

```
internship-platform/
├── backend/
│   ├── .env.example                 # Development template
│   └── .env.production.example      # Production template ✅
├── frontend/
│   ├── .env.example                 # Development template
│   └── .env.production.example      # Production template ✅
├── document-service/
│   ├── .env.example                 # Development template
│   └── .env.production.example      # Production template ✅
└── ai-service/
    ├── .env.example                 # Development template
    └── .env.production.example      # Production template ✅
```

**Important:** `.env.production.example` files are tracked in Git. Actual `.env.production` files are gitignored and must NEVER be committed.

---

## 🛠️ Tools & Platforms

### Recommended Free-Tier Services:

| Service | Tool | Tier | Limit |
|---------|------|------|-------|
| Frontend Hosting | [Vercel](https://vercel.com) | Free | Unlimited hobby projects |
| Backend Hosting | [Render](https://render.com) | Free | 750 hours/month per service |
| Database & Auth | [Supabase](https://supabase.com) | Free | 500MB storage, 2GB bandwidth |
| Redis Cache | [Redis Cloud](https://redis.com/try-free/) | Free | 30MB |
| Monitoring | [Better Stack](https://betterstack.com) | Free | Basic logs & uptime |

### Required Accounts:

- [ ] GitHub account (for repository access)
- [ ] Vercel account (sign up with GitHub)
- [ ] Render account (sign up with GitHub)
- [ ] Supabase account (for database)
- [ ] Redis Cloud account (for caching)

---

## 📞 Support & Resources

### Internal Documentation:

- [Backend API Endpoints](../api/rest-endpoints.md)
- [WebSocket Events](../api/websocket-events.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Authentication Flow](../api/AUTH_INTEGRATION_SUMMARY.md)

### External Resources:

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 🚨 Common Issues

### Issue: "Cannot connect to backend"
**Solution:** Check `NEXT_PUBLIC_API_URL` in frontend environment variables.

**Reference:** [`ENV_VARIABLES_QUICK_REF.md`](./ENV_VARIABLES_QUICK_REF.md#common-mistakes--fixes)

### Issue: "WebSocket connection failed"
**Solution:** Use `wss://` (not `ws://`) for `NEXT_PUBLIC_WEBSOCKET_URL`.

**Reference:** [`PRODUCTION_ENV_SETUP.md`](./PRODUCTION_ENV_SETUP.md#troubleshooting)

### Issue: "CORS error"
**Solution:** Verify `FRONTEND_URL` matches deployed frontend URL exactly (no trailing slash).

**Reference:** [`PRODUCTION_ENV_SETUP.md`](./PRODUCTION_ENV_SETUP.md#troubleshooting)

### Issue: "JWT token invalid"
**Solution:** Ensure `JWT_SECRET` is the same in all backend services.

**Reference:** [`SECURITY_PRE_DEPLOYMENT_CHECKLIST.md`](./SECURITY_PRE_DEPLOYMENT_CHECKLIST.md)

---

## ✅ Quick Start Checklist

Ready to deploy? Follow this quick checklist:

- [ ] Read [`PRODUCTION_ENV_SETUP.md`](./PRODUCTION_ENV_SETUP.md)
- [ ] Create accounts on Vercel, Render, Supabase, Redis Cloud
- [ ] Set up Supabase database & run migrations
- [ ] Generate strong JWT secret (`openssl rand -base64 32`)
- [ ] Copy `.env.production.example` to `.env.production` for each service
- [ ] Deploy backend service first (get backend URL)
- [ ] Deploy document service (get document service URL)
- [ ] Deploy AI service (get AI service URL)
- [ ] Update all environment variables with real URLs
- [ ] Deploy frontend (use all service URLs)
- [ ] Run security checklist before going live
- [ ] Test all critical workflows (login, evaluations, documents)
- [ ] Monitor logs for first 24 hours

---

## 📅 Last Updated

**Date:** February 4, 2026  
**Version:** 1.0.0  
**Author:** Intern-Galing Platform Team

---

## 📝 Changelog

### v1.0.0 (February 4, 2026)
- ✅ Created production environment templates for all services
- ✅ Added comprehensive deployment documentation
- ✅ Created quick reference guide for environment variables
- ✅ Updated .gitignore files to protect production configs
- ✅ Added security checklist for pre-deployment audit
- ✅ Fixed missing `DOCUMENT_SERVICE_URL` in backend config

---

**Need help?** Check the relevant documentation file above or open an issue on GitHub! 🚀
