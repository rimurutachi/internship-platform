# Admin Internships Management - Quick Reference

## API Endpoints

### Base URL: `/api/admin/internships`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List internships with filters | Admin |
| GET | `/:id` | Get single internship + activity log | Admin |
| POST | `/` | Create new internship | Admin |
| PATCH | `/:id` | Update internship | Admin |
| DELETE | `/:id` | Cancel internship (soft delete) | Admin |
| GET | `/available-students` | Get students without active internships | Admin |
| GET | `/advisors-by-university/:university_id` | Get advisors for university | Admin |
| GET | `/supervisors-by-company/:company_id` | Get supervisors for company | Admin |
| GET | `/:id/activity-log` | Get audit trail for internship | Admin |
| GET | `/stats/summary` | Get statistics summary | Admin |

## Query Parameters

**List Internships (GET `/`)**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status: `active`, `pending`, `completed`, `cancelled`
- `university_id` - Filter by advisor's university
- `company_id` - Filter by company
- `search` - Search student name or email

**Example:**
```
GET /api/admin/internships?page=1&limit=20&status=active&search=john
```

## Request Bodies

### Create Internship (POST `/`)
```json
{
  "student_id": "uuid (required)",
  "company_id": "uuid (required)",
  "position": "string (required)",
  "advisor_id": "uuid (required)",
  "supervisor_id": "uuid (required)",
  "start_date": "YYYY-MM-DD (required)",
  "end_date": "YYYY-MM-DD (required)",
  "status": "pending|active|completed|cancelled (optional, default: pending)"
}
```

### Update Internship (PATCH `/:id`)
```json
{
  "position": "string (optional)",
  "advisor_id": "uuid (optional)",
  "supervisor_id": "uuid (optional)",
  "start_date": "YYYY-MM-DD (optional)",
  "end_date": "YYYY-MM-DD (optional)",
  "status": "pending|active|completed|cancelled (optional)"
}
```
**Note:** Cannot update `student_id` or `company_id`

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### List Response
```json
{
  "success": true,
  "data": {
    "internships": [
      {
        "id": "uuid",
        "student_id": "uuid",
        "company_id": "uuid",
        "advisor_id": "uuid",
        "supervisor_id": "uuid",
        "position": "Software Engineering Intern",
        "start_date": "2024-06-01",
        "end_date": "2024-08-31",
        "status": "active",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "student": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@university.edu",
          "university_id": "uuid"
        },
        "advisor": {
          "id": "uuid",
          "name": "Dr. Smith",
          "email": "smith@university.edu",
          "university_id": "uuid"
        },
        "supervisor": {
          "id": "uuid",
          "name": "Jane Manager",
          "email": "jane@company.com",
          "company_id": "uuid"
        },
        "company": {
          "id": "uuid",
          "name": "Tech Corp",
          "industry": "Technology"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "total": 45
  }
}
```

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid data, validation failed, or date range invalid |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User is not admin |
| 404 | Not Found | Internship not found |
| 409 | Conflict | Student already has active internship |
| 500 | Server Error | Database error or internal server error |

## Validation Rules

### Business Constraints

1. **Student Constraint (1:1:1)**
   - ❌ Student can only have ONE active internship at a time
   - Error: 409 Conflict

2. **Advisor Constraint (1:M)**
   - ❌ Advisor must be from SAME UNIVERSITY as student
   - Error: 400 Bad Request

3. **Supervisor Constraint (M:M)**
   - ❌ Supervisor must belong to SAME COMPANY as internship
   - Error: 400 Bad Request

4. **Date Validation**
   - ❌ Start date must be BEFORE end date
   - Error: 400 Bad Request

5. **Role Validation**
   - ❌ Student must have role = 'student'
   - ❌ Advisor must have role = 'advisor'
   - ❌ Supervisor must have role = 'supervisor'
   - Error: 400 Bad Request

### Field Requirements

**Required for Create:**
- `student_id` ✅
- `company_id` ✅
- `position` ✅
- `advisor_id` ✅
- `supervisor_id` ✅
- `start_date` ✅
- `end_date` ✅

**Optional for Create:**
- `status` (default: 'pending')

**Cannot be Updated:**
- `student_id` ❌
- `company_id` ❌

**Can be Updated:**
- `position` ✅
- `advisor_id` ✅
- `supervisor_id` ✅
- `start_date` ✅
- `end_date` ✅
- `status` ✅

