# 📋 Environment Variables Quick Reference

## 🔍 Quick Lookup Table

### Backend Service (Port 5000)

| Variable | Value Source | Example |
|----------|--------------|---------|
| `FRONTEND_URL` | Vercel deployment URL | `https://intern-galing.vercel.app` |
| `DOCUMENT_SERVICE_URL` | Render service URL | `https://intern-galing-docs.onrender.com` |
| `AI_SERVICE_URL` | Render/Railway URL | `https://intern-galing-ai.onrender.com` |
| `SUPABASE_URL` | Supabase → Settings → API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API | `eyJhbGc...` (secret role key) |
| `DATABASE_URL` | Supabase → Settings → Database | `postgresql://postgres.[ref]:[pass]@...` |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | Random 32+ char string |
| `REDIS_URL` | Redis Cloud → Database → Endpoint | `redis://default:[pass]@host:port` |

---

### Frontend Service (Port 3000)

| Variable | Value Source | Example |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as backend `SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJhbGc...` (anon key, safe for client) |
| `NEXT_PUBLIC_API_URL` | Backend URL + `/api` | `https://backend.onrender.com/api` |
| `NEXT_PUBLIC_BACKEND_SOCKET_URL` | Backend URL (no `/api`) | `https://backend.onrender.com` |
| `NEXT_PUBLIC_DOCUMENT_SERVICE_URL` | Document service URL | `https://docs.onrender.com` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | Document service with `wss://` | `wss://docs.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Vercel deployment URL | `https://intern-galing.vercel.app` |

---

### Document Service (Port 6000/6001)

| Variable | Value Source | Example |
|----------|--------------|---------|
| `FRONTEND_URL` | Vercel deployment URL | `https://intern-galing.vercel.app` |
| `SUPABASE_URL` | Supabase → Settings → API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API | `eyJhbGc...` (secret role key) |
| `STORAGE_BUCKET_DOCUMENTS` | Supabase Storage bucket name | `documents` |
| `DATABASE_URL` | Supabase → Settings → Database | `postgresql://...` |
| `REDIS_URL` | Redis Cloud → Database → Endpoint | `redis://...` |

---

### AI Service (Port 8000)

| Variable | Value Source | Example |
|----------|--------------|---------|
| `BACKEND_URL` | Backend Render URL | `https://backend.onrender.com` |
| `ALLOWED_ORIGINS` | Backend + Frontend URLs | `https://backend.onrender.com,https://frontend.vercel.app` |
| `DATABASE_URL` | Optional - same as backend | `postgresql://...` |

---

## 🎯 Where to Add Environment Variables

### Vercel (Frontend)
1. **Dashboard** → Select Project
2. **Settings** → **Environment Variables**
3. Add each `NEXT_PUBLIC_*` variable
4. Select **"Production"** environment
5. Click **"Save"** → Auto-redeploys

### Render (Backend, Document Service, AI Service)
1. **Dashboard** → Select Service
2. **Environment** tab (left sidebar)
3. Click **"Add Environment Variable"**
4. Enter Key + Value
5. Click **"Save Changes"** → Auto-redeploys

### Railway (AI Service - Alternative)
1. **Dashboard** → Select Project
2. **Variables** tab
3. Click **"New Variable"**
4. Enter Key + Value
5. Auto-saves and redeploys

---

## 🔐 Security Settings (All Services)

**Production Must-Haves:**

```env
NODE_ENV=production
RATE_LIMIT_ENABLED=true
ALLOW_TEST_MODE=false  # Backend only
```

**Rate Limiting:**

| Service | Variable | Recommended Value |
|---------|----------|-------------------|
| Backend | `RATE_LIMIT_MAX_REQUESTS` | `100` |
| Backend | `RATE_LIMIT_AUTH_MAX` | `5` |
| Document | `RATE_LIMIT_UPLOAD_MAX` | `20` |
| AI Service | `RATE_LIMIT_REQUESTS_PER_MINUTE` | `10` |
| AI Service | `RATE_LIMIT_ANALYSIS_PER_MINUTE` | `5` |

---

## ⚡ Deployment Order & URL Dependencies

**Step-by-step deployment to avoid circular dependencies:**

```mermaid
graph TD
    A[1. Deploy Backend] --> B[Get Backend URL]
    B --> C[2. Deploy Document Service]
    C --> D[Get Document Service URL]
    D --> E[3. Deploy AI Service]
    E --> F[Get AI Service URL]
    F --> G[4. Update Backend Env with Service URLs]
    G --> H[5. Deploy Frontend with All URLs]
```

**Initial Placeholder Values:**
- Use `http://localhost:PORT` during first deployment
- Update with real URLs after each service is deployed
- Redeploy services after updating URLs

---

## 🔄 Update Checklist

When you deploy a new service, update these:

### After Backend Deploys:
- ✅ Update Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BACKEND_SOCKET_URL`
- ✅ Update AI Service: `BACKEND_URL`, `ALLOWED_ORIGINS`

### After Document Service Deploys:
- ✅ Update Backend: `DOCUMENT_SERVICE_URL`
- ✅ Update Frontend: `NEXT_PUBLIC_DOCUMENT_SERVICE_URL`, `NEXT_PUBLIC_WEBSOCKET_URL`

### After AI Service Deploys:
- ✅ Update Backend: `AI_SERVICE_URL`

### After Frontend Deploys:
- ✅ Update Backend: `FRONTEND_URL`
- ✅ Update Document Service: `FRONTEND_URL`
- ✅ Update AI Service: `ALLOWED_ORIGINS`

---

## 🐛 Common Mistakes & Fixes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **Trailing slash in URL** | CORS errors | Remove `/` at end: `https://app.com` not `https://app.com/` |
| **Using `http://` in production** | Mixed content errors | Use `https://` and `wss://` |
| **Wrong WebSocket protocol** | WebSocket failed | Use `wss://` not `ws://` |
| **Missing `/api` suffix** | 404 errors | Frontend API URL needs `/api`: `https://backend.com/api` |
| **Forgetting to redeploy** | Changes not applied | Always redeploy after env var changes |
| **Using same JWT secret** | Security risk | Generate unique secret for production |

---

## 📞 Quick Diagnostics

### Test Backend:
```bash
curl https://your-backend.onrender.com/api/health
```

### Test Document Service:
```bash
curl https://your-document-service.onrender.com/api/health
```

### Test AI Service:
```bash
curl https://your-ai-service.onrender.com/health
```

### Test Frontend:
```bash
# Open in browser
https://your-frontend.vercel.app

# Check browser console (F12) for errors
```

---

## 📚 Related Documentation

- [Full Production Setup Guide](./PRODUCTION_ENV_SETUP.md)
- [Deployment Step-by-Step](../../README.md#deployment)
- [Backend API Documentation](../api/rest-endpoints.md)
- [WebSocket Events](../api/websocket-events.md)

---

**Pro Tip:** Store all production URLs in a password manager (1Password, LastPass) for easy reference! 🔐
