# 🔒 Security Pre-Deployment Checklist

**Intern-Galing Platform - Production Deployment Security Guide**  
**Last Updated:** January 19, 2026

---

## 📋 Pre-Deployment Checklist

Complete all items before deploying to production. Each section is critical for security.

---

### 1️⃣ Environment Variables Audit

**Backend (`backend/.env`):**
- [ ] `NODE_ENV` is set to `production`
- [ ] `ALLOW_TEST_MODE` is NOT set or set to `false`
- [ ] `SUPABASE_URL` points to production Supabase instance
- [ ] `SUPABASE_SERVICE_KEY` is unique production key (not development)
- [ ] `JWT_SECRET` is strong (min 32 characters, randomly generated)
- [ ] `FRONTEND_URL` is your production frontend URL
- [ ] `REDIS_URL` points to production Redis instance
- [ ] `AI_SERVICE_URL` points to production AI service
- [ ] Rate limit settings configured:
  - `RATE_LIMIT_WINDOW_MS` (default: 900000 = 15 min)
  - `RATE_LIMIT_MAX_REQUESTS` (default: 100 for production)
  - `RATE_LIMIT_AUTH_MAX` (default: 5 - stricter for auth)
  - `RATE_LIMIT_ENABLED` (default: true)

**Document Service (`document-service/.env`):**
- [ ] `NODE_ENV` is set to `production`
- [ ] `SUPABASE_URL` points to production Supabase
- [ ] `SUPABASE_SERVICE_KEY` is production key
- [ ] `FRONTEND_URL` is production frontend URL
- [ ] `REDIS_URL` points to production Redis
- [ ] Rate limit settings configured (same as backend)
- [ ] `UPLOAD_MAX_SIZE_MB` configured (default: 50)

**AI Service (`ai-service/.env`):**
- [ ] `NODE_ENV` is set to `production`
- [ ] `BACKEND_URL` is production backend URL
- [ ] `ALLOWED_ORIGINS` includes production URLs only
- [ ] Rate limit settings configured:
  - `RATE_LIMIT_ENABLED` (default: true)
  - `RATE_LIMIT_REQUESTS_PER_MINUTE` (default: 10)
  - `RATE_LIMIT_ANALYSIS_PER_MINUTE` (default: 5)

**Frontend (`frontend/.env.local`):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to production Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is production anon key
- [ ] `NEXT_PUBLIC_API_URL` is production backend URL
- [ ] `NEXT_PUBLIC_BACKEND_SOCKET_URL` is production WebSocket URL
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL` is document service WebSocket URL
- [ ] `NEXT_PUBLIC_APP_URL` is your production domain

---

### 2️⃣ Secret Key Generation

Use these commands to generate secure keys:

```bash
# Generate JWT_SECRET (32+ bytes, base64)
openssl rand -base64 32

# Generate strong password for Redis
openssl rand -base64 24

# Verify no secrets in code
grep -r "SUPABASE_SERVICE_KEY\|JWT_SECRET" --include="*.ts" --include="*.tsx" --include="*.js" backend/ frontend/
# Should return ONLY process.env references, never actual values
```

---

### 3️⃣ No Secrets Committed

- [ ] `.env` files are in `.gitignore` for all services
- [ ] No hardcoded API keys in source code
- [ ] `.env.example` files contain only placeholder values
- [ ] Run check: `git log --all -p | grep -i "supabase_service_key\|jwt_secret"` returns nothing

---

### 4️⃣ Supabase Security

- [ ] Row Level Security (RLS) enabled on ALL tables
- [ ] Verify RLS policies in Supabase Dashboard:
  - `users` table: Users can only read/update their own data
  - `evaluations` table: Role-based access enforced
  - `documents` table: Owner/access control enforced
  - `conversations` table: Participant-only access
  - `messages` table: Conversation participant access
- [ ] Service key only used server-side (never in frontend)
- [ ] Anon key has appropriate RLS restrictions
- [ ] Auth settings:
  - Email confirmation enabled (if required)
  - Password requirements configured
  - Session timeout configured

---

### 5️⃣ Rate Limiting Verification

Test rate limits are working:

```bash
# Test backend auth rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done
# Attempts 6-10 should return 429

