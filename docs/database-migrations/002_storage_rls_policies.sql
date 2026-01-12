-- Supabase Storage RLS Policies for Documents Bucket
-- Date: 2026-01-11
-- Purpose: Enable secure file upload/download for documents bucket
--          Users can only access files they own or files that are shared with them

-- =====================================================
-- IMPORTANT: Run these policies in Supabase Dashboard
-- Go to: Storage > documents bucket > Policies tab
-- =====================================================

-- Policy 1: Allow authenticated users to upload files
-- Users can INSERT (upload) files to the documents bucket
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
);

-- Policy 2: Allow users to view their own files or shared files
-- Users can SELECT (view/list) files they own or that are shared with them
CREATE POLICY "Allow users to view own or shared documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    -- User owns the file (owner_id in metadata or path)
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- File is shared with user (check document_access_control table)
    EXISTS (
      SELECT 1 
      FROM document_files df
      JOIN document_access_control dac ON dac.document_id = df.document_id
      WHERE df.storage_path = name
        AND dac.user_id = auth.uid()
        AND dac.revoked_at IS NULL
    )
    OR
    -- User is admin (can see all files)
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  )
);

-- Policy 3: Allow users to update their own files
-- Users can UPDATE (modify) files they own
CREATE POLICY "Allow users to update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own files
-- Users can DELETE (remove) files they own
CREATE POLICY "Allow users to delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- ALTERNATIVE SIMPLER POLICIES (if above is too complex)
-- Use these if you want simpler access control
-- =====================================================

-- Simple Policy 1: Allow all authenticated users to upload
-- CREATE POLICY "Allow authenticated uploads"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'documents');

-- Simple Policy 2: Allow all authenticated users to read
-- CREATE POLICY "Allow authenticated reads"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'documents');

-- Simple Policy 3: Allow users to update own files (by path)
-- CREATE POLICY "Allow own updates"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'documents'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Simple Policy 4: Allow users to delete own files (by path)
-- CREATE POLICY "Allow own deletes"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'documents'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
