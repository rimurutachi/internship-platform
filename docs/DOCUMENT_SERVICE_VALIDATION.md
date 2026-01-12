# Document-Service Integration Validation

This guide validates that all document-service features are properly wired end-to-end.

## Pre-Flight Checklist

- [ ] All 4 services running (AI, Document-Service, Backend, Frontend)
- [ ] Database tables created (see `docs/DATABASE_SCHEMA.md`)
- [ ] Environment variables set in all `.env` files
- [ ] Redis running (optional but recommended)
- [ ] No console errors in browser DevTools

---

## 1. Service Health Checks

### API Health Endpoints

```bash
# AI-Service (port 8000)
curl -s http://localhost:8000/health | jq

# Document-Service (port 6001)
curl -s http://localhost:6001/health | jq

# Backend (port 5000)
curl -s http://localhost:5000/api/health | jq

# Frontend (port 3000)
curl -s http://localhost:3000 | head -20
```

**Expected Results:**
- AI-Service: `{"status":"ok"}`
- Document-Service: `{"status":"OK","service":"document-service"}`
- Backend: `{"status":"ok"}` or similar
- Frontend: HTML document loaded

---

## 2. Authentication Flow

### Scenario: Admin Login & Token Validation

```bash
# 1. Login via Supabase (frontend handles this via /login page)
# Open http://localhost:3000/login in browser
# Login as admin user (email must exist in Supabase `auth.users`)

# 2. Verify token is stored in localStorage
# Open DevTools > Application > Local Storage
# Check for `sb-<project-id>-auth-token` key

# 3. Verify token is attached to API requests
# Open DevTools > Network tab
# Make an API call: GET /api/admin/documents
# Check Authorization header: `Bearer eyJhbG...`
```

---

## 3. Document CRUD Operations

### Create Document (Student)

```bash
# In frontend, navigate to Student Dashboard > Documents
# Click "Upload Document"
# Fill form:
#   - Title: "Test Report"
#   - Type: "report"
#   - Description: "Test document for integration"
# Click "Upload"

# Expected:
# ✅ Document appears in list
# ✅ Network tab shows POST /api/documents (200)
# ✅ Document status = "draft"
```

### Read Document (Admin)

```bash
# Navigate to Admin Dashboard > Documents
# Click "View Details" on a document

# Expected:
# ✅ Document dialog opens
# ✅ All tabs load (Details, Versions, Comments, etc.)
# ✅ Network shows GET /api/admin/documents/{id} (200)
```

### Update Document Status (Admin)

```bash
# In document detail dialog, Details tab
# Click "Change Status" dropdown
# Select "in_review"
# Click "Update Status"

# Expected:
# ✅ Status badge updates immediately
# ✅ Network shows PATCH /api/admin/documents/{id}/status (200)
# ✅ Toast notification: "Status updated"
```

---

## 4. Blockchain Feature

### Record Blockchain Entry

```bash
# In document detail dialog, click "Blockchain" tab
# Click "Verify Integrity" button

# Expected:
# ✅ Button shows loading spinner
# ✅ Network shows POST /api/admin/documents/{id}/blockchain/verify (200)
# ✅ Result shows: "Document blockchain is intact"
```

### View Blockchain Ledger

```bash
# In Blockchain tab, click "Refresh Ledger"

# Expected:
# ✅ Network shows GET /api/admin/documents/{id}/blockchain/ledger (200)
# ✅ If entries exist, show block hashes and timestamps
# ✅ If no entries, show: "No blockchain entries yet"
```

---

## 5. Digital Signatures Feature

### Sign Document

```bash
# In document detail dialog, click "Signatures" tab
# Click "Sign Document" button

# Expected:
# ✅ Button shows loading spinner
# ✅ Network shows POST /api/admin/documents/{id}/signatures/sign (200)
# ✅ Toast notification: "Document signed successfully"
# ✅ New signature appears in list
```

### View Signatures

```bash
# In Signatures tab, verify signature list shows:
# - Signer name
# - Signer email
# - Signed date/time
# - Verification status (valid/invalid/revoked)

# Expected:
# ✅ Network shows GET /api/admin/documents/{id}/signatures (200)
```

---

## 6. Access Control Feature

### Grant Access

```bash
# In document detail dialog, click "Access" tab
# Click "Grant Access" button
# Fill form:
#   - User ID: <valid-uuid>
#   - Permission Level: "edit"
# Click "Grant Access"

# Expected:
# ✅ Network shows POST /api/admin/documents/{id}/access/grant (200)
# ✅ New access entry appears in list
# ✅ Toast notification: "Access granted (edit)"
```

### Revoke Access

```bash
# In Access tab, click trash icon on a user
# Confirm revoke

# Expected:
# ✅ Network shows DELETE /api/admin/documents/{id}/access/{accessId} (200)
# ✅ Entry removed from list
# ✅ Toast notification: "Access revoked"
```

---

## 7. Collaboration Feature

### View Active Users

```bash
# In document detail dialog, click "Activity" tab
# Open document editor in another browser tab/window
# Both tabs should show active users

# Expected:
# ✅ Network shows GET /api/admin/documents/{id}/collaboration/users (200)
# ✅ User list shows:
#    - User name
#    - User email
#    - Color indicator
#    - "Editing" badge if applicable
```

### View Recent Changes

