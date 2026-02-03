# Complete Service Startup Guide

This guide walks through starting all four services in the correct order, ensuring proper environment setup and service health checks.

## Architecture Overview

```
Frontend (Next.js 15, port 3000)
    ↓
Backend (Express + Socket.io, port 5000)
    ↓ (proxy to)
Document-Service (Express + Socket.io, port 6001)
    ↓
AI-Service (FastAPI, port 8000)
    ↓
Supabase (PostgreSQL + Auth + Storage)
```

## Prerequisites

- Node.js 18+
- Python 3.9+
- npm or yarn
- Supabase project set up with all tables created (see `docs/DATABASE_SCHEMA.md`)
- Redis running (optional but recommended for sessions)
- All `.env` files configured (see `.env.example` in each service)

## Service Startup Order

**Why this order matters:**
1. AI-Service must be ready first (no dependencies)
2. Document-Service depends on Supabase + Redis
3. Backend depends on Document-Service for proxy routing
4. Frontend connects to Backend and Document-Service

---

## 1. AI-Service (Port 8000)

### Setup

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment

Create `.env`:

```env
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/internship_platform
```

### Start

```bash
uvicorn main:app --reload --port 8000
```

### Health Check

```bash
curl -s http://localhost:8000/health | jq
# Expected: {"status":"ok"} or service info
```

---

## 2. Document-Service (Port 6001)

### Setup

```bash
cd document-service
npm install
```

### Environment

Create `.env`:

```env
PORT=6001
WEBSOCKET_PORT=6001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_supabase_database_url
REDIS_URL=redis://localhost:6379
```

### Database Migrations

Before starting, ensure Supabase tables exist:
- `collaboration_sessions`
- `document_changes`
- `blockchain_entries`
- `digital_signatures`
- `document_access_control`
- `audit_logs`
- `workflow_definitions`
- `document_templates`
- `template_fields`

Check `docs/DATABASE_SCHEMA.md` for full table definitions. If missing, run SQL from `backend/sql/` in Supabase console.

### Start

```bash
npm run dev
```

Expected output:
```
🟢 Socket.io + HTTP server running on port 6001
   - WebSocket: ws://localhost:6001
   - HTTP API: http://localhost:6001/api/documents
   - HTTP API: http://localhost:6001/api/blockchain
   - HTTP API: http://localhost:6001/api/signatures
   - HTTP API: http://localhost:6001/api/access
   - HTTP API: http://localhost:6001/api/workflows
   - HTTP API: http://localhost:6001/api/templates
   - HTTP API: http://localhost:6001/api/collaboration
```

### Health Check

```bash
curl -s http://localhost:6001/health
# Expected: {"status":"OK","service":"document-service"}
```

### Quick Feature Test

```bash
# List documents (requires auth token; skip for now)
curl -s http://localhost:6001/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" | jq
```

---

## 3. Backend (Port 5000)

### Setup

```bash
cd backend
npm install
```

### Environment

Create `.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_supabase_database_url
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
DOCUMENT_SERVICE_URL=http://localhost:6001
```

### Start

```bash
npm run dev
```

Expected output:
```
✅ Server is running on port 5000
```

### Health Check

```bash
curl -s http://localhost:5000/api/health | jq
# Expected: {"status":"ok"} or similar
```

### Test Proxy to Document-Service

```bash
curl -s http://localhost:5000/api/admin/documents/health
# Should proxy to document-service and return its health
```

---

## 4. Frontend (Port 3000)

### Setup

```bash
cd frontend
npm install
```

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_DOCUMENT_SERVICE_URL=http://localhost:6001
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:6001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Start

```bash
npm run dev
```

Expected output:
```
▲ Next.js 15.x
  - Local: http://localhost:3000
  - Environments: .env.local
```

### Health Check

Open browser: `http://localhost:3000`
- Should load login page
- Check browser DevTools > Console for any CORS or auth errors

---

## Quick Start Script (All Services)

### macOS/Linux

Create `start-all.sh`:

