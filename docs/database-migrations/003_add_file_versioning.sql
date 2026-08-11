-- ============================================
-- Migration: Add File Versioning System
-- Purpose: Google Drive-style version control for document re-uploads
-- Date: 2026-01-14
-- Status: ✅ APPLIED
-- ============================================

-- Step 1: Rename existing document_versions to avoid confusion
-- Old: document_versions (for JSONB content changes)
-- New: document_content_versions (clarifies it's for collaborative editing, not files)
ALTER TABLE public.document_versions 
RENAME TO document_content_versions;

COMMENT ON TABLE public.document_content_versions IS 
'Stores JSONB content change history for collaborative editing (separate from file versioning). Used for tracking text edits, diffs, and operational transforms.';

-- Step 2: Create new document_file_versions table
-- Purpose: Store archived file versions when user re-uploads same document name
CREATE TABLE public.document_file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version varchar NOT NULL,  -- e.g., 'v1.0.0', 'v2.0.0'
  storage_path text NOT NULL,  -- Supabase Storage path (e.g., 'documents/user_id/file.pdf')
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),
  deleted_at timestamptz,
  
  -- Optional metadata for tracking version chain
  is_archived boolean DEFAULT true,  -- Old versions are archived by default
  replaced_by_version varchar,  -- Points to next version (e.g., 'v2.0.0')
  
  CONSTRAINT unique_doc_version UNIQUE (document_id, version)
);

COMMENT ON TABLE public.document_file_versions IS 
'Stores historical file versions when same-name document is re-uploaded (Google Drive style versioning). Each row represents one archived version of a document file.';

COMMENT ON COLUMN public.document_file_versions.version IS 
'Version string (e.g., v1.0.0, v2.0.0). Increments on each re-upload of same document name.';

COMMENT ON COLUMN public.document_file_versions.replaced_by_version IS 
'Points to the next version that replaced this one. Null for current version.';

-- Step 3: Create indexes for fast version history queries
CREATE INDEX idx_file_versions_doc_created 
ON public.document_file_versions(document_id, created_at DESC);

CREATE INDEX idx_file_versions_lookup 
ON public.document_file_versions(document_id, version);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE public.document_file_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view file versions if they have access to the document
CREATE POLICY "file_versions_select_has_view"
ON public.document_file_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_file_versions.document_id
    AND (
      -- User owns the document
      d.owner_id = auth.uid()
      OR
      -- User has been granted access via document_access_control
      EXISTS (
        SELECT 1 FROM public.document_access_control dac
        WHERE dac.document_id = d.id
        AND dac.user_id = auth.uid()
        AND dac.revoked_at IS NULL
        AND (dac.expires_at IS NULL OR dac.expires_at > now())
      )
      OR
      -- User is admin
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
      )
    )
  )
);

-- Policy: Only document owner or admin can insert version history
CREATE POLICY "file_versions_insert_owner_or_admin"
ON public.document_file_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_file_versions.document_id
    AND d.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Policy: Only admin can delete version history (for cleanup/archival)
CREATE POLICY "file_versions_delete_admin_only"
ON public.document_file_versions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT ON public.document_file_versions TO authenticated;
GRANT DELETE ON public.document_file_versions TO service_role;

-- ============================================
-- Migration Complete ✅
-- ============================================

-- VERIFICATION QUERIES (run after migration):
-- 1. Check table was renamed:
--    SELECT * FROM document_content_versions LIMIT 1;
--
-- 2. Check new table exists:
--    SELECT * FROM document_file_versions LIMIT 1;
--
-- 3. Verify RLS policies:
--    SELECT tablename, policyname, cmd FROM pg_policies 
--    WHERE tablename = 'document_file_versions';
--
-- 4. Test insert permission (as authenticated user):
--    -- Should allow document owners to create version records
--
-- ============================================
-- CODE CHANGES REQUIRED:
-- ============================================
-- ✅ document-service/src/controllers/documentController.ts
--    - createDocument(): Use document_file_versions table for INSERT
--    - getVersions(): SELECT from document_file_versions
--    - getVersionDownloadUrl(): Query document_file_versions for storage_path
--    - deleteDocument(): CASCADE delete from document_file_versions
--
-- ✅ frontend/src/types/documents.ts
--    - DocumentVersion interface: Add storage_path, mime_type, uploaded_by, 
--      is_archived, replaced_by_version fields
--
-- ✅ All frontend components already use version.file_path (mapped from storage_path)
--    - No additional frontend changes needed
-- ============================================
