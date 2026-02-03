# Backend API Quick Reference - OJT Platform
## All Critical Endpoints Implemented ✅

Last Updated: December 7, 2025

---

## 🔐 Authentication
All endpoints require authentication via JWT token from Supabase Auth.
Header: `Authorization: Bearer <token>`

Role-based access enforced via middleware.

---

## 👥 USER MANAGEMENT (Admin Only)

### List Users
```http
GET /api/admin/users?role=student&status=active&verification_status=pending_verification&page=1&limit=10
```
**Query Params:**
- `role`: student | advisor | supervisor | admin
- `status`: active | inactive | suspended | archived
- `verification_status`: pending_verification | verified | rejected
- `includeArchived`: true | false (default: false)
- `search`: Search by name, email, student_number

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Get Single User
```http
GET /api/admin/users/:id
```

### Verify User Profile ✅ NEW
```http
POST /api/admin/users/:id/verify
{
  "comments": "Profile verified - all data complete"
}
```
**Sets:** `verification_status = verified`, `verified_by = adminId`

### Reject User Profile ✅ NEW
```http
POST /api/admin/users/:id/reject
{
  "rejection_reason": "Student number format is invalid. Please correct and resubmit."
}
```
**Sets:** `verification_status = rejected`
**Sends:** Notification to user with feedback

### Archive User (Soft Delete) ✅ NEW
```http
POST /api/admin/users/:id/archive
```
**Sets:** `is_archived = true`, `archived_at = now()`, `status = archived`
**Data:** Preserved in database for analytics
**Auth:** User banned from login

### Unarchive User ✅ NEW
```http
POST /api/admin/users/:id/unarchive
```
**Sets:** `is_archived = false`, `status = active`

### Delete User (DISABLED) ⛔
```http
DELETE /api/admin/users/:id
```
**Returns:** 405 Error - "Use archive endpoint instead"

### Update User Role
```http
PATCH /api/admin/users/:id/role
{
  "role": "advisor"
}
```

### Update User Status
```http
PATCH /api/admin/users/:id/status
{
  "status": "active"
}
```

---

## 📝 WEEKLY REPORTS (Student)

### Create Weekly Report ✅ NEW
```http
POST /api/student/weekly-reports
{
  "internship_id": "uuid",
  "week_number": 1,
  "accomplishments": "Completed orientation and shadowing...",
  "hours_rendered": 40,
  "challenges": "Optional",
  "learnings": "Optional"
}
```
**Validation:**
- Accomplishments min 50 characters
- Hours: 0-168
- One report per week per internship
- Week number must be valid for internship dates

**Response:** Report with `status: pending_approval`

### Get My Weekly Reports
```http
GET /api/student/weekly-reports?internship_id=uuid
```

### Get Single Report
```http
GET /api/student/weekly-reports/:id
```

### Update Weekly Report
```http
PUT /api/student/weekly-reports/:id
{
  "accomplishments": "Updated accomplishments...",
  "hours_rendered": 42
}
```
**Can edit if:** Status = pending_approval OR rejected
**Cannot edit:** Approved reports

### Delete Weekly Report
```http
DELETE /api/student/weekly-reports/:id
```
**Can delete:** Pending reports only

### Get Next Deadline
```http
GET /api/student/weekly-reports/deadline/:internship_id
```
**Returns:** Next week due, date range, is_overdue flag

---

## ✅ WEEKLY REPORTS (Supervisor Approval)

### Get Student Reports ✅ NEW
```http
GET /api/supervisor/weekly-reports?status=pending_approval&internship_id=uuid&student_id=uuid
```
**Filters:**
- `status`: pending_approval | approved | rejected
- `internship_id`
- `student_id`
- `week_number`

### Get Pending Count
```http
GET /api/supervisor/weekly-reports/pending-count
```
**Returns:** `{ count: 14 }`

### Get Statistics
```http
GET /api/supervisor/weekly-reports/statistics
```
**Returns:**
```json
{
  "total": 45,
  "pending": 12,
  "approved": 30,
  "rejected": 3
}
```

### Get Summary by Student
```http
GET /api/supervisor/weekly-reports/summary-by-student?internship_id=uuid
```
**Returns:** Per-student breakdown with report counts

### Approve Report ✅ NEW
```http
POST /api/supervisor/weekly-reports/:id/approve
{
  "comments": "Good work this week. Keep it up!"
}
```
**Sets:** `status = approved`, `approved_at = now()`
**Sends:** Notification to student

