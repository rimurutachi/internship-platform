# Quick Setup Guide - Enhanced Internship Management v2.0

## 🚀 Quick Installation (5 minutes)

### Step 1: Database Migration

```bash
cd backend
psql $DATABASE_URL -f migrations/001_create_internship_reminders.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `backend/migrations/001_create_internship_reminders.sql`
3. Run the SQL

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install json2csv

# Frontend (if not already installed)
cd frontend
npm install axios
```

### Step 3: Test Backend APIs

Start backend server:
```bash
cd backend
npm run dev
```

Test an endpoint:
```bash
curl -X GET http://localhost:5000/api/admin/internships/companies/capacity-overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Setup Reminder Processor (Optional but Recommended)

**Using PM2 (Recommended for Production):**

Create `backend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'reminder-processor',
      script: './dist/jobs/reminderProcessor.js',
      cron_restart: '*/15 * * * *',
      autorestart: false,
      watch: false
    }
  ]
};
```

Start with PM2:
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

**Using Node-Cron (Alternative):**

Add to `backend/src/server.ts`:
```typescript
import cron from 'node-cron';
import processReminders from './jobs/reminderProcessor';

// Schedule reminder processor (every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled reminder processor...');
  try {
    await processReminders();
  } catch (error) {
    console.error('Reminder processor failed:', error);
  }
});
```

### Step 5: Test Frontend Components

Start frontend dev server:
```bash
cd frontend
npm run dev
```

Components are ready to integrate:
- `components/admin/DocumentChecklist.tsx`
- `components/admin/RemindersManagement.tsx`
- `components/admin/CompanyStatusCard.tsx`
- `components/admin/BulkActionsToolbar.tsx`

---

## 📋 Integration Checklist

### For Admin Internship Details Page

1. Import components:
```typescript
import DocumentChecklist from '@/components/admin/DocumentChecklist';
import RemindersManagement from '@/components/admin/RemindersManagement';
```

2. Add to internship details view:
```tsx
<DocumentChecklist internshipId={internship.id} />
<RemindersManagement internshipId={internship.id} />
```

### For Admin Internship List Page

1. Import components:
```typescript
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
```

2. Add state for selection:
```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

3. Add checkbox column to table and toolbar:
```tsx
{selectedIds.length > 0 && (
  <BulkActionsToolbar 
    selectedIds={selectedIds}
    onClearSelection={() => setSelectedIds([])}
    onActionComplete={() => {
      setSelectedIds([]);
      refetchInternships();
    }}
  />
)}
```

### For Admin Internship Form (Create/Edit)

1. Import component:
```typescript
import CompanyStatusCard from '@/components/admin/CompanyStatusCard';
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';
```

2. Fetch company capacity when company selected:
```typescript
const [companyCapacity, setCompanyCapacity] = useState<CompanyCapacityInfo | null>(null);

useEffect(() => {
  if (selectedCompanyId) {
    loadCompanyCapacity(selectedCompanyId);
  }
}, [selectedCompanyId]);

const loadCompanyCapacity = async (companyId: string) => {
  const companies = await adminInternshipsEnhancedAPI.getCapacityOverview();
  const company = companies.find(c => c.id === companyId);
  setCompanyCapacity(company || null);
};
```

3. Display company status:
```tsx
{companyCapacity && (
  <CompanyStatusCard company={companyCapacity} compact />
)}
```

---

## 🧪 Quick Test Script

Create `backend/test-enhanced-endpoints.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api/admin/internships"
TOKEN="YOUR_AUTH_TOKEN"

echo "Testing Enhanced Internship Endpoints..."

# Test 1: Get capacity overview
echo "\n1. Testing capacity overview..."
curl -X GET "$API_URL/companies/capacity-overview" \
  -H "Authorization: Bearer $TOKEN"

# Test 2: Get reminders for internship
echo "\n2. Testing get reminders..."
curl -X GET "$API_URL/reminders/INTERNSHIP_ID" \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Get document status
echo "\n3. Testing document status..."
curl -X GET "$API_URL/INTERNSHIP_ID/documents-status" \
  -H "Authorization: Bearer $TOKEN"

echo "\n\nTests complete!"
```

Make executable and run:
```bash
chmod +x test-enhanced-endpoints.sh
./test-enhanced-endpoints.sh
```

---

## 🔍 Troubleshooting

### Issue: "Table internship_reminders does not exist"
**Solution:** Run the database migration:
```bash
psql $DATABASE_URL -f backend/migrations/001_create_internship_reminders.sql
```

### Issue: "Cannot find module 'json2csv'"
**Solution:** Install the dependency:
```bash
cd backend && npm install json2csv
```

### Issue: "Authorization header missing"
**Solution:** Ensure you're passing the Supabase auth token:
```typescript
const token = localStorage.getItem('supabase_token');
// Include in axios headers
```

### Issue: Reminders not sending automatically
**Solution:** Check if reminder processor is running:
```bash
pm2 list
# Should see 'reminder-processor' in the list
pm2 logs reminder-processor
```

### Issue: Frontend component errors
**Solution:** Check imports and ensure types are available:
```bash
# Verify type file exists
ls frontend/src/types/internships-enhanced.ts

# Restart Next.js dev server
cd frontend && npm run dev
```

---

## 📊 Verify Installation

Run these commands to verify everything is set up:

```bash
# 1. Check database tables
psql $DATABASE_URL -c "\dt internship_reminders"

# 2. Check backend files
ls -la backend/src/services/internshipsEnhancedService.ts
ls -la backend/src/controllers/admin/internshipsEnhancedController.ts
ls -la backend/src/jobs/reminderProcessor.ts

# 3. Check frontend files
ls -la frontend/src/types/internships-enhanced.ts
ls -la frontend/lib/api/admin-internships-enhanced.ts
ls -la frontend/src/components/admin/DocumentChecklist.tsx
ls -la frontend/src/components/admin/RemindersManagement.tsx
ls -la frontend/src/components/admin/CompanyStatusCard.tsx
ls -la frontend/src/components/admin/BulkActionsToolbar.tsx

# 4. Test backend compilation
cd backend && npm run build

# 5. Test frontend compilation
cd frontend && npm run build
```

All files should exist and compile without errors.

---

## 🎯 Next Actions

1. ✅ Run database migration
2. ✅ Install dependencies
3. ✅ Setup reminder processor
4. ⏳ Integrate components into existing pages
5. ⏳ Test end-to-end functionality
6. ⏳ Deploy to production

---

**Need Help?**
- Check `docs/ENHANCED_INTERNSHIP_IMPLEMENTATION_SUMMARY.md` for detailed documentation
- Review individual component files for usage examples
- Test endpoints with Postman collection (can be created from route definitions)
