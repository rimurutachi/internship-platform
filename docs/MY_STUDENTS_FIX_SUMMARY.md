# My Students Page - No Data Issue & Progress Column Fix

## Issues Found:

### 1. **"No students found" Problem**
**Root Cause**: Authentication middleware not populating `req.user` with advisor's ID.

**Debug Steps**:
1. Check backend terminal logs when accessing `/api/advisor/students`
2. Look for: `🔍 [Advisor Students] Request from user:` log
3. Verify `userId` is present and matches Alvin Catalo's ID in database

**Possible Solutions**:
- If `userId` is null → Auth middleware issue, check JWT token
- If `userId` exists but no internships → Check `advisor_id` in internships table matches this ID
- Run `debug-advisor-students.sql` in Supabase to see actual data

---

### 2. **Progress Column Added** ✅

**SQL Migration**: `backend/sql/add-progress-column.sql`

**Features**:
- ✅ Added `progress` INTEGER column (0-100)
- ✅ Auto-calculates based on weekly reports submitted vs total weeks
- ✅ Trigger automatically updates progress when reports are added/updated
- ✅ Function: `calculate_internship_progress(internship_id)`
- ✅ Trigger: `weekly_report_progress_update` on `weekly_reports` table

**Formula**:
```
total_weeks = CEIL((end_date - start_date) / 7)
submitted_weeks = COUNT(DISTINCT week_number) from weekly_reports
progress = (submitted_weeks / total_weeks) * 100
```

**Example**:
- Internship: Jan 1 - Apr 1 (13 weeks)
- Reports submitted: 5 weeks
- Progress: (5 / 13) * 100 = 38%

---

## Files Modified:

### Backend:
1. **`backend/src/routes/advisor/students.ts`**
   - ✅ Added debug logging
   - ✅ Restored `progress` field in queries (lines 38, 118, 167, 236)

### Frontend:
2. **`frontend/src/lib/api/advisor-students.ts`**
   - ✅ Changed `progress?: number` back to `progress: number`

3. **`frontend/src/app/dashboard/advisor/students/MyStudents.tsx`**
   - ✅ Removed `?? 0` defaults (3 locations)
   - ✅ Progress now displays actual value from database

### SQL:
4. **`backend/sql/add-progress-column.sql`** (NEW)
   - Run this in Supabase SQL Editor
   - Adds column, function, and trigger

5. **`backend/sql/debug-advisor-students.sql`** (NEW)
   - Debug query to check internships data
   - Verify advisor assignments

---

## How to Fix:

### Step 1: Add Progress Column to Database
```bash
# In Supabase SQL Editor, run:
backend/sql/add-progress-column.sql
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

### Step 3: Check Logs
When you refresh My Students page, check backend terminal for:
```
🔍 [Advisor Students] Request from user: { userId: '...', userEmail: '...', userRole: 'advisor' }
📊 [Advisor Students] Query result: { advisorId: '...', internshipsCount: 4, error: null }
```

### Step 4: If Still No Data
Run `debug-advisor-students.sql` in Supabase and check:
- Does Alvin Catalo exist in `users` table?
- Do the 4 internships have `advisor_id` matching Alvin's ID?
- Are the student records properly linked?

---

## Expected Result:

**My Students Page should show**:
- ✅ Total: 4 students (from screenshot)
- ✅ Active: 2
- ✅ Completed: 2
- ✅ Each student card with progress bar (0-100%)
- ✅ Progress auto-updates as weekly reports are submitted

---

## Database Schema Updated:

```sql
CREATE TABLE public.internships (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  company_id uuid NOT NULL,
  advisor_id uuid NOT NULL,
  supervisor_id uuid,
  position text NOT NULL,
  department text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending',
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- NEW!
  requirements jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

---

## Next Steps:

1. ✅ Run SQL migration for progress column
2. 🔍 Debug authentication issue (check logs)
3. ✅ Restart backend with updated code
4. ✅ Test My Students page
5. ✅ Verify progress updates when weekly reports submitted

Let me know what you see in the backend logs! 🚀