# Test AI service rate limit
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/dashboard-insights \
    -H "Content-Type: application/json" \
    -d '{"evaluations":[],"max_insights":5}' \
    -w "\nStatus: %{http_code}\n"
done
# Should return 429 after 10 requests
```

---

### 6️⃣ Security Headers Verification

Test security headers are present:

```bash
# Check backend headers
curl -I http://localhost:5000/health

# Should include:
# - Content-Security-Policy
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY (or SAMEORIGIN)
# - Strict-Transport-Security (in production with HTTPS)
# - X-XSS-Protection

# Check document service headers
curl -I http://localhost:6001/health
```

---

### 7️⃣ WebSocket Authentication

Test document WebSocket requires auth:

```javascript
// This should FAIL (no token)
const socket = io('http://localhost:6001');
socket.on('connect_error', (err) => {
  console.log('Expected error:', err.message); // "Authentication required"
});

// This should SUCCEED (with valid token)
const socket = io('http://localhost:6001', {
  auth: { token: 'valid-supabase-jwt-token' }
});
```

---

### 8️⃣ Input Validation Testing

Test XSS protection:

```bash
# This should be sanitized (no script tag in response)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","first_name":"<script>alert(1)</script>","last_name":"Test"}'

# Check the first_name is sanitized (should be "alert(1)" without script tags)
```

---

### 9️⃣ File Upload Validation

Test file upload restrictions:

```bash
# This should FAIL (wrong MIME type)
curl -X POST http://localhost:6001/api/documents/test-id/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@malicious.exe"
# Should return 400: "File type not allowed"

# This should FAIL (file too large > 50MB)
# Create a large test file first
dd if=/dev/zero of=large_file.pdf bs=1M count=60
curl -X POST http://localhost:6001/api/documents/test-id/files \
  -H "Authorization: Bearer <token>" \
  -F "file=@large_file.pdf"
# Should return 413: "File too large"
```

---

### 🔟 CORS Verification

Test CORS is restricted:

```bash
# AI Service - should reject non-whitelisted origins
curl -X POST http://localhost:8000/api/dashboard-insights \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"evaluations":[]}'
# Should be blocked or return CORS error
```

---

## 🚀 Deployment Commands

### Install Dependencies (if new packages added)

```bash
# Backend
cd backend && npm install

# Document Service
cd document-service && npm install

# AI Service (in virtual environment)
cd ai-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Start Services

```bash
# Backend
cd backend && npm run build && npm start

# Document Service
cd document-service && npm run build && npm start

# AI Service
cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend && npm run build && npm start
```

---

## 📊 Post-Deployment Monitoring

### Monitor Rate Limit Events

Check logs for rate limit warnings:
```bash
# Backend logs
grep "RATE LIMIT" logs/backend.log

# AI Service logs
grep "RATE LIMIT" logs/ai-service.log
```

### Monitor Security Events

```bash
# Check for auth failures
grep "AUTH RATE LIMIT\|SECURITY" logs/backend.log

# Check for WebSocket auth failures
grep "SECURITY\|auth failed" logs/document-service.log
```

---

## ⚠️ Emergency: Disable Rate Limiting

If rate limits are too strict and blocking legitimate users:

```bash
# Temporarily disable (set in .env and restart service)
RATE_LIMIT_ENABLED=false

# Or increase limits
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_AUTH_MAX=20
```

**Remember to re-enable after adjusting!**

---

## 📞 Security Contacts

If you discover a security vulnerability:
1. Do NOT create a public GitHub issue
2. Contact the development team directly
3. Provide detailed steps to reproduce

---

## ✅ Final Sign-Off

| Reviewer | Date | Status |
|----------|------|--------|
| ___________ | ___/___/___ | [ ] Approved |
| ___________ | ___/___/___ | [ ] Approved |

**Production deployment approved:** [ ] Yes / [ ] No

---

*This checklist follows OWASP security guidelines and best practices.*
