# Column Name Fix - advisor_id → created_by

## Issue:
Backend code was using `advisor_id` column but the database table uses `created_by`.

## Root Cause:
The `document_requirements` table was created with `created_by` column (standard naming), but the service code assumed `advisor_id`.

## Files Changed:

### backend/src/services/documentSubmissionsService.ts
**All 9 occurrences of `advisor_id` replaced with `created_by`:**

1. **Line 66** - `submitDocument()` requirement query
   - Changed: `select('id, title, advisor_id, target_students, ...')`
   - To: `select('id, title, created_by, target_audience, metadata, ...')`

2. **Line 121** - `submitDocument()` notification
   - Changed: `requirement.advisor_id`
   - To: `requirement.created_by`

3. **Line 140** - `resubmitDocument()` requirement join
   - Changed: `requirement:document_requirements(id, title, advisor_id, ...)`
   - To: `requirement:document_requirements(id, title, created_by, ...)`

4. **Line 185** - `resubmitDocument()` notification
   - Changed: `requirement.advisor_id`
   - To: `requirement.created_by`

5. **Line 256** - `getRequirementSubmissions()` access check
   - Changed: `.eq('advisor_id', advisorId)`
   - To: `.eq('created_by', advisorId)`

6. **Line 317** - `getSubmissionById()` requirement join
   - Changed: `requirement:document_requirements(... advisor_id)`
   - To: `requirement:document_requirements(... created_by)`

7. **Line 336** - `getSubmissionById()` advisor access control
   - Changed: `requirement?.advisor_id !== userId`
   - To: `requirement?.created_by !== userId`

8. **Line 356** - `reviewSubmission()` requirement join
   - Changed: `requirement:document_requirements(id, title, advisor_id)`
   - To: `requirement:document_requirements(id, title, created_by)`

9. **Line 366** - `reviewSubmission()` ownership verification
   - Changed: `requirement.advisor_id !== advisorId`
   - To: `requirement.created_by !== advisorId`

## Additional Fixes:

### Schema Alignment:
Also updated `target_students` references to use new schema:
- Changed from: `requirement.target_students` array check
- To: `this.isStudentTargeted(studentId, requirement.target_audience, requirement.metadata)`

### New Helper Method Added:
```typescript
private isStudentTargeted(studentId: string, targetAudience: string, metadata: any): boolean
```
- Handles `all_students` targeting
- Handles `specific_student` with `metadata.student_ids` array
- Handles `specific_internship` (delegated to earlier query)

## Testing:
✅ No TypeScript errors
✅ All references updated consistently
✅ Helper method added for schema alignment

## Status:
**✅ FIXED** - All `advisor_id` references replaced with `created_by`

Restart backend server to apply changes:
```bash
cd backend
npm run dev
```
