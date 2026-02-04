# 🚀 Production Environment Variables Setup Guide

## 📋 Overview

This guide explains how to configure environment variables for production deployment of the Intern-Galing Platform.

**Important:** NEVER commit actual production `.env` files to GitHub! Only the `.env.production.example` templates are tracked in the repository.

---

## 📁 Environment Files Structure

Each service has two environment file templates:

- **`.env.example`** - Development/local environment template
- **`.env.production.example`** - Production deployment template *(NEW)*

### Protected Files (Not in Git)

These files are gitignored and should NEVER be committed:
- `.env` (local development)
- `.env.local`
- `.env.production` (actual production values)
- `.env.production.local`

---

## 🔧 Service-by-Service Configuration

### 1️⃣ Backend Service

**File:** `backend/.env.production.example`

**Required Variables:**
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
DOCUMENT_SERVICE_URL=https://your-document-service.onrender.com
AI_SERVICE_URL=https://your-ai-service.onrender.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-supabase-service-key
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-production-jwt-secret-CHANGE-THIS
REDIS_URL=redis://default:password@your-redis-host:port
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5
ALLOW_TEST_MODE=false
```

**Where to Get Values:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`: Supabase Dashboard → Settings → API
- `DATABASE_URL`: Supabase Dashboard → Settings → Database → Connection String
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `REDIS_URL`: Redis Cloud → Database → General → Public endpoint
- Service URLs: After deploying frontend, document-service, and ai-service

**Deployment Platform:** Render
- Dashboard → Service → Environment Variables
- Add all variables from template
- Click "Save Changes" → Service will auto-redeploy

---

### 2️⃣ Frontend Service

**File:** `frontend/.env.production.example`

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_BACKEND_SOCKET_URL=https://your-backend.onrender.com
NEXT_PUBLIC_DOCUMENT_SERVICE_URL=https://your-document-service.onrender.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-document-service.onrender.com
NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app
```

**Where to Get Values:**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API
- Backend/Document Service URLs: After deploying those services on Render
- `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (auto-generated)

**Deployment Platform:** Vercel
- Dashboard → Project → Settings → Environment Variables
- Add all variables (select "Production" environment)
- Click "Save" → Redeploy to apply changes

**Important Notes:**
- Use `wss://` (secure WebSocket) for `NEXT_PUBLIC_WEBSOCKET_URL` in production
- All `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public data only)

---

### 3️⃣ Document Service

**File:** `document-service/.env.production.example`

**Required Variables:**
```env
NODE_ENV=production
PORT=6000
WEBSOCKET_PORT=6001
FRONTEND_URL=https://your-frontend.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-supabase-service-key
STORAGE_BUCKET_DOCUMENTS=documents
STORAGE_SIGNED_URL_EXPIRES=3600
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_HASH_ALGORITHM=sha256
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://default:password@your-redis-host:port
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_UPLOAD_MAX=20
UPLOAD_MAX_SIZE_MB=50
```

**Where to Get Values:**
- Same sources as Backend Service (Supabase, Redis)
- `STORAGE_BUCKET_DOCUMENTS`: Supabase Storage bucket name (create in dashboard)

**Deployment Platform:** Render
- Dashboard → Service → Environment Variables
- Render automatically handles WebSocket on the same port as HTTP
- No separate WebSocket configuration needed

---

### 4️⃣ AI Service

**File:** `ai-service/.env.production.example`

**Required Variables:**
```env
PORT=8000
NODE_ENV=production
PYTHONUNBUFFERED=1
DATABASE_URL=postgresql://user:password@host:port/database
BACKEND_URL=https://your-backend.onrender.com
ALLOWED_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=10
RATE_LIMIT_ANALYSIS_PER_MINUTE=5
```

**Where to Get Values:**
- `BACKEND_URL`: Your deployed backend service URL (Render)
- `DATABASE_URL`: Same as other services (optional for AI service)

**Deployment Platform:** Render or Railway
- AI service is ONLY called by backend (server-to-server)
- Frontend NEVER calls AI service directly

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🔐 Security Best Practices

### Critical Rules:

1. **NEVER commit production `.env` files** - Always use `.env.production.example` templates
2. **Generate strong JWT secrets** - Use `openssl rand -base64 32` or similar
3. **Use different secrets for dev/prod** - Never reuse development secrets in production
4. **Enable rate limiting** - Set `RATE_LIMIT_ENABLED=true` in production
5. **Disable test mode** - Always set `ALLOW_TEST_MODE=false` in production
6. **Use secure WebSocket** - Use `wss://` instead of `ws://` in production
7. **Rotate secrets regularly** - Change JWT secrets, API keys every 3-6 months

### Environment Variable Checklist:

- [ ] All service URLs use HTTPS (not HTTP)
- [ ] WebSocket URLs use WSS (not WS)
- [ ] JWT secret is at least 32 characters long
- [ ] Rate limiting is enabled
- [ ] Test mode is disabled
- [ ] Supabase RLS policies are active
- [ ] Redis password is strong
- [ ] All secrets are unique (not copied from examples)

