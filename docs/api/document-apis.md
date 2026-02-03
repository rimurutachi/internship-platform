# Document Management API Reference

## Overview
Complete API documentation for the admin document management system. All endpoints require admin authentication.

## Base URL
```
http://localhost:5000/api/admin/documents
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

The backend validates admin role from the JWT token's `app_metadata.role` or `user_metadata.role`.

---

## Endpoints

### 1. Get Document Statistics
Get overview statistics for all documents.

**Endpoint**: `GET /stats/overview`

**Response**:
```json
{
  "total_documents": 156,
  "by_status": {
    "draft": 23,
    "in_review": 15,
    "approved": 45,
    "published": 50,
    "archived": 20,
    "rejected": 3
  },
  "by_type": {
    "evaluation": 40,
    "agreement": 30,
    "report": 25,
    "form": 20,
    "certificate": 15,
    "memorandum": 10,
    "other": 16
  },
  "by_owner": {
    "user_id_1": 50,
    "user_id_2": 30,
    "user_id_3": 25
  },
  "recent_documents": [
    {
      "id": "uuid",
      "title": "Q4 Evaluation Form",
      "type": "evaluation",
      "status": "published",
      "created_at": "2025-11-20T10:00:00Z"
    }
  ]
}
```

---

### 2. Get All Documents
Get paginated list of documents with filtering and sorting.

**Endpoint**: `GET /`

**Query Parameters**:
- `type` (optional): Filter by document type
- `status` (optional): Filter by status
- `owner_id` (optional): Filter by owner
- `search` (optional): Search in title and description
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `sort_by` (optional, default: created_at): Field to sort by
- `sort_order` (optional, default: desc): asc or desc

**Example Request**:
```
GET /api/admin/documents?type=evaluation&status=draft&page=1&limit=20&sort_by=title&sort_order=asc
```

**Response**:
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Annual Performance Evaluation",
      "description": "Yearly evaluation form",
      "type": "evaluation",
      "status": "draft",
      "version": "1.0.0",
      "file_url": "https://...",
      "owner_id": "uuid",
      "owner": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "metadata": {},
      "created_at": "2025-11-20T10:00:00Z",
      "updated_at": "2025-11-21T15:30:00Z",
      "version_count": 3,
      "comment_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

### 3. Get Single Document
Get full details of a single document including versions, comments, and workflow.

**Endpoint**: `GET /:id`

**Response**:
```json
{
  "id": "uuid",
  "title": "Annual Performance Evaluation",
  "description": "Yearly evaluation form",
  "type": "evaluation",
  "status": "approved",
  "version": "2.1.0",
  "content": {},
  "file_url": "https://...",
  "owner_id": "uuid",
  "owner": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "metadata": {},
  "created_at": "2025-11-20T10:00:00Z",
  "updated_at": "2025-11-21T15:30:00Z",
  "versions": [
    {
      "id": "uuid",
      "version": "2.1.0",
      "content": {},
      "file_url": "https://...",
      "change_summary": "Updated evaluation criteria",
      "created_by": "uuid",
      "creator": {
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "created_at": "2025-11-21T15:30:00Z"
    }
  ],
  "comments": [
    {
      "id": "uuid",
      "content": "Please review the updated criteria",
      "user_id": "uuid",
      "user": {
        "first_name": "Alice",
        "last_name": "Johnson"
      },
      "parent_comment_id": null,
      "replies": [
        {
          "id": "uuid",
          "content": "Looks good!",
          "user": {...}
        }
      ],
      "created_at": "2025-11-21T16:00:00Z"
    }
  ],
  "workflow": [
    {
      "id": "uuid",
      "workflow_type": "approval",
      "status": "approved",
      "current_stage": 2,
      "stages": [...],
      "approvals": [
        {
          "approver": {
            "first_name": "Bob",
            "last_name": "Wilson"
          },
          "status": "approved",
          "comments": "Approved",
          "approved_at": "2025-11-21T14:00:00Z"
        }
      ]
    }
  ]
}
```

---

### 4. Get Document Versions
Get version history for a document.

**Endpoint**: `GET /:id/versions`

**Response**:
```json
[
  {
    "id": "uuid",
    "document_id": "uuid",
    "version": "2.1.0",
    "content": {},
    "file_url": "https://...",
    "change_summary": "Updated evaluation criteria",
    "created_by": "uuid",
    "creator": {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com"
    },
    "created_at": "2025-11-21T15:30:00Z"
  }
]
```

**Note**: Versions are sorted by semantic version (newest first). The system properly handles version comparison (e.g., 1.10.0 > 1.2.0).

---

### 5. Get Document Comments
Get all comments (with nested replies) for a document.

**Endpoint**: `GET /:id/comments`

**Response**:
```json
[
  {
    "id": "uuid",
    "document_id": "uuid",
    "user_id": "uuid",
    "content": "This needs revision",
    "parent_comment_id": null,
    "user": {
      "id": "uuid",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com"
    },
    "replies": [
      {
        "id": "uuid",
        "content": "I'll update it",
        "user": {
          "first_name": "Bob",
          "last_name": "Smith"
        },
        "created_at": "2025-11-21T16:30:00Z"
      }
    ],
    "created_at": "2025-11-21T16:00:00Z",
    "updated_at": "2025-11-21T16:00:00Z"
  }
]
```

---

### 6. Get Document Workflow
Get workflow and approval history for a document.

**Endpoint**: `GET /:id/workflow`

**Response**:
```json
[
  {
    "id": "uuid",
    "document_id": "uuid",
    "workflow_type": "approval",
    "status": "approved",
    "current_stage": 2,
    "stages": [
      {"stage": 1, "name": "Initial Review"},
      {"stage": 2, "name": "Final Approval"}
    ],
    "created_at": "2025-11-20T10:00:00Z",
    "updated_at": "2025-11-21T14:00:00Z",
    "approvals": [
      {
        "id": "uuid",
        "workflow_id": "uuid",
        "approver_id": "uuid",
        "approver": {
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "status": "approved",
        "comments": "Approved with minor suggestions",
        "approved_at": "2025-11-21T14:00:00Z",
        "created_at": "2025-11-20T10:00:00Z"
      }
    ]
  }
]
```

---

### 7. Get Active Collaborators
Get list of users currently collaborating on a document.

**Endpoint**: `GET /:id/collaboration-info`

**Response**:
```json
{
  "document_id": "uuid",
  "active_sessions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user": {
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice@example.com"
      },
      "started_at": "2025-11-22T10:00:00Z",
      "last_seen": "2025-11-22T10:45:00Z",
      "is_active": true,
      "cursor_position": 150,
      "user_color": "#FF5733"
    }
  ],
  "total_active": 1
}
```

**Note**: Sessions are considered active if `last_seen` is within the last 5 minutes.

---

### 8. Update Document Status
Change the status of a document with validation.

**Endpoint**: `PATCH /:id/status`

**Request Body**:
```json
{
  "status": "in_review"
}
```

**Valid Status Transitions**:
- `draft` → `in_review`, `archived`
- `in_review` → `approved`, `rejected`, `draft`, `archived`
- `approved` → `published`, `archived`
- `published` → `archived`
- `archived` → `draft` (unarchive)
- `rejected` → `draft`, `archived`

**Response**:
```json
{
  "id": "uuid",
  "title": "Annual Performance Evaluation",
  "status": "in_review",
  "updated_at": "2025-11-22T11:00:00Z",
  ...
}
```

**Error Response** (Invalid Transition):
```json
{
  "error": "Invalid status transition from 'draft' to 'published'"
}
```

---

### 9. Update Workflow
Approve, reject, or advance a document workflow.

**Endpoint**: `PATCH /:id/workflow`

**Request Body**:
```json
{
  "action": "approve",
  "comments": "Looks good, approved!"
}
```

**Actions**:
- `approve`: Approve the current workflow stage
- `reject`: Reject the workflow
- `advance`: Move to next stage

**Response**:
```json
{
  "message": "Workflow approved successfully",
  "approval": {
    "id": "uuid",
    "status": "approved",
    "comments": "Looks good, approved!",
    "approved_at": "2025-11-22T11:00:00Z"
  }
}
```

---

### 10. Archive Document
Set document status to archived (soft delete).

**Endpoint**: `PATCH /:id/archive`

**Response**:
```json
{
  "id": "uuid",
  "title": "Annual Performance Evaluation",
  "status": "archived",
  "updated_at": "2025-11-22T11:00:00Z"
}
```

---

### 11. Delete Document
Permanently delete a document (hard delete).

**Endpoint**: `DELETE /:id`

**Response**:
```json
{
  "message": "Document deleted successfully"
}
```

**Note**: This cascades to all related records (versions, comments, workflows, approvals, sessions).

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid status transition from 'draft' to 'published'"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized - Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied - Admin role required"
}
```

