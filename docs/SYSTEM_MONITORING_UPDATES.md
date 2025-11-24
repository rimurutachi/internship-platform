# System Monitoring - API Request Tracking & Service Management

## Problem Solved

### 1. **API Calls stuck at 1,247**
**Issue**: The API Calls (24h) metric was hardcoded and not updating.

**Solution**: 
- Created `requestTracker` middleware that logs every API request to `api_request_logs` table
- Updated `systemMetricsService.ts` to query actual request count from database
- Middleware tracks: method, path, status_code, response_time, user_id, ip_address, timestamp

### 2. **Manage Button Non-Functional**
**Issue**: View Logs and Restart Service buttons showed only toast notifications.

**Solution**:
- Added backend endpoints for service management:
  - `GET /api/admin/system/services/:serviceName/logs` - fetch service logs from system_events table
  - `POST /api/admin/system/services/:serviceName/restart` - trigger service restart
- Connected frontend buttons to real API calls
- View Logs now fetches and displays actual log count
- Restart Service triggers backend endpoint and logs event

---

## Files Modified

### Backend

#### 1. `backend/src/middleware/requestTracker.ts` (NEW)
```typescript
// Logs all API requests to database for metrics tracking
// Captures: method, path, status, response time, user, IP, user-agent
// Runs asynchronously on response finish to not block requests
```

#### 2. `backend/src/server.ts`
```diff
+ import { requestTracker } from "./middleware/requestTracker";

// Added after rate limiting, before routes
+ app.use(requestTracker);
```

#### 3. `backend/src/services/systemMetricsService.ts`
```diff
// Replace hardcoded API calls count
- const apiCallsLast24h = totalRequests > 0 ? totalRequests : 1247;
+ // Query actual count from api_request_logs table
+ const { count: apiCount } = await getSupabaseClient()
+   .from('api_request_logs')
+   .select('*', { count: 'exact', head: true })
+   .gte('created_at', oneDayAgo);
+ apiCallsLast24h = apiCount || 0;
```

#### 4. `backend/src/controllers/admin/systemController.ts`
```typescript
// Added two new methods:

async getServiceLogs(req, res) {
  // Queries system_events table filtered by service name
  // Supports limit and severity filters
  // Returns array of log entries
}

async restartService(req, res) {
  // Logs service restart event to system_events
  // In production, would trigger actual service restart
  // Returns success message
}
```

#### 5. `backend/src/routes/admin/system.ts`
```typescript
// Added two new routes:
router.get('/services/:serviceName/logs', authenticateToken, systemController.getServiceLogs);
router.post('/services/:serviceName/restart', authenticateToken, systemController.restartService);
```

### Frontend

#### 6. `frontend/src/lib/api/admin-system.ts`
```typescript
// Added two new API methods:

getServiceLogs: async (serviceName: string, filters?: { limit?: number; severity?: string })
  // Fetches service logs with optional filters
  
restartService: async (serviceName: string)
  // Triggers service restart
```

#### 7. `frontend/src/app/dashboard/admin/system/page.tsx`
```typescript
// Updated handleServiceAction to call real APIs:

case 'restart':
  const restartResponse = await adminSystemAPI.restartService(selectedService.name);
  // Shows success toast
  // Refreshes metrics after 2 seconds
  
case 'view_logs':
  const logsResponse = await adminSystemAPI.getServiceLogs(selectedService.name, { limit: 50 });
  // Shows log count in toast
  // Logs entries to console (ready to display in modal)
  
case 'clear_cache':
  // Already working - no changes needed
```

---

## How It Works

### Request Tracking Flow
1. **User makes API request** → Express receives it
2. **Request tracker middleware** → Captures start time, attaches finish listener
3. **Request processed** → Routes, controllers, services execute
4. **Response sent** → `res.on('finish')` fires
5. **Log to database** → Async insert to `api_request_logs` table
6. **Metrics updated** → Next metrics fetch shows real count

### Service Management Flow
1. **User clicks Manage button** → Dialog opens with 3 actions
2. **User clicks View Logs** → 
   - Frontend calls `getServiceLogs('API Server')`
   - Backend queries `system_events WHERE service = 'API Server'`
   - Returns array of log entries
   - Frontend shows count (can be expanded to show full logs)
3. **User clicks Restart Service** →
   - Frontend calls `restartService('API Server')`
   - Backend logs restart event to `system_events`
   - Returns success message
   - Frontend shows toast and refreshes metrics

---

## Testing Instructions

### Test API Request Tracking

1. **Run backend**:
```bash
cd backend
npm run dev
```

2. **Make some API requests** (browse around the app, or use curl):
```bash
curl http://localhost:5000/api/internships
curl http://localhost:5000/api/evaluations
# Etc...
```

3. **Check System page**: 
   - Navigate to `/dashboard/admin/system`
   - **API Calls (24h)** should now show actual count
   - Make more requests → wait 30 seconds → count updates

4. **Verify in database** (Supabase SQL Editor):
```sql
SELECT COUNT(*) FROM api_request_logs WHERE created_at >= NOW() - INTERVAL '24 hours';
```

### Test Service Management

1. **Open System page** → Navigate to Services section

2. **Test View Logs**:
   - Click **Manage** on any service (e.g., API Server)
   - Click **View Logs** button
   - Should show toast: "Found X log entries for API Server"
   - Check browser console for full log data

3. **Test Restart Service**:
   - Click **Manage** on any service
   - Click **Restart Service** button
   - Should show toast: "API Server restart initiated"
   - Wait 2 seconds → metrics refresh automatically
   - Check `system_events` table for new restart event:
   ```sql
   SELECT * FROM system_events WHERE type = 'service_restart' ORDER BY created_at DESC LIMIT 5;
   ```

4. **Test Clear Cache** (already working):
   - Click **Clear Cache** button
   - Should show success toast
   - Calls `/api/admin/system/maintenance` endpoint

---

## Database Requirements

The `api_request_logs` table must exist in Supabase. If not created yet, run this SQL:

```sql
-- From backend/DATABASE_SCHEMA.md

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_logs_created_at ON api_request_logs(created_at);
CREATE INDEX idx_api_logs_user_id ON api_request_logs(user_id);
CREATE INDEX idx_api_logs_path ON api_request_logs(path);

-- RLS Policy (admin only)
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_logs_admin_select ON api_request_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Auto-cleanup function (delete logs older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## What's Next?

### Future Enhancements

1. **Display logs in modal**: 
   - Instead of just showing count, display full logs in a scrollable dialog
   - Add syntax highlighting, filtering by severity, search

2. **Real-time log streaming**:
   - WebSocket connection to stream logs in real-time
   - Auto-update logs modal as events happen

3. **Actual service restart**:
   - Integrate with PM2 or Docker API to restart services
   - Show service status transition (running → restarting → running)

4. **Storage metrics**:
   - Query Supabase Storage API for actual storage usage
   - Replace placeholder 0 GB with real values

5. **Performance optimizations**:
   - Add Redis caching for metrics (update every 30s, cache for 29s)
   - Batch insert request logs (every 10 requests or 5 seconds)
   - Use materialized views for faster queries

---

## Summary

✅ **API Calls now updates in real-time** - tracks all requests to database  
✅ **View Logs button functional** - fetches service logs from system_events  
✅ **Restart Service button functional** - triggers backend endpoint and logs event  
✅ **All TypeScript errors resolved** - compiles successfully  
✅ **Ready for production testing** - run both services and test end-to-end  

**Kaya na i-test bro! Just run `npm run dev` on both backend and frontend, then try making some API requests and using the Manage buttons.** 🚀