```bash
#!/bin/bash

echo "🚀 Starting all services..."

# Terminal 1: AI-Service
gnome-terminal -- bash -c "cd ai-service && source venv/bin/activate && uvicorn main:app --reload --port 8000; exec bash"

# Terminal 2: Document-Service
gnome-terminal -- bash -c "cd document-service && npm run dev; exec bash"

# Terminal 3: Backend
gnome-terminal -- bash -c "cd backend && npm run dev; exec bash"

# Terminal 4: Frontend
gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"

echo "✅ All services starting. Check terminal windows for logs."
```

Make executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

### Windows (Batch)

Create `start-all.bat`:

```batch
@echo off
echo Starting all services...

start "AI-Service" cmd /k "cd ai-service && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
start "Document-Service" cmd /k "cd document-service && npm run dev"
start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services started. Check windows for logs.
```

Run:
```batch
start-all.bat
```

---

## Debugging Checklist

| Issue | Solution |
|-------|----------|
| **Document-Service won't start** | Check Supabase tables exist; verify `SUPABASE_SERVICE_KEY` is correct; check Redis URL |
| **Backend proxy returns 502** | Ensure Document-Service is running on 6001; check `DOCUMENT_SERVICE_URL` in backend `.env` |
| **Frontend socket disconnects** | Verify `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:6001` (NOT `ws://`); check CORS in Document-Service |
| **Auth token errors** | Ensure `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` are valid; check token expiry in browser console |
| **Blockchain/Signatures endpoints 404** | Verify backend routes in `backend/src/routes/admin/documents.ts` are wired; check proxy service methods exist |
| **Admin documents page blank** | Check browser console for API errors; verify user role is 'admin'; ensure token is attached to requests |

---

## Test Scenarios

### Scenario 1: Admin Views Documents
1. Open http://localhost:3000
2. Login as admin user
3. Navigate to Admin Dashboard > Documents
4. Verify documents list loads
5. Check DevTools Network tab for:
   - GET `/api/admin/documents` → 200 from backend
   - GET `/api/admin/documents/stats/overview` → 200

### Scenario 2: Document Collaboration (Real-time)
1. Open document editor (student/advisor/supervisor dashboard)
2. Open DevTools > Network > WS tab
3. You should see WebSocket connection to `http://localhost:6001`
4. Verify socket events: `document:join`, `document:update`, `cursor:update`

### Scenario 3: Blockchain Recording (Admin)
1. In admin documents page, click "View Details" on a document
2. Click "Blockchain" tab (when implemented)
3. Click "Record Entry"
4. Verify POST `/api/admin/documents/{id}/blockchain/record` succeeds
5. Click "View Ledger" to see entries

### Scenario 4: Digital Signature
1. In document details, click "Signatures" tab
2. Click "Sign Document"
3. Provide signature reason/metadata
4. Verify POST `/api/admin/documents/{id}/signatures/sign` succeeds
5. View signature list and verify status

---

## Environment Variables Reference

**Backend**
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
DOCUMENT_SERVICE_URL=http://localhost:6001
```

**Document-Service**
```env
PORT=6001
WEBSOCKET_PORT=6001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

**Frontend**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_DOCUMENT_SERVICE_URL=http://localhost:6001
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:6001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**AI-Service**
```env
PORT=8000
DATABASE_URL=postgresql://...
```

---

## Logs & Monitoring

### View Backend Logs
```bash
tail -f logs/backend.log
```

### View Document-Service Logs
```bash
# In the service terminal, output is live
# Or pipe to file:
npm run dev > logs/document-service.log 2>&1
```

### View Frontend Logs
```bash
# In the browser console (F12)
# Look for log prefixes: 🔵 [Documents API], 🟢 [DocumentSocket], etc.
```

### Check Service Health
```bash
# All services
for svc in ai-service document-service backend; do
  echo "=== $svc ===" 
  curl -s http://localhost:${ports[$svc]}/health | jq . || echo "Not responding"
done
```

---

## Next Steps

1. **Verify all 4 services are running** (see Health Checks above)
2. **Test login flow** (frontend → backend → Supabase auth)
3. **Test document CRUD** (student uploads document)
4. **Test blockchain recording** (admin records blockchain entry)
5. **Test real-time collaboration** (multiple users edit same document)
6. **Check logs for errors** (backend, document-service console)

If issues arise, refer to the **Debugging Checklist** above.