## Frontend Components

### Page
- `frontend/src/app/dashboard/admin/internships/page.tsx`

### Components
- `frontend/src/components/admin/CreateInternshipModal.tsx`
- `frontend/src/components/admin/EditInternshipModal.tsx`
- `frontend/src/components/admin/ViewInternshipModal.tsx`
- `frontend/src/components/admin/DeleteInternshipDialog.tsx`

### API Client
- `frontend/src/lib/api/admin-internships.ts`

### Types
- `frontend/src/types/api.ts`

## Common Use Cases

### 1. Create New Internship
```typescript
import { adminInternshipsAPI } from '@/lib/api/admin-internships';

const result = await adminInternshipsAPI.createInternship({
  student_id: 'student-uuid',
  company_id: 'company-uuid',
  position: 'Software Engineering Intern',
  advisor_id: 'advisor-uuid',
  supervisor_id: 'supervisor-uuid',
  start_date: '2024-06-01',
  end_date: '2024-08-31',
  status: 'pending'
});
```

### 2. List Active Internships
```typescript
const result = await adminInternshipsAPI.getInternships({
  status: 'active',
  page: 1,
  limit: 20
});
```

### 3. Update Internship Status
```typescript
const result = await adminInternshipsAPI.updateInternship('internship-uuid', {
  status: 'active'
});
```

### 4. Get Available Students
```typescript
const result = await adminInternshipsAPI.getAvailableStudents();
// Returns only students without active internships
```

### 5. Get Advisors for Student's University
```typescript
// First get student's university_id
const student = /* ... */;
const result = await adminInternshipsAPI.getAdvisorsByUniversity(
  student.university_id
);
```

### 6. Get Supervisors for Company
```typescript
const result = await adminInternshipsAPI.getSupervisorsByCompany(
  'company-uuid'
);
```

### 7. View Activity Log
```typescript
const result = await adminInternshipsAPI.getActivityLog('internship-uuid');
// Returns audit trail of all changes
```

### 8. Cancel Internship
```typescript
const result = await adminInternshipsAPI.deleteInternship('internship-uuid');
// Soft deletes by setting status to 'cancelled'
```

## Testing with cURL

### Create Internship
```bash
curl -X POST http://localhost:5000/api/admin/internships \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "uuid",
    "company_id": "uuid",
    "position": "Software Engineering Intern",
    "advisor_id": "uuid",
    "supervisor_id": "uuid",
    "start_date": "2024-06-01",
    "end_date": "2024-08-31",
    "status": "pending"
  }'
```

### List Internships
```bash
curl -X GET "http://localhost:5000/api/admin/internships?status=active&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Internship
```bash
curl -X PATCH http://localhost:5000/api/admin/internships/INTERNSHIP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Cancel Internship
```bash
curl -X DELETE http://localhost:5000/api/admin/internships/INTERNSHIP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Status Values

| Status | Description | Badge Color |
|--------|-------------|-------------|
| `pending` | Internship created but not started | Yellow |
| `active` | Currently ongoing internship | Green |
| `completed` | Successfully finished internship | Blue |
| `cancelled` | Cancelled/terminated internship | Red |

## Activity Log Actions

| Action | Description |
|--------|-------------|
| `internship_created` | New internship created |
| `internship_updated` | Internship details modified |
| `internship_cancelled` | Internship cancelled |

## Database Tables

### internships
- Primary table for internship records
- Foreign keys: student_id, company_id, advisor_id, supervisor_id

### users
- Contains students, advisors, supervisors, and admins
- Has university_id (for students/advisors) and company_id (for supervisors)

### companies
- Company information
- Referenced by internships.company_id

### universities
- University information
- Referenced by users.university_id

### activity_log
- Audit trail for all changes
- Filtered by internship_id

## Tips

1. **Always fetch available students** when creating internship to ensure student doesn't have active internship
2. **Filter advisors by student's university** to comply with constraint
3. **Filter supervisors by company** to comply with constraint
4. **Use activity log** to track who made changes and when
5. **Soft delete** by setting status to 'cancelled' instead of hard delete
6. **Pagination** is automatic - just set page and limit parameters
7. **Search** works on student name and email only
8. **Date format** must be YYYY-MM-DD for all date fields

---

**Documentation Complete** ✅

For full implementation details, see: `ADMIN_INTERNSHIPS_IMPLEMENTATION.md`
