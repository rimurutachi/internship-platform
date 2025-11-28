# Enhanced Admin Internship Management - Integration Guide

## Overview

This guide explains how the Enhanced Admin Internship Management v2.0 features have been integrated into the existing platform. All components are ready to use and fully integrated.

## Table of Contents

1. [Integration Summary](#integration-summary)
2. [Component Integration Details](#component-integration-details)
3. [Backend Integration](#backend-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)

## Integration Summary

### ✅ Completed Integrations

1. **ViewInternshipModal** - Enhanced with Documents & Reminders tabs
2. **CreateInternshipModal** - Enhanced with company capacity validation
3. **Admin Internships Page** - Enhanced with bulk actions and multi-select
4. **PM2 Configuration** - Reminder processor background job setup

### 🎯 Enhanced Features Available

- ✅ Document tracking and checklist
- ✅ Automated and manual reminders
- ✅ Company capacity management
- ✅ Bulk operations (send reminders, update status, export)
- ✅ Real-time capacity validation
- ✅ Background job for scheduled reminders

## Component Integration Details

### 1. View Internship Modal (Documents & Reminders)

**Location**: `frontend/src/components/admin/ViewInternshipModal.tsx`

**Changes Made**:
- Added tab navigation (Overview, Documents, Reminders)
- Integrated `DocumentChecklist` component in Documents tab
- Integrated `RemindersManagement` component in Reminders tab

**Usage**:
```tsx
<ViewInternshipModal
  open={viewModalOpen}
  onClose={() => setViewModalOpen(false)}
  internshipId={selectedInternship?.id}
/>
```

**Features**:
- **Overview Tab**: Original internship details view
- **Documents Tab**: 
  - Real-time document submission tracking
  - Required documents checklist
  - Submission status and timestamps
  - Document type filtering
- **Reminders Tab**:
  - Create scheduled reminders
  - Send immediate reminders
  - View reminder history
  - Edit/delete pending reminders

### 2. Create Internship Modal (Capacity Validation)

**Location**: `frontend/src/components/admin/CreateInternshipModal.tsx`

**Changes Made**:
- Added company capacity loading on company selection
- Integrated `CompanyStatusCard` component
- Added capacity validation before submission

**Usage**:
```tsx
<CreateInternshipModal
  open={createModalOpen}
  onClose={() => setCreateModalOpen(false)}
  onSuccess={handleSuccess}
/>
```

**Features**:
- **Company Status Card**: Displays when company is selected
  - Verification status (affiliated/new)
  - MOA status with expiry date
  - Current capacity (e.g., 8/10 students)
  - Warning if near or at capacity
- **Validation**: Prevents submission if company is at full capacity
- **Real-time Updates**: Capacity info fetched on company selection

### 3. Admin Internships Page (Bulk Actions)

**Location**: `frontend/src/app/dashboard/admin/internships/page.tsx`

**Changes Made**:
- Added multi-select checkboxes (select all + individual)
- Integrated `BulkActionsToolbar` component
- Added selection state management

**Usage**:
The page now supports:
1. Click checkbox in header to select all internships
2. Click individual checkboxes to select specific internships
3. Bulk actions toolbar appears when 1+ selected

**Features**:
- **Multi-Select**: 
  - Select all checkbox in table header
  - Individual checkboxes per row
  - Selection count display
- **Bulk Actions Toolbar**:
  - Send reminders to multiple internships
  - Update status for multiple internships
  - Export selected data (CSV, JSON, Excel)
  - Generate bulk reports
  - Clear selection button

## Backend Integration

### API Endpoints

All 14 new endpoints are registered and available:

**Base URL**: `/api/admin/internships/enhanced`

#### Reminder Endpoints
- `GET /reminders/:internshipId` - Get reminders for internship
- `POST /reminders` - Create new reminder
- `PATCH /reminders/:id` - Update reminder
- `DELETE /reminders/:id` - Delete reminder
- `POST /reminders/:id/send` - Send immediate reminder
- `POST /reminders/bulk-send` - Bulk send reminders

#### Capacity Endpoints
- `GET /capacity/overview` - Get all companies' capacity info
- `POST /capacity/validate` - Validate company capacity

#### Document Endpoints
- `GET /documents/:internshipId` - Get document status
- `GET /documents/completion-rate` - Get completion statistics

#### Bulk Operation Endpoints
- `POST /bulk/update-status` - Bulk update internship status
- `POST /bulk/export` - Export internships data
- `POST /analytics/generate-report` - Generate analytics report
- `GET /analytics/deadline-tracking` - Track approaching deadlines

### Background Job Setup

**File**: `backend/ecosystem.config.js`

**Configuration**:
```javascript
{
  name: 'reminder-processor',
  script: './dist/jobs/reminderProcessor.js',
  cron_restart: '*/15 * * * *', // Every 15 minutes
  autorestart: false
}
```

**To Start**:
```bash
cd backend
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on boot
```

**Monitor**:
```bash
pm2 monit                                    # Live monitoring
pm2 logs reminder-processor                  # View logs
pm2 list                                     # Check status
```

## Testing the Integration

### 1. Test Document Tracking

1. Navigate to Admin > Internships
2. Click "View" on any internship
3. Go to "Documents" tab
4. Verify you see:
   - List of required documents
   - Submission status (submitted/pending/overdue)
   - Submission timestamps
   - Overall completion percentage

### 2. Test Reminders Management

1. In same internship view modal
2. Go to "Reminders" tab
3. Test creating a reminder:
   - Select reminder type
   - Set scheduled date/time
   - Choose notification channel
   - Add custom message
4. Test sending immediate reminder
5. Verify reminder appears in list

### 3. Test Company Capacity

1. Click "Create Internship"
2. Select a company from dropdown
3. Verify you see:
   - Company status card appears
   - Verification status displayed
   - MOA status shown
   - Current capacity (X/Y students)
4. Try selecting a company at capacity
5. Verify submit button is disabled with warning

### 4. Test Bulk Actions

1. In internships list page
2. Check multiple internship checkboxes
3. Verify bulk actions toolbar appears
4. Test each action:
   - **Send Reminders**: Opens dialog to send bulk reminders
   - **Update Status**: Opens dialog to change status for all
   - **Export**: Downloads selected data in chosen format
   - **Clear**: Deselects all internships

### 5. Test Background Reminder Processor

1. Create a reminder scheduled for future date
2. Wait for scheduled time (or manually run processor)
3. Verify:
   - Reminder is marked as sent
   - Notification was created
   - Email was sent (if configured)

**Manual Run**:
```bash
cd backend
npm run build
node dist/jobs/reminderProcessor.js
```

### 6. Test API Endpoints

Use the test script (see next section) or manually with curl:

```bash
# Get reminders for internship
curl -X GET http://localhost:5000/api/admin/internships/enhanced/reminders/{internship_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get capacity overview
curl -X GET http://localhost:5000/api/admin/internships/enhanced/capacity/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get document status
curl -X GET http://localhost:5000/api/admin/internships/enhanced/documents/{internship_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: Components not showing data

**Possible Causes**:
1. Database migration not run
2. API endpoints not accessible
3. User not authenticated

**Solution**:
```bash
# 1. Run database migration
psql $DATABASE_URL -f backend/migrations/001_create_internship_reminders.sql

# 2. Check backend is running
curl http://localhost:5000/health

# 3. Check authentication token in browser DevTools
```

### Issue: Capacity info not loading

**Possible Cause**: Companies table missing new columns

**Solution**:
```sql
-- Run this in your database
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS capacity_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS current_students INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_moa_standardized BOOLEAN DEFAULT false;
```

### Issue: Bulk actions not working

**Possible Causes**:
1. No internships selected
2. Backend endpoint error
3. Permission issues

**Solution**:
1. Verify checkbox selection is working
2. Check browser console for errors
3. Check backend logs for API errors
4. Verify admin role in JWT token

### Issue: Reminder processor not running

**Possible Causes**:
1. PM2 not started
2. Cron schedule misconfigured
3. Build files missing

**Solution**:
```bash
# Check PM2 status
pm2 list

# Rebuild and restart
cd backend
npm run build
pm2 restart reminder-processor

# Check logs
pm2 logs reminder-processor --lines 50
```

### Issue: Import path errors

**Error**: `Cannot find module '@/lib/api/admin-internships-enhanced'`

**Solution**: The enhanced API is outside `src/`, use relative path:
```tsx
// ❌ Wrong
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';

// ✅ Correct
import adminInternshipsEnhancedAPI from '../../../lib/api/admin-internships-enhanced';
```

## Performance Considerations

### Frontend Optimization

1. **Document Checklist**: Caches document status, only refetches on internship change
2. **Reminders**: Paginated by default (50 per page)
3. **Bulk Actions**: Shows progress indicator for long operations

### Backend Optimization

1. **Capacity Queries**: Uses indexed company_id lookups
2. **Reminder Processing**: Batches notifications to avoid overwhelming notification service
3. **Exports**: Streams large datasets to avoid memory issues

## Next Steps

1. **Run Database Migration**: Ensure all new columns and triggers are in place
2. **Start PM2**: Enable background reminder processing
3. **Test All Features**: Follow testing guide above
4. **Monitor Logs**: Watch for any errors in first few hours
5. **Adjust Reminder Schedule**: Modify PM2 cron if 15 minutes is too frequent

## Additional Resources

- [Enhanced Internships README](./ENHANCED_INTERNSHIPS_README.md) - Feature overview
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Quick Setup Guide](./QUICK_SETUP_ENHANCED_INTERNSHIPS.md) - Fast setup reference
- [Implementation Summary](./ENHANCED_INTERNSHIP_IMPLEMENTATION_SUMMARY.md) - Technical details

## Support

For issues or questions:
1. Check error logs: `pm2 logs` for backend, browser console for frontend
2. Review implementation files listed above
3. Verify database schema matches migration file
4. Ensure all dependencies are installed (`npm install` in backend and frontend)