### Reject Report ✅ NEW
```http
POST /api/supervisor/weekly-reports/:id/reject
{
  "rejection_reason": "Please provide more details about the tasks you completed."
}
```
**Validation:** Reason min 10 characters
**Sets:** `status = rejected`, `rejected_at = now()`
**Sends:** Notification to student with feedback

### Add Comment (No Status Change)
```http
POST /api/supervisor/weekly-reports/:id/comment
{
  "comment": "Consider adding more technical details next time."
}
```

---

## 📊 FINAL EVALUATIONS (Supervisor)

### Create Final Evaluation ✅ NEW (NO AI)
```http
POST /api/supervisor/evaluations
{
  "internship_id": "uuid",
  "criterion_scores": [
    { "criterion_code": "A", "criterion_name": "Quality of Work", "score": 8 },
    { "criterion_code": "B", "criterion_name": "Attitude Toward Work", "score": 9 },
    { "criterion_code": "C", "criterion_name": "Judgment", "score": 7 },
    { "criterion_code": "D", "criterion_name": "Cooperation", "score": 9 },
    { "criterion_code": "E", "criterion_name": "Dependability", "score": 8 },
    { "criterion_code": "F", "criterion_name": "Comprehension", "score": 9 },
    { "criterion_code": "G", "criterion_name": "Safety", "score": 10 }
  ],
  "attendance": "Regular",
  "punctuality": "Regular",
  "comments": "Excellent intern. Shows great initiative and learns quickly..."
}
```
**Validation:**
- Exactly 7 criterion scores (A-G)
- Each score: 1-10
- Attendance/Punctuality: Regular | Irregular
- Comments min 50 characters

**Auto-calculated:**
- `total_score` (sum of A-G)
- `final_grade` (from rubric grading scale)

**Response:** Evaluation with `status: draft`

### Save Draft (Auto-save)
```http
PUT /api/supervisor/evaluations/:id
{
  "criterion_scores": [...],
  "attendance": "Regular",
  "punctuality": "Regular",
  "comments": "Updated comments..."
}
```
**Can edit:** Draft status only
**Auto-saves:** Every 30 seconds from frontend

### Submit Evaluation ✅ NEW
```http
POST /api/supervisor/evaluations/:id/submit
```
**Validation:** All fields complete
**Sets:** `status = submitted`, `submitted_at = now()`
**Sends:** Notification to advisor for review
**Now immutable:** Supervisor cannot edit after submission

### Get Evaluation
```http
GET /api/supervisor/evaluations/:id
```

### Get Evaluations by Internship
```http
GET /api/supervisor/evaluations/internship/:internship_id
```

### Delete Draft
```http
DELETE /api/supervisor/evaluations/:id
```
**Can delete:** Draft status only

---

## 🎓 EVALUATIONS (Advisor Review)

### Get Pending Evaluations ✅ NEW
```http
GET /api/advisor/evaluations/pending
```
**Returns:** All evaluations with `status = submitted`

### Get by Status
```http
GET /api/advisor/evaluations/status/:status
```
**Status:** submitted | revision_requested | approved

### Get Evaluation with Context
```http
GET /api/advisor/evaluations/:id/context
```
**Returns:**
```json
{
  "evaluation": {...},
  "weekly_reports": [...]
}
```
**Use case:** Advisor reviews evaluation alongside weekly reports

### Get Statistics
```http
GET /api/advisor/evaluations/statistics
```
**Returns:**
```json
{
  "total": 45,
  "pending": 8,
  "revision_requested": 2,
  "approved": 35
}
```

### Approve Evaluation ✅ NEW
```http
POST /api/advisor/evaluations/:id/approve
{
  "approval_comments": "Evaluation is thorough and fair. Approved.",
  "final_grade_override": 1.25,  // Optional
  "grade_override_reason": "Student showed exceptional..."  // Required if override
}
```
**Validation:**
- `approval_comments` required (min 10 chars)
- If grade override: `grade_override_reason` required (min 20 chars)

**Sets:** `status = approved`, `advisor_approved_at = now()`
**Triggers:** AI analytics generation (post-approval)
**Sends:** Notifications to supervisor & student