### 404 Not Found
```json
{
  "error": "Document not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "..."
}
```

---

## Frontend Integration

### Using the API Client

```typescript
import { adminDocumentsAPI } from '@/lib/api/admin-documents';

// Get all documents with filters
const response = await adminDocumentsAPI.getDocuments(
  { type: 'evaluation', status: 'draft', search: 'annual' },
  { page: 1, limit: 20 },
  { sort_by: 'created_at', sort_order: 'desc' }
);

// Get single document
const doc = await adminDocumentsAPI.getDocument(documentId);

// Update status
await adminDocumentsAPI.updateStatus(documentId, { status: 'in_review' });

// Approve workflow
await adminDocumentsAPI.updateWorkflow(documentId, {
  action: 'approve',
  comments: 'Approved!'
});

// Archive document
await adminDocumentsAPI.archiveDocument(documentId);

// Delete document
await adminDocumentsAPI.deleteDocument(documentId);
```

### Authentication
The API client automatically handles authentication:
1. Gets Supabase session via `createSupabaseClient()`
2. Extracts JWT access token
3. Attaches to Authorization header
4. Handles token refresh on 401 errors

No manual token management required!

---

## Database Schema

### documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type document_type NOT NULL,
  description TEXT,
  content JSONB,
  file_url TEXT,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  owner_id UUID REFERENCES users(id),
  status document_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_versions
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  content JSONB,
  file_url TEXT,
  change_summary TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_comments
