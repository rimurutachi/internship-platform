# Quick Start Guide - Admin System Management

## Prerequisites
✅ Backend running on port 5000
✅ Frontend running on port 3000
✅ Supabase database configured
✅ Admin user account created

---

## Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Create system_events table
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  service VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(type);
CREATE INDEX IF NOT EXISTS idx_system_events_service ON system_events(service);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_resolved_at ON system_events(resolved_at);

-- Insert sample data
INSERT INTO system_events (type, service, message, severity, count) VALUES
  ('system', 'API Server', 'Server started successfully', 'info', 1),
  ('database', 'Database', 'High connection count detected', 'warning', 3),
  ('api', 'API Server', 'Slow response time detected', 'warning', 5);
```

---

## Step 2: Verify Backend Files

Make sure these files exist:
- ✅ `backend/src/services/systemMetricsService.ts`
- ✅ `backend/src/controllers/admin/systemController.ts`
- ✅ `backend/src/routes/admin/system.ts`
- ✅ `backend/src/routes/admin.ts` (updated with system routes)

---

## Step 3: Verify Frontend Files

Make sure these files exist:
- ✅ `frontend/src/lib/api/admin-system.ts`
- ✅ `frontend/src/types/system.ts`
- ✅ `frontend/src/app/dashboard/admin/system/page.tsx` (updated)

---

## Step 4: Environment Variables

Check `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=5000
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000  # Optional
```

Check `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Step 5: Start Services

### Terminal 1 - Backend
```bash
cd backend
npm install  # if not already done
npm run dev
```

Wait for: `Server running on port 5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm install  # if not already done
npm run dev
```

Wait for: `Ready on http://localhost:3000`

---

## Step 6: Test the System Page

1. Open browser: `http://localhost:3000`
2. Login with admin credentials
3. Navigate to: **Dashboard > System Management**
4. You should see:
   - ✅ Real-time system health status
   - ✅ Live metrics (users, sessions, API calls, storage)
   - ✅ Service status cards with progress bars
   - ✅ Recent system events list
   - ✅ Loading spinner on first load
   - ✅ Auto-refresh every 30 seconds

---

## Step 7: Test Features

### Test Event Filtering
1. Click "All" - see all events
2. Click "Critical" - see only critical events
3. Click "Warnings" - see only warning events

### Test Event Acknowledgment
1. Find an unresolved event
2. Click "Acknowledge" button
3. Event should disappear or show as resolved
4. Toast notification should appear

### Test Auto-Refresh
1. Open browser console
2. Watch for API calls every 30 seconds
3. Metrics should update automatically

---

## Troubleshooting

### ❌ "Unable to load system metrics"
**Fix:** Check backend is running on port 5000

### ❌ "Failed to fetch system metrics"
**Fix:** 
- Verify JWT token is valid
- Check admin user has correct role
- Check CORS settings in backend

### ❌ Services show as "stopped"
**Fix:**
- Database stopped → Check Supabase connection
- AI Service stopped → Normal if not running (optional)
- Socket Server stopped → Check Socket.io initialization

### ❌ Metrics show 0 or NaN
**Fix:**
- Run database migrations
- Insert sample data
- Check Supabase permissions

### ❌ Events don't appear
**Fix:**
- Run SQL to create `system_events` table
- Insert sample events
- Check RLS policies in Supabase

---

## API Testing with curl

### Test Health (without auth)
```bash
curl http://localhost:5000/api/admin/system/health
```

Should return 401 or 403 (auth required)

### Test Health (with admin token)
```bash
curl http://localhost:5000/api/admin/system/health \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Should return:
```json
{
  "success": true,
  "overallHealth": "healthy",
  "uptime": 99.98,
  "responseTime": 45,
  "errorRate": 0.02
}
```

### Test Metrics
```bash
curl http://localhost:5000/api/admin/system/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Should return full metrics object

### Test Events
```bash
curl "http://localhost:5000/api/admin/system/events?limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Should return event array

---

## Next Steps

### Add More Events
```sql
INSERT INTO system_events (type, service, message, severity, count) VALUES
  ('auth', 'API Server', 'Failed login attempt detected', 'warning', 10),
  ('database', 'Database', 'Query timeout exceeded', 'error', 2),
  ('system', 'API Server', 'Memory usage above 80%', 'warning', 1);
```

### Monitor in Real-Time
1. Keep System page open
2. Insert new events in Supabase
3. Wait for auto-refresh (or refresh manually)
4. See events appear in list

### Test Event Acknowledgment
1. Click "Acknowledge" on any event
2. Check database - `resolved_at` should be set
3. Event should disappear from list or show as resolved

---

## Production Deployment

Before deploying:
1. ✅ Set production environment variables
2. ✅ Enable HTTPS
3. ✅ Configure CORS for production domain
4. ✅ Set up monitoring alerts
5. ✅ Configure log retention policies
6. ✅ Set up automated backups
7. ✅ Test all endpoints with production data

---

## Success Checklist

- [ ] Database tables created
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access System page as admin
- [ ] Metrics load successfully
- [ ] Services show correct status
- [ ] Events display properly
- [ ] Event filtering works
- [ ] Event acknowledgment works
- [ ] Auto-refresh works (every 30s)
- [ ] Loading states show correctly
- [ ] Error handling works (disconnect backend to test)
- [ ] Mobile view responsive

---

## Support

If you're still having issues:
1. Check `backend/DATABASE_SCHEMA.md` for full SQL
2. Check `SYSTEM_INTEGRATION_COMPLETE.md` for detailed docs
3. Review backend logs for errors
4. Check browser console for frontend errors
5. Verify Supabase RLS policies

---

**Status:** Ready to use! 🚀