```bash
# In Activity tab, make edits in document editor
# Check "Recent Changes" section

# Expected:
# ✅ Network shows GET /api/admin/documents/{id}/collaboration/changes?limit=20 (200)
# ✅ Changes show operation, timestamp, and content preview
# ✅ List updates automatically (refreshes every 5 seconds)
```

### Undo/Redo Status

```bash
# In Activity tab, check "Edit Stack Status" section

# Expected:
# ✅ Shows "Can Undo" and "Can Redo" indicators
# ✅ Displays undo/redo action counts
# ✅ Updates as edits are made
```

---

## 8. Backend Proxy Validation

### Proxy Request Routing

```bash
# Verify backend correctly proxies to document-service

# Test 1: Documents endpoint (direct to document-service)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/documents

# Test 2: Blockchain endpoint (proxied)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/documents/{doc-id}/blockchain/ledger

# Test 3: Signatures endpoint (proxied)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/documents/{doc-id}/signatures

# Expected:
# ✅ All requests return 200 (or appropriate error code)
# ✅ Responses contain expected data structure
# ✅ No proxy/gateway errors (502, 503)
```

---

## 9. Real-Time WebSocket Validation

### Document Collaboration WebSocket

```bash
# Open DevTools > Network > WS filter
# Navigate to document editor
# Perform edits

# Expected:
# ✅ WebSocket connection established: ws://localhost:6001
# ✅ Frames show:
#    - document:join (when entering document)
#    - document:update (when making edits)
#    - cursor:update (when moving cursor)
#    - document:leave (when leaving/closing document)
```

### Socket.io Connection Details

```bash
# In DevTools Console, run:
# (if socket is available via window object)
console.log(socket.connected);  // Should be true
console.log(socket.id);          // Should show socket ID
```

---

## 10. Error Handling Validation

### Invalid Request (Missing Token)

```bash
curl -X GET http://localhost:5000/api/admin/documents

# Expected:
# ❌ 401 Unauthorized
# ❌ Error message: "Authentication required"
```

### Unauthorized Access (Non-Admin Role)

```bash
# Login as student user
# Try to access /dashboard/admin

# Expected:
# ❌ 403 Forbidden or redirect to /dashboard/student
```

### Document Not Found

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/documents/invalid-uuid

# Expected:
# ❌ 404 Not Found
# ❌ Error message: "Document not found"
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Documents list shows empty** | Ensure user role is 'admin'; check Supabase `users` table; verify token is valid |
| **Blockchain/Signatures tabs 404** | Check backend routes in `backend/src/routes/admin/documents.ts` are exported; verify proxy service is running |
| **WebSocket connection fails** | Ensure document-service is running on 6001; check `NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:6001` (NOT `ws://`) |
| **Proxy returns 502** | Verify `DOCUMENT_SERVICE_URL=http://localhost:6001` in backend `.env`; ensure document-service is responding |
| **Auth token not sent** | Check browser console for "Token attached" logs; verify Supabase session is valid; refresh page if needed |
| **CORS errors** | Check document-service CORS config; frontend URL must match `FRONTEND_URL` env in document-service |

---

## Performance Checks

### Response Times

Use browser DevTools Network tab to measure:

- **Document list load**: < 500ms
- **Document detail load**: < 1000ms
- **Blockchain ledger fetch**: < 800ms
- **WebSocket connect**: < 200ms
- **Real-time update**: < 100ms

### Resource Usage

- Frontend bundle: < 5MB (gzipped)
- Memory (browser): < 100MB
- Memory (Node services): < 200MB each

---

## Test Automation (Optional)

### Backend API Tests

```bash
# Run backend tests
cd backend
npm test

# Expected: All tests pass
```

### Frontend Component Tests

```bash
# Run frontend tests
cd frontend
npm test

# Expected: All tests pass
```

---

## Sign-Off Checklist

Once all tests pass, verify:

- [ ] All 4 services healthy (health endpoints respond)
- [ ] Authentication works (login → token stored → requests authorized)
- [ ] Document CRUD works (create, read, update, delete)
- [ ] Blockchain feature works (record, verify, ledger)
- [ ] Signatures feature works (sign, list, verify)
- [ ] Access control works (grant, list, revoke)
- [ ] Collaboration works (active users, changes, undo/redo)
- [ ] Backend proxy works (routes to document-service correctly)
- [ ] WebSocket works (real-time updates flow)
- [ ] Error handling works (401, 403, 404 responses correct)
- [ ] No console errors in browser
- [ ] No errors in server logs

---

## Deployment Notes

For production deployment:

1. Update `.env` files with production URLs
2. Set `NODE_ENV=production` in backend/document-service
3. Enable HTTPS (update WebSocket URL to `wss://`)
4. Configure database backups
5. Set up monitoring/alerting for service health
6. Use environment-specific secrets management (e.g., HashiCorp Vault)
7. Enable database RLS policies (check Supabase dashboard)
8. Configure CORS for frontend domain
9. Set up log aggregation (CloudWatch, DataDog, etc.)
10. Test failover/recovery scenarios

---

## Support

For issues or questions:
1. Check server logs: `tail -f logs/*.log`
2. Check browser console: DevTools > Console
3. Review error responses: DevTools > Network > select request > Response tab
4. Check Supabase dashboard for table/permission errors
5. Verify environment variables in `.env` files match documentation