### Request Revision ✅ NEW
```http
POST /api/advisor/evaluations/:id/request-revision
{
  "revision_reason": "Please provide more specific examples in the comments section..."
}
```
**Validation:** Reason min 20 characters
**Sets:** `status = revision_requested`
**Sends:** Notification to supervisor with detailed feedback
**Supervisor can:** Edit and resubmit

### Get Weekly Reports for Context
```http
GET /api/advisor/weekly-reports/internship/:internship_id
```
**Returns:** All weekly reports for an internship (for advisor review)

---

## 📋 EVALUATION RUBRICS (Admin Content Management)

### Get All Rubrics
```http
GET /api/admin/rubrics?university_id=uuid&include_inactive=false
```

### Get Active Rubric
```http
GET /api/admin/rubrics/active?university_id=uuid
```
**Returns:** Currently active rubric or default CvSU rubric

### Get Rubric by ID
```http
GET /api/admin/rubrics/:id
```

### Get Rubric History (Version Control)
```http
GET /api/admin/rubrics/:id/history
```
**Returns:** All versions with change reasons and timestamps

### Create Rubric ✅ NEW
```http
POST /api/admin/rubrics
{
  "university_id": "uuid",
  "academic_year": "2024-2025",
  "rubric_name": "CvSU OJT Evaluation Rubric",
  "criteria": [
    {
      "code": "A",
      "name": "Quality of Work",
      "description": "Accuracy, thoroughness...",
      "max_score": 10,
      "scale_descriptions": {
        "1-2": "Often unsatisfactory",
        "3-4": "Occasionally unsatisfactory",
        "5-6": "Meets minimum requirements",
        "7-8": "Frequently exceeds job requirements",
        "9-10": "Consistently superior"
      }
    },
    // ... 6 more criteria (B-G)
  ],
  "grading_scale": [
    { "min_score": 67, "max_score": 70, "grade": 1.0 },
    { "min_score": 63, "max_score": 66, "grade": 1.25 },
    // ... all grade ranges
  ]
}
```
**Validation:** Must have exactly 7 criteria (A-G)
**Action:** Deactivates other rubrics, activates new one

### Update Rubric (Creates Version) ✅ NEW
```http
PUT /api/admin/rubrics/:id
{
  "updates": {
    "criteria": [...],
    "grading_scale": [...]
  },
  "change_reason": "Updated scale descriptions to be more specific based on faculty feedback"
}
```
**Validation:** `change_reason` required (min 10 chars)
**Action:**
1. Saves current version to `evaluation_rubric_history`
2. Updates rubric
3. Increments version number

### Activate Rubric
```http
POST /api/admin/rubrics/:id/activate
```
**Action:** Deactivates all other rubrics for university, activates this one

### Deactivate Rubric
```http
POST /api/admin/rubrics/:id/deactivate
{
  "reason": "Switching to new academic year rubric"
}
```

---

## 📊 ADMIN DASHBOARD (OJT-Centric Metrics)

### Get Real-Time Metrics ✅ NEW
```http
GET /api/admin/dashboard/metrics?university_id=uuid
```
**Returns:**
```json
{
  "students_enrolled": 45,
  "students_pending_deployment": 8,
  "active_internships": 35,
  "completed_internships": 12,
  "total_companies": 18,
  "companies_with_capacity": 10,
  "pending_weekly_reports": 14,
  "pending_supervisor_evaluations": 3,
  "pending_advisor_evaluations": 5,
  "completed_evaluations_this_month": 7,
  "timestamp": "2025-12-07T10:30:00Z"
}
```
**NO SYSTEM METRICS** - Only OJT/internship data

### Get Dashboard Overview
```http
GET /api/admin/dashboard/overview?university_id=uuid
```
**Returns:**
```json
{
  "metrics": {...},
  "insights": [
    { "type": "insight", "message": "CBSU students avg 7.5/10 in Judgment" },
    { "type": "insight", "message": "Communication training recommended" },
    { "type": "insight", "message": "Company X produces highest performers" }
  ],
  "recent_activity": {
    "weekly_reports_this_week": 28,
    "evaluations_this_week": 5
  }
}
```

### Get AI Insights
```http
GET /api/admin/dashboard/insights?university_id=uuid
```
**Returns:** Top 3 insights from evaluation analytics
**Source:** Generated AFTER evaluations approved

