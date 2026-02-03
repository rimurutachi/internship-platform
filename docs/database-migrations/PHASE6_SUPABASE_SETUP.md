# Phase 6: Supabase Setup Guide

## 1. Database - Add Notification Types

Run this SQL script in **Supabase SQL Editor**:

```sql
-- Add Phase 6 Document Requirements notification types
DO $$ 
BEGIN
    -- Add 'document_required' for when advisor posts a new requirement
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_required' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_required';
        RAISE NOTICE 'Added notification_type: document_required';
    ELSE
        RAISE NOTICE 'notification_type document_required already exists';
    END IF;

    -- Add 'document_submitted' for when student submits a document
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_submitted' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_submitted';
        RAISE NOTICE 'Added notification_type: document_submitted';
    ELSE
        RAISE NOTICE 'notification_type document_submitted already exists';
    END IF;

    -- Add 'document_reviewed' for when advisor reviews a submission
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_reviewed' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_reviewed';
        RAISE NOTICE 'Added notification_type: document_reviewed';
    ELSE
        RAISE NOTICE 'notification_type document_reviewed already exists';
    END IF;

    -- Add 'document_revision_requested' for when advisor requests revisions
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_revision_requested' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_revision_requested';
        RAISE NOTICE 'Added notification_type: document_revision_requested';
    ELSE
        RAISE NOTICE 'notification_type document_revision_requested already exists';
    END IF;

    -- Add 'document_approved' for when advisor approves a submission
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'document_approved' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
        ALTER TYPE notification_type ADD VALUE 'document_approved';
        RAISE NOTICE 'Added notification_type: document_approved';
    ELSE
        RAISE NOTICE 'notification_type document_approved already exists';
    END IF;
END $$;
```

## 2. Storage - Reuse Existing `documents` Bucket

**Good news:** You already have a `documents` bucket! We'll reuse it with a proper folder structure.

### Folder Structure in `documents` Bucket:
```
documents/
├── document-submissions/        # For Phase 6 student submissions
│   ├── {user_id}/
│   │   ├── {requirement_id}/
│   │   │   ├── {timestamp}_{filename}
│   │   │   └── ...
│   └── ...
├── document-collaboration/      # For existing document management (if any)
│   └── ...
└── message-attachments/         # For communication files (if any)
    └── ...
```

### Storage Policies Already Set:

Based on your screenshot, the `documents` bucket already has these policies:
- ✅ **Allow authenticated users to upload documents** (INSERT)
- ✅ **Allow users to delete own documents** (DELETE)
- ✅ **Allow users to update own documents** (UPDATE)
- ✅ **Allow users to view own or shared documents** (SELECT)

**These policies are perfect for Phase 6!** No changes needed.

## 3. How Files Are Organized:

When a student uploads a document submission:
- **Path:** `document-submissions/{student_id}/{requirement_id}/{timestamp}_{filename}`
- **Example:** `document-submissions/abc123/req456/1706544000000_MOA_Notarized.pdf`

This keeps files organized by:
1. **Student** - Each student's submissions in their own folder
2. **Requirement** - Submissions for each requirement separated
3. **Version** - Timestamp ensures unique filenames for resubmissions

## 4. Testing the Setup:

After running the SQL script above:

1. **Test Creating Requirement:**
   - Login as Advisor
   - Go to Requirements page
   - Click "New Requirement"
   - Fill out form and submit
   - ✅ Should create requirement without errors
   - ✅ Target students should receive notification

2. **Test Submitting Document:**
   - Login as Student
   - Go to Requirements page
   - Click on a requirement
   - Upload a document (PDF, DOC, etc.)
   - ✅ File should upload to Supabase Storage
   - ✅ Advisor should receive notification
   - ✅ Submission should show in advisor's view

3. **Test Reviewing Submission:**
   - Login as Advisor
   - Go to Requirements page
   - Click on requirement with submissions
   - Click "Review" on a submission
   - Approve or request revision
   - ✅ Student should receive notification
   - ✅ Status should update

## 5. Troubleshooting:

If you get **403 Forbidden** errors when uploading:
1. Check if user is authenticated (JWT token valid)
2. Verify bucket policies allow INSERT for authenticated users
3. Check browser console for detailed error messages

If files don't appear:
1. Verify file was uploaded successfully (check Supabase Storage UI)
2. Check file path matches expected structure
3. Ensure SELECT policy allows user to view files

## 6. Optional: File Size Limits

Currently set to **10MB max** in frontend code. To change:
- Edit `frontend/src/app/dashboard/student/requirements/[id]/page.tsx`
- Line ~98: `if (file.size > 10 * 1024 * 1024)`
- Adjust multiplier as needed (e.g., `20 * 1024 * 1024` for 20MB)