---

## 📝 Deployment Workflow

### Step 1: Prepare Production Environment Files

```bash
# Backend
cp backend/.env.production.example backend/.env.production
# Edit backend/.env.production with actual values

# Frontend
cp frontend/.env.production.example frontend/.env.production.local
# Edit frontend/.env.production.local with actual values

# Document Service
cp document-service/.env.production.example document-service/.env.production
# Edit document-service/.env.production with actual values

# AI Service
cp ai-service/.env.production.example ai-service/.env.production
# Edit ai-service/.env.production with actual values
```

**WARNING:** Do NOT commit these files! They are already in `.gitignore`.

### Step 2: Deploy Services in Order

1. **Deploy Backend** (Render) - Get backend URL
2. **Deploy Document Service** (Render) - Get document service URL
3. **Deploy AI Service** (Render/Railway) - Get AI service URL
4. **Deploy Frontend** (Vercel) - Use service URLs from steps 1-3

### Step 3: Update Environment Variables with Real URLs

After each deployment, update other services' environment variables with the deployed URLs.

**Example:**
1. Backend deployed → `https://intern-galing-backend.onrender.com`
2. Update frontend's `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_BACKEND_SOCKET_URL`
3. Redeploy frontend to use new URLs

### Step 4: Verify Connections

```bash
# Test backend health
curl https://your-backend.onrender.com/api/health

# Test document service
curl https://your-document-service.onrender.com/api/health

# Test AI service
curl https://your-ai-service.onrender.com/health

# Test frontend (open in browser)
https://your-frontend.vercel.app
```

---

## 🔄 Updating Environment Variables

### Vercel (Frontend):
1. Dashboard → Project → Settings → Environment Variables
2. Edit or add variables
3. Redeploy to apply changes

### Render (Backend/Services):
1. Dashboard → Service → Environment tab
2. Edit variables
3. Service auto-redeploys when you save

### Railway (AI Service - Alternative):
1. Dashboard → Project → Variables tab
2. Add/edit variables
3. Service auto-redeploys

---

## 🚨 Troubleshooting

### Issue: CORS Errors
**Solution:** Verify `FRONTEND_URL` in backend/document-service matches deployed frontend URL exactly (no trailing slash)

### Issue: WebSocket Connection Failed
**Solution:** 
- Ensure `NEXT_PUBLIC_WEBSOCKET_URL` uses `wss://` (not `ws://`)
- Verify document-service is running on Render
- Check browser console for WebSocket errors

### Issue: JWT Token Invalid
**Solution:**
- Verify `JWT_SECRET` is the same across all backend services
- Regenerate token by logging in again
- Check token expiration settings

### Issue: Database Connection Failed
**Solution:**
- Verify `DATABASE_URL` includes `?sslmode=require` suffix
- Check Supabase database status (Dashboard → Database)
- Ensure connection pooler is enabled in Supabase

### Issue: Redis Connection Failed
**Solution:**
- Verify `REDIS_URL` format (use `rediss://` for TLS)
- Check Redis Cloud database status
- Ensure IP whitelist includes your deployment platform IPs

---

## 📊 Environment Variables Reference

### Common Across All Services:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Service port | `5000`, `6000`, `8000` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` |
| `DATABASE_URL` | Yes | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Yes | Redis connection | `redis://...` |
| `RATE_LIMIT_ENABLED` | No | Enable rate limiting | `true` (recommended) |

### Frontend-Specific:

All variables must start with `NEXT_PUBLIC_` to be exposed to the browser.

### AI Service-Specific:

- Only accepts requests from backend (not frontend)
- `BACKEND_URL` must match deployed backend URL
- `PYTHONUNBUFFERED=1` for real-time logs

---

## 📞 Support

If you encounter issues during deployment:

1. Check service logs (Render/Vercel Dashboard → Logs)
2. Verify environment variables are correctly set
3. Test health endpoints (`/api/health`, `/health`)
4. Check CORS configuration in backend
5. Review Supabase logs for database errors

**Deployment Platforms Documentation:**
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Render Deployment Guide](https://render.com/docs)
- [Railway Deployment Guide](https://docs.railway.app)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

## ✅ Final Checklist

Before going live:

- [ ] All `.env.production.example` files reviewed
- [ ] Production `.env` files created locally (NOT committed)
- [ ] All secrets generated and stored securely
- [ ] All services deployed and health checks pass
- [ ] Environment variables updated with real URLs
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Supabase RLS policies active
- [ ] WebSocket connections tested
- [ ] End-to-end workflows tested (login, evaluations, documents)
- [ ] Monitoring/logging setup verified
- [ ] Backup credentials stored securely (password manager)

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
**Author:** Intern-Galing Platform Team