### Get Quick Action Items
```http
GET /api/admin/dashboard/quick-actions?university_id=uuid
```
**Returns:**
```json
[
  {
    "type": "verification",
    "priority": "high",
    "count": 5,
    "message": "5 user profile(s) pending verification",
    "link": "/admin/users?status=pending_verification"
  },
  {
    "type": "evaluation",
    "priority": "high",
    "count": 8,
    "message": "8 evaluation(s) awaiting advisor review",
    "link": "/advisor/evaluations?status=pending"
  }
]
```

### Get Historical Metrics (Trends)
```http
GET /api/admin/dashboard/historical?university_id=uuid&days=30
```
**Returns:** Daily snapshots for trend analysis

### Store Metrics Snapshot (Cron Job)
```http
POST /api/admin/dashboard/snapshot
{
  "university_id": "uuid"
}
```
**Use case:** Run daily to store historical data

---

## 🔑 KEY CHANGES FROM ADVISOR FEEDBACK

### ✅ What Changed:
1. **User Management:**
   - ❌ Admin can no longer EDIT user profiles
   - ✅ Admin now VERIFIES/REJECTS registration data
   - ✅ Soft delete (archive) replaces hard delete

2. **Weekly Reports:**
   - ✅ NEW: Student submits weekly accomplishments
   - ✅ NEW: Supervisor approves/rejects weekly reports
   - ✅ Weekly reports ≠ weekly evaluations (terminology fix)

3. **Final Evaluation:**
   - ❌ AI removed from submission flow entirely
   - ✅ Manual data entry only (CvSU template)
   - ✅ AI runs AFTER advisor approval (analytics only)

4. **Rubrics:**
   - ✅ NEW: Admin can manage evaluation rubrics
   - ✅ NEW: Version control with change history
   - ✅ CvSU official template as default

5. **Dashboard:**
   - ❌ System metrics removed (CPU, memory, etc.)
   - ✅ OJT-centric metrics only
   - ✅ AI insights from historical evaluations

### ⚠️ Critical Validation Rules:
- Weekly reports: Min 50 chars for accomplishments
- Evaluation: All 7 criteria required, min 50 chars for comments
- Rejection reasons: Min 10-20 chars depending on context
- Cannot edit approved weekly reports
- Cannot edit submitted evaluations (unless revision requested)
- Cannot hard delete users (only archive)

### 🔄 Complete Transaction Flow:
```
WEEKS 1-12:
Student → Submit Weekly Report → Supervisor Approves/Rejects → (If rejected: Re-submit)

END OF INTERNSHIP:
Supervisor → Create Evaluation (Draft) → Auto-save → Submit
→ Advisor Reviews → Approve/Request Revision
→ (If revision: Supervisor edits → Re-submit)
→ After Approval: AI Analytics Generated
```

---

## 📝 Testing Checklist

### User Management:
- [ ] Admin can verify user profile
- [ ] Admin can reject with feedback
- [ ] Student receives rejection notification
- [ ] Admin can archive user (soft delete)
- [ ] Archived users preserved in DB
- [ ] Delete endpoint returns 405 error

### Weekly Reports:
- [ ] Student creates weekly report
- [ ] Student can edit pending/rejected reports
- [ ] Student cannot edit approved reports
- [ ] Supervisor approves report
- [ ] Supervisor rejects with reason
- [ ] Notifications sent correctly

### Final Evaluation:
- [ ] Supervisor creates evaluation (NO AI)
- [ ] Auto-save works every 30s
- [ ] All 7 criteria validated (A-G)
- [ ] Total score auto-calculated
- [ ] Grade equivalent auto-calculated
- [ ] Submit validates completeness
- [ ] Advisor approves evaluation
- [ ] AI analytics run after approval
- [ ] Revision flow works end-to-end

### Rubrics:
- [ ] Admin creates rubric for new year
- [ ] Admin updates rubric (creates version)
- [ ] Version history tracked
- [ ] Default CvSU rubric returns if none exists

### Dashboard:
- [ ] Real-time metrics display correctly
- [ ] NO system metrics shown
- [ ] AI insights show top 3
- [ ] Quick actions link to correct pages

---

## 🚀 Next Steps

**Backend:** ✅ COMPLETE
**Frontend:** 🔜 To be implemented
**AI Service:** 🔜 Update for post-approval analytics only
**Testing:** 🔜 End-to-end transaction flows

**Ready for integration with frontend!**
