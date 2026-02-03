# Database Migration Guide - Document Upload Fix

## Problem Summary
1. ❌ **Enum Error**: Database `document_type` enum missing new file types (pdf, docx, xlsx, image, zip)
2. ❌ **Storage Error**: Supabase Storage `documents` bucket has no RLS policies

## Solution Steps

### Step 1: Update Document Type Enum (Required)

**Option A: Using Supabase Dashboard SQL Editor**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `internship-platform`
3. Go to: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Copy and paste content from: `docs/database-migrations/001_update_document_type_enum.sql`
6. Click: **Run** button
7. ✅ Expected output: "Success. No rows returned"

**Option B: Using psql (if you have direct access)**
```bash
psql "YOUR_DATABASE_URL" -f docs/database-migrations/001_update_document_type_enum.sql
```

**Verify Migration:**
Run this query to check if new types were added:
```sql
SELECT unnest(enum_range(NULL::document_type)) as document_types;
```

Expected result:
```
document_types
---------------
evaluation
agreement
report
form
certificate
memorandum
other
pdf
docx
xlsx
image
zip
```

---

### Step 2: Add Storage RLS Policies (Required)

**Using Supabase Dashboard:**

1. Go to: **Storage** (left sidebar)
2. Click on: `documents` bucket
3. Go to: **Policies** tab
4. Click: **New policy** button

**Add 4 Policies (one by one):**

#### Policy 1: Upload Documents
```sql
-- Name: Allow authenticated users to upload documents
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

#### Policy 2: View Documents
```sql
-- Name: Allow users to view own or shared documents
-- Operation: SELECT
-- Target roles: authenticated

CREATE POLICY "Allow users to view own or shared documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

#### Policy 3: Update Documents
```sql
-- Name: Allow users to update own documents
-- Operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Allow users to update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Delete Documents
```sql
-- Name: Allow users to delete own documents
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Allow users to delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**OR use simplified policies (easier, less restrictive):**

Just add these 2 policies if you want simpler access:

```sql
-- Policy 1: Allow all authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy 2: Allow all authenticated users to read
CREATE POLICY "Allow authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

---

### Step 3: Test Upload & Download

1. **Clear browser cache/reload**: Ctrl+Shift+R (hard reload)
2. **Test Upload**:
   - Click "Upload Document" button
   - Select any file (PDF, DOCX, XLSX, image, ZIP)
   - Enter title
   - Click "Upload Document"
   - ✅ Expected: Success toast, document appears in list
3. **Test Download**:
   - Click on a document with uploaded file
   - Click "Download" button
   - ✅ Expected: File downloads successfully
4. **Check Supabase Storage**:
   - Go to Storage > documents bucket
   - ✅ Expected: Files visible in bucket

---

## Troubleshooting

### If upload still fails:
1. Check browser console for errors
2. Check document-service terminal logs
3. Verify enum was updated: Run query in Step 1 verification
4. Verify policies exist: Storage > documents > Policies tab should show 2-4 policies

### If download fails:
1. Check if file exists in Storage > documents bucket
2. Check if document has entry in `document_files` table
3. Check browser console for 403/404 errors
4. Verify policy 2 (SELECT/read) exists

### If "Access Denied" errors:
1. RLS policies may be too restrictive
2. Use simplified policies from Step 2
3. Check user is authenticated (has valid JWT token)

---

## Files Created
- `docs/database-migrations/001_update_document_type_enum.sql` - Enum migration
- `docs/database-migrations/002_storage_rls_policies.sql` - Storage policies (reference)
- `docs/database-migrations/MIGRATION_GUIDE.md` - This guide

## Next Steps After Migration
1. ✅ Restart all services (backend, document-service, frontend)
2. ✅ Test upload new document
3. ✅ Test download document
4. ✅ Test share document
5. ✅ Verify files in Supabase Storage bucket
