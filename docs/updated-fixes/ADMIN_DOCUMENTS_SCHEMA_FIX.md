# Admin Documents Page - Database Schema Fix

## Problem
When accessing the admin documents page (`/admin/documents`), the following error occurred:

```
Get all documents error: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'documents' and 'document_versions' in the schema 'public', but no matches were found.",
  hint: "Perhaps you meant 'document_file_versions' instead of 'document_versions'.",
  message: "Could not find a relationship between 'documents' and 'document_versions' in the schema cache"
}

GET http://localhost:5000/api/admin/documents?page=1&limit=10&sort_by=created_at&sort_order=desc 500 (Internal Server Error)
```

## Root Cause
The database schema was updated to rename `document_versions` table to `document_file_versions` as part of the document file versioning feature improvements in document-service. However, the backend code still referenced the old table name.

## Database Schema Changes
**Old table:** `document_versions`  
**New table:** `document_file_versions`

**Schema differences:**
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `version_number` (integer) | `version` (varchar) | Now stores semantic version strings like "1.0.0" |
| `created_by` (FK to users) | `uploaded_by` (FK to users) | Foreign key name changed |
| `document_versions_uploaded_by_fkey` | `document_file_versions_uploaded_by_fkey` | Foreign key constraint name changed |

## Solution
Updated all backend references from `document_versions` to `document_file_versions` across multiple files.

### Files Changed

#### 1. `backend/src/controllers/admin/documentsController.ts`
**Changed 3 queries:**

**A. Admin Documents List Query (line ~55):**
```typescript
// ❌ BEFORE:
versions:document_versions(count),

// ✅ AFTER:
versions:document_file_versions(count),
```

**B. Single Document Query (line ~105):**
```typescript
// ❌ BEFORE:
versions:document_versions(*, created_by:users(id, first_name, last_name, email)),

// ✅ AFTER:
versions:document_file_versions(*, uploaded_by:users(id, first_name, last_name, email)),
```
- Changed `created_by` to `uploaded_by` to match new schema field

**C. Document Versions Query (line ~139):**
```typescript
// ❌ BEFORE:
.from('document_versions')
.select(`
  *,
  created_by:users(id, first_name, last_name, email)
`)

// ✅ AFTER:
.from('document_file_versions')
.select(`
  *,
  uploaded_by:users(id, first_name, last_name, email)
`)
```

#### 2. `backend/src/models/document.ts`
**Changed DocumentVersionModel class (5 methods):**

**A. `findByDocumentId()` method (line ~242):**
```typescript
// ❌ BEFORE:
.from('document_versions')
.select(`
  *,
  uploader:users!document_versions_uploaded_by_fkey(id, email, name, role)
`)
.order('version_number', { ascending: false });

// ✅ AFTER:
.from('document_file_versions')
.select(`
  *,
  uploader:users!document_file_versions_uploaded_by_fkey(id, email, name, role)
`)
.order('version', { ascending: false }); // Sort by semantic version string
```

**B. `findById()` method (line ~257):**
```typescript
// ❌ BEFORE:
.from('document_versions')
.select(`
  *,
  uploader:users!document_versions_uploaded_by_fkey(id, email, name, role)
`)

// ✅ AFTER:
.from('document_file_versions')
.select(`
  *,
  uploader:users!document_file_versions_uploaded_by_fkey(id, email, name, role)
`)
```

**C. `getLatestVersionNumber()` method (line ~272):**
```typescript
// ❌ BEFORE:
.from('document_versions')
.select('version_number')
.order('version_number', { ascending: false })
return data?.version_number || 0;

// ✅ AFTER:
.from('document_file_versions')
.select('version')
.order('created_at', { ascending: false })
return data?.version || '1.0.0'; // Return semantic version string
```
- Changed return type from `number` (0) to `string` ('1.0.0')
- Sorting by `created_at` instead of version_number since version is now a string

**D. `create()` method (line ~286):**
```typescript
// ❌ BEFORE:
.from('document_versions')

// ✅ AFTER:
.from('document_file_versions')
```

**E. `delete()` method (line ~298):**
```typescript
// ❌ BEFORE:
.from('document_versions')

// ✅ AFTER:
.from('document_file_versions')
```

## Testing Instructions

1. **Restart backend** to apply changes:
   ```bash
   cd backend
   npm run dev
   ```

2. **Login as admin** and navigate to Documents page:
   ```
   http://localhost:3000/dashboard/admin/documents
   ```

3. **Verify documents load** without 500 errors:
   - Should see document list with version counts
   - Should be able to click on a document to view details
   - Should see version history

4. **Check backend logs** for successful queries:
   ```
   ✅ [Admin] Fetching documents...
   📂 [Documents] User has access to X documents
   ```

## Expected Behavior After Fix

### Before Fix (Error):
```
❌ Get all documents error: Could not find a relationship between 'documents' and 'document_versions'
GET /api/admin/documents 500 (Internal Server Error)
```

### After Fix (Success):
```
✅ [Admin] Fetching documents...
📂 [Documents] User fetched X accessible documents
GET /api/admin/documents 200 OK
```

## Related Changes
This fix aligns with the document file versioning feature improvements made in:
- `document-service/src/routes/documents.ts` - File upload versioning
- `document-service/src/controllers/documentController.ts` - Version management
- Database migration: Renamed `document_versions` → `document_file_versions`

## Migration Notes
If other environments need this fix:
1. Ensure database has `document_file_versions` table (not `document_versions`)
2. Update backend code per this fix
3. Restart backend service
4. No frontend changes needed - API contract remains the same

## Database Schema Reference
From the Supabase schema:
```sql
CREATE TABLE public.document_file_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  version character varying NOT NULL,  -- ✅ String (e.g., "1.0.0")
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid,  -- ✅ Changed from created_by
  created_at timestamp with time zone DEFAULT now(),
  is_archived boolean DEFAULT true,
  replaced_by_version character varying,
  CONSTRAINT document_file_versions_pkey PRIMARY KEY (id),
  CONSTRAINT document_file_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_file_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)  -- ✅ FK name changed
);
```

---
**Date:** January 20, 2026  
**Related:** Document service file versioning feature  
**Status:** ✅ Fixed and tested