```sql
CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES document_comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_workflows
```sql
CREATE TABLE document_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  workflow_type VARCHAR(50) NOT NULL,
  status workflow_status NOT NULL DEFAULT 'pending',
  current_stage INTEGER DEFAULT 1,
  stages JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### document_approvals
```sql
CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES document_workflows(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  status approval_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### collaboration_sessions
```sql
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  cursor_position INTEGER,
  user_color VARCHAR(7)
);
```

---

## Testing

### Using cURL

```bash
# Get stats
curl -X GET "http://localhost:5000/api/admin/documents/stats/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all documents
curl -X GET "http://localhost:5000/api/admin/documents?status=draft&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update status
curl -X PATCH "http://localhost:5000/api/admin/documents/{id}/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_review"}'

# Approve workflow
curl -X PATCH "http://localhost:5000/api/admin/documents/{id}/workflow" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "comments": "Approved!"}'
```

### Using Frontend Dev Tools
1. Open browser dev tools (F12)
2. Go to Network tab
3. Perform actions in the UI
4. Inspect requests/responses

---

## Performance Considerations

- All document queries use proper indexes
- Pagination prevents loading large datasets
- Version sorting done in application layer (semantic versioning)
- Active sessions filtered by 5-minute window
- Admin client bypasses RLS for better performance
- JSONB fields indexed for metadata queries

---

## Security

- All endpoints require admin authentication
- JWT tokens validated on every request
- RLS bypassed using service role key (admin-only)
- Status transitions validated server-side
- File uploads validated (type and size)
- XSS protection via content sanitization
