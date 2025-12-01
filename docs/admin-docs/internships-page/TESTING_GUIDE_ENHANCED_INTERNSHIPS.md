# Enhanced Admin Internship Management - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Enhanced Admin Internship Management v2.0 features. Follow these test scenarios to ensure all functionality works correctly.

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Backend API Testing](#backend-api-testing)
3. [Frontend Component Testing](#frontend-component-testing)
4. [Integration Testing](#integration-testing)
5. [Background Job Testing](#background-job-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)

## Pre-Testing Setup

### 1. Database Migration

Ensure the database schema is updated:

```bash
# Run migration
psql $DATABASE_URL -f backend/migrations/001_create_internship_reminders.sql

# Verify tables
psql $DATABASE_URL -c "\d internship_reminders"
psql $DATABASE_URL -c "\d companies"
```

**Expected**: Tables should have new columns (is_sent, notification_channel, custom_message, capacity_limit, etc.)

### 2. Backend Server

Start the backend in development mode:

```bash
cd backend
npm install
npm run build
npm run dev
```

**Verify**: Server running on `http://localhost:5000`

### 3. Frontend Server

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

**Verify**: Frontend running on `http://localhost:3000`

### 4. Test Data

Create test data if not exists:

```sql
-- Create test company with capacity
INSERT INTO companies (name, industry, capacity_limit, current_students, is_moa_standardized, is_verified)
VALUES ('Test Company Inc', 'Technology', 10, 5, true, true);

-- Create test internship
INSERT INTO internships (student_id, company_id, position, advisor_id, supervisor_id, start_date, end_date, status)
VALUES (
  (SELECT id FROM users WHERE role = 'student' LIMIT 1),
  (SELECT id FROM companies WHERE name = 'Test Company Inc'),
  'Software Engineer Intern',
  (SELECT id FROM users WHERE role = 'advisor' LIMIT 1),
  (SELECT id FROM users WHERE role = 'supervisor' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  'active'
);
```

## Backend API Testing

### Automated API Tests

Run the automated test script:

```bash
cd backend

# Set environment variables
export ADMIN_JWT_TOKEN="your_jwt_token_here"
export API_BASE_URL="http://localhost:5000"

# Run tests
node tests/enhanced-internships-api.test.js
```

**Expected Output**:
```
✅ GET /reminders/:internshipId - Found X reminders
✅ POST /reminders - Created reminder ID: xxx
✅ PATCH /reminders/:id - Updated reminder successfully
✅ POST /reminders/:id/send - Sent reminder successfully
✅ POST /reminders/bulk-send - Sent to X internships
✅ DELETE /reminders/:id - Deleted reminder successfully
✅ GET /capacity/overview - Found X companies
✅ POST /capacity/validate - Company has capacity
✅ GET /documents/:internshipId - Found X documents
✅ GET /documents/completion-rate - Completion: X%
✅ POST /bulk/update-status - Updated X internships
✅ POST /bulk/export - Export data returned
✅ POST /analytics/generate-report - Report generated
✅ GET /analytics/deadline-tracking - X approaching deadlines

✅ ALL TESTS PASSED!
```

### Manual API Testing

Use curl or Postman to test individual endpoints:

#### 1. Test Reminder Creation

```bash
curl -X POST http://localhost:5000/api/admin/internships/enhanced/reminders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "internship_id": "internship-id-here",
    "reminder_type": "pending_documents",
    "scheduled_for": "2025-11-30T10:00:00Z",
    "notification_channel": "both",
    "custom_message": "Please submit your weekly report"
  }'
```

**Expected**: 201 Created with reminder object

#### 2. Test Capacity Validation

```bash
curl -X POST http://localhost:5000/api/admin/internships/enhanced/capacity/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "company-id-here"
  }'
```

**Expected**: 200 OK with `is_valid: true/false` and capacity info

#### 3. Test Document Status

```bash
curl -X GET "http://localhost:5000/api/admin/internships/enhanced/documents/internship-id-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with array of documents and their statuses

## Frontend Component Testing

### Test 1: Document Checklist Component

**Location**: Admin Dashboard > Internships > View > Documents tab

**Steps**:
1. Login as admin
2. Navigate to Internships page
3. Click "View" on any internship
4. Click "Documents" tab

**Verify**:
- ✅ Document list loads without errors
- ✅ Each document shows status (submitted/pending/overdue)
- ✅ Submission dates are displayed correctly
- ✅ Overall completion percentage is shown
- ✅ Filter by document type works
- ✅ "Overdue Only" filter works

**Edge Cases**:
- No documents submitted yet
- All documents submitted
- Some documents overdue

### Test 2: Reminders Management Component

**Location**: Admin Dashboard > Internships > View > Reminders tab

**Steps**:
1. From same internship view modal
2. Click "Reminders" tab

**Verify**:
- ✅ Existing reminders list loads
- ✅ "Create Reminder" button opens dialog
- ✅ Reminder form has all fields:
  - Reminder type dropdown
  - Scheduled date/time picker
  - Notification channel (in_app/email/both)
  - Custom message textarea
- ✅ Create reminder works
- ✅ Edit reminder opens pre-filled form
- ✅ Delete reminder shows confirmation
- ✅ "Send Now" button works for pending reminders
- ✅ Sent reminders show timestamp and "is_sent" status

**Edge Cases**:
- Create reminder with past date (should fail)
- Create multiple reminders
- Edit reminder to change schedule
- Delete reminder that was already sent

### Test 3: Company Status Card Component

**Location**: Admin Dashboard > Internships > Create Internship > Company selection

**Steps**:
1. Click "Create Internship"
2. Fill student field
3. Select a company from dropdown

**Verify**:
- ✅ Company status card appears below company dropdown
- ✅ Card shows:
  - Verification badge (Affiliated/New Company)
  - MOA status (Active/Expiring Soon/Expired/Not Uploaded)
  - Capacity bar with current/limit (e.g., "8/10 students")
  - Color coding (green/yellow/red based on capacity)
- ✅ If company at capacity:
  - Card shows warning message
  - Submit button is disabled
  - Error toast shows on submit attempt

**Edge Cases**:
- Company at 100% capacity (10/10)
- Company near capacity (9/10)
- Company with expired MOA
- New unverified company

### Test 4: Bulk Actions Toolbar Component

**Location**: Admin Dashboard > Internships > List page

**Steps**:
1. Navigate to Internships page
2. Check one or more internship checkboxes

**Verify**:
- ✅ Bulk actions toolbar appears
- ✅ Selection count is displayed
- ✅ "Clear Selection" button works
- ✅ "Send Reminders" opens bulk reminder dialog
  - Select reminder type
  - Add message
  - Choose channel
  - Confirm sends to all selected
- ✅ "Update Status" opens bulk status dialog
  - Select new status
  - Add notes
  - Confirm updates all selected
- ✅ "Export" dialog shows format options
  - CSV format works
  - JSON format works
  - Excel format works (if available)
- ✅ "Generate Report" creates summary
- ✅ Actions complete with success toast
- ✅ List refreshes after bulk action

**Edge Cases**:
- Select all internships (100+)
- Mix of different statuses
- Export with custom field selection
- Bulk action fails for some items

## Integration Testing

### Test Scenario 1: Complete Internship Lifecycle with Reminders

**Objective**: Test full flow from internship creation to reminder sending

**Steps**:
1. Create new internship
   - Select student without internship
   - Select company (verify capacity shown)
   - Fill all required fields
   - Submit
2. View created internship
   - Go to Documents tab
   - Verify default documents list
3. Go to Reminders tab
   - Create "pending_documents" reminder for tomorrow
   - Verify reminder appears in list
4. Wait 24 hours OR manually trigger reminder processor
5. Verify:
   - Reminder marked as sent
   - Student received notification
   - Email sent (if configured)

**Expected**: All steps complete without errors

### Test Scenario 2: Company Capacity Management

**Objective**: Test capacity tracking and validation

**Steps**:
1. Check company capacity overview:
   - Navigate to Internships page
   - Note current capacity of test company
2. Create internship for that company:
   - Verify capacity card updates
   - Check current_students increments
3. Try to exceed capacity:
   - Create internships until capacity reached
   - Attempt one more
   - Verify rejection with error message
4. Complete an internship:
   - Update status to "completed"
   - Verify capacity decrements
5. Verify company available again:
   - Try creating new internship
   - Should succeed

**Expected**: Capacity tracking accurate throughout

### Test Scenario 3: Bulk Operations

**Objective**: Test bulk actions on multiple internships

**Steps**:
1. Select 5-10 internships with checkboxes
2. Bulk send reminders:
   - Click "Send Reminders"
   - Select "pending_weekly_report"
   - Add message: "Weekly report due Friday"
   - Confirm
3. Verify:
   - Success toast shows "Sent to X internships"
   - All selected internships now have reminder
   - Students received notifications
4. Bulk update status:
   - Select same internships
   - Click "Update Status"
   - Change to "active"
   - Add notes
   - Confirm
5. Verify:
   - All internships now have "active" status
   - Activity log updated for each
6. Bulk export:
   - Select internships
   - Click "Export" > CSV
   - Download and verify data
   - Check all selected internships included

**Expected**: All bulk operations succeed

## Background Job Testing

### Test Reminder Processor Job

**Objective**: Verify background job processes scheduled reminders

**Setup**:
1. Create reminders with different scheduled times:
   - One due now
   - One due in 10 minutes
   - One due tomorrow

**Manual Test**:
```bash
cd backend
npm run build

# Run processor manually
node dist/jobs/reminderProcessor.js

# Check output
# Should see: "Processed X reminders"
```

**Verify**:
- Reminders due now are sent
- Reminders due in 10 minutes NOT sent yet
- is_sent flag updated in database
- Notifications created

**PM2 Test**:
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Check logs
pm2 logs reminder-processor --lines 50

# Verify cron execution
# Wait 15 minutes, check logs for new execution
```

**Verify**:
- Job runs every 15 minutes
- No errors in logs
- Reminders processed correctly each run
- Memory usage stable

## Performance Testing

### Load Test: Bulk Operations

**Objective**: Test system under load

**Test 1: Large Bulk Export**

```bash
# Create 1000 test internships
# Then export all

# Measure:
# - Response time (should be < 30s)
# - Memory usage (should not spike)
# - File size and correctness
```

**Test 2: Concurrent Reminder Sending**

```bash
# Create 100 reminders scheduled for same time
# Run processor
# Measure:
# - Processing time
# - Success rate (should be 100%)
# - No deadlocks or errors
```

**Test 3: Capacity Query Performance**

```bash
# Query capacity overview with 500+ companies
# Measure response time (should be < 2s)
```

## Security Testing

### Test 1: Authentication

**Verify**:
- ✅ All endpoints require valid JWT token
- ✅ Expired tokens are rejected
- ✅ Invalid tokens return 401

```bash
# Test without token
curl -X GET http://localhost:5000/api/admin/internships/enhanced/reminders/xxx

# Expected: 401 Unauthorized
```

### Test 2: Authorization

**Verify**:
- ✅ Only admin role can access enhanced endpoints
- ✅ Student/advisor/supervisor get 403 Forbidden

```bash
# Use student JWT token
curl -X POST http://localhost:5000/api/admin/internships/enhanced/reminders \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Expected: 403 Forbidden
```

### Test 3: Input Validation

**Test invalid inputs**:

```bash
# Missing required fields
curl -X POST http://localhost:5000/api/admin/internships/enhanced/reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"internship_id": "xxx"}'

# Expected: 400 Bad Request with validation errors

# Invalid date format
curl -X POST http://localhost:5000/api/admin/internships/enhanced/reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "internship_id": "xxx",
    "reminder_type": "custom",
    "scheduled_for": "invalid-date"
  }'

# Expected: 400 Bad Request

# SQL injection attempt
curl -X GET "http://localhost:5000/api/admin/internships/enhanced/reminders/xxx'; DROP TABLE users; --" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 400 Bad Request or 404 Not Found (NOT 500)
```

## Test Checklist

Use this checklist to track testing progress:

### Backend
- [ ] All 14 API endpoints return 200/201 for valid requests
- [ ] All endpoints require authentication
- [ ] All endpoints validate input
- [ ] Reminder CRUD operations work
- [ ] Capacity validation works
- [ ] Document tracking works
- [ ] Bulk operations work
- [ ] Analytics endpoints work
- [ ] Error responses are consistent
- [ ] Database transactions rollback on error

### Frontend
- [ ] DocumentChecklist component loads data
- [ ] RemindersManagement component CRUD works
- [ ] CompanyStatusCard shows correct info
- [ ] BulkActionsToolbar appears on selection
- [ ] All dialogs/modals open and close properly
- [ ] Form validation works
- [ ] Success toasts appear
- [ ] Error toasts show helpful messages
- [ ] Loading states work
- [ ] Empty states show correctly

### Integration
- [ ] Create internship with capacity check works
- [ ] View internship shows documents
- [ ] View internship shows reminders
- [ ] Bulk select and actions work
- [ ] Reminders send notifications
- [ ] Status updates reflect immediately
- [ ] Activity logs are created

### Background Jobs
- [ ] Reminder processor runs on schedule
- [ ] Scheduled reminders are sent
- [ ] is_sent flag updates
- [ ] No errors in logs
- [ ] Job can be restarted without issues

### Performance
- [ ] API responses < 2s under normal load
- [ ] Bulk operations handle 100+ items
- [ ] No memory leaks after extended use
- [ ] Database queries use indexes

### Security
- [ ] Authentication required for all endpoints
- [ ] Authorization checks role correctly
- [ ] Input sanitized against SQL injection
- [ ] XSS prevention in frontend
- [ ] CSRF protection enabled

## Reporting Issues

When reporting issues, include:

1. **Test that failed**: Which test scenario
2. **Expected behavior**: What should happen
3. **Actual behavior**: What actually happened
4. **Steps to reproduce**: Exact steps
5. **Environment**: OS, browser, versions
6. **Logs**: Backend logs, browser console errors
7. **Screenshots**: If UI issue

**Example Issue Report**:
```
Title: Bulk reminder sending fails for >50 internships

Test: Integration Testing > Test Scenario 3 > Step 2
Expected: All 50 selected internships receive reminder
Actual: Only first 25 receive reminder, then 500 error

Steps:
1. Select 50 internships
2. Click "Send Reminders"
3. Fill form and submit
4. Error toast shows "Request failed"

Environment: Windows 11, Chrome 120, Backend v1.0.0
Logs: See attached backend.log (line 450: "Batch size exceeded")
```

## Success Criteria

All tests pass when:

- ✅ 100% of automated API tests pass
- ✅ All frontend components work without errors
- ✅ Integration scenarios complete successfully
- ✅ Background job runs without failures
- ✅ Performance meets benchmarks (<2s API, <30s exports)
- ✅ Security tests show no vulnerabilities
- ✅ No console errors or warnings in browser
- ✅ No errors in backend logs

Once all criteria met, the Enhanced Admin Internship Management v2.0 is ready for production deployment!
