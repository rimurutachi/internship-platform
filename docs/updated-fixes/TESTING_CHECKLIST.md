# End-to-End Testing Checklist
**Date:** December 8, 2025  
**Purpose:** Validate all transaction flows before thesis defense

---

## 🚀 Pre-Testing Setup

### 1. Start All Services
```bash
# Terminal 1 - Backend
cd backend
pm2 start ecosystem.config.js

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - AI Service
cd ai-service
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Terminal 4 - Document Service
cd document-service
npm run dev
```

### 2. Verify Services Running
- [ ] Backend: http://localhost:5000 (check with GET /health)
- [ ] Frontend: http://localhost:3000
- [ ] AI Service: http://localhost:8000 (check GET /)
- [ ] Document Service: http://localhost:6000

### 3. Database Check
- [ ] Supabase project is running
- [ ] All tables exist: users, internships, evaluations, student_weekly_accomplishments, rubrics, etc.
- [ ] Test users exist for each role (student, advisor, supervisor, admin)

---

## 📋 Critical Transaction Flows

## Flow 1: Student Weekly Report Submission & Approval ✅

**Scenario:** Student submits weekly report → Supervisor reviews and approves → Student views approved report

### Student Actions
- [ ] Login as student
- [ ] Navigate to Weekly Reports page (`/dashboard/student/weekly-reports`)
- [ ] **CREATE** new weekly report:
  - [ ] Fill accomplishments (min 50 chars)
  - [ ] Set hours rendered (0-168)
  - [ ] Add challenges faced
  - [ ] Add learnings
  - [ ] Verify auto-save works (wait 30s, refresh page, data persists)
  - [ ] Click "Submit for Review"
  - [ ] Status changes to "Pending Approval" (yellow badge)
- [ ] Verify notification sent to supervisor

### Supervisor Actions
- [ ] Login as supervisor
- [ ] Navigate to Student Reports page (`/dashboard/supervisor/student-reports`)
- [ ] **VIEW** Pending tab - new report appears
- [ ] Click "Review" on report
- [ ] **APPROVE** report:
  - [ ] Add optional comments
  - [ ] Click "Approve"
  - [ ] Report moves to "Approved" tab
  - [ ] Status badge turns green
- [ ] Verify notification sent to student

### Student Verification
- [ ] Student receives notification "Weekly report approved"
- [ ] Report status shows "Approved" with green badge
- [ ] Report is now read-only (cannot edit)
- [ ] Student can view supervisor's approval comments

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## Flow 2: Supervisor Creates Final Evaluation (CvSU 7 Criteria) ✅

**Scenario:** Supervisor evaluates student using CvSU rubric → Submits to advisor → Advisor reviews

### Supervisor Actions
- [ ] Login as supervisor
- [ ] Navigate to Evaluations (`/dashboard/supervisor/evaluations`)
- [ ] Click "New Evaluation"
- [ ] **SELECT** student from dropdown
- [ ] **RATE** all 7 CvSU criteria (A-G):
  - [ ] A: Quality of Work (1-10 slider)
  - [ ] B: Attitude Towards Work (1-10)
  - [ ] C: Judgment and Decision Making (1-10)
  - [ ] D: Cooperation (1-10)
  - [ ] E: Dependability (1-10)
  - [ ] F: Comprehension (1-10)
  - [ ] G: Safety Consciousness (1-10)
- [ ] **ADD** attendance data:
  - [ ] Total days present
  - [ ] Total absences
  - [ ] Total tardiness
- [ ] **WRITE** supervisor comments (min 50 chars)
- [ ] Verify grade calculation updates in real-time
- [ ] **TEST** auto-save (wait 30s, refresh, data persists as "Draft")
- [ ] Click "Submit to Advisor"
- [ ] Status changes to "Submitted" (blue badge)
- [ ] Verify notification sent to advisor

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## Flow 3: Advisor Reviews and Approves Evaluation ✅

**Scenario:** Advisor reviews evaluation → Approves with/without grade override → AI analytics triggered

### Advisor Actions
- [ ] Login as advisor
- [ ] Navigate to Evaluations Review (`/dashboard/advisor/evaluations`)
- [ ] **VIEW** "Awaiting Review" tab - new evaluation appears
- [ ] Click "Review" on evaluation
- [ ] **VIEW** full evaluation details:
  - [ ] All 7 CvSU criteria scores visible
  - [ ] Attendance data shown
  - [ ] Supervisor comments displayed
  - [ ] Calculated grade shown (1.0-5.0 scale)
- [ ] **VIEW** student weekly reports (context):
  - [ ] Expand "Weekly Reports" section
  - [ ] Review all submitted reports
  - [ ] Check accomplishments and supervisor feedback

### Test Case 3A: Approve WITHOUT Grade Override
- [ ] Click "Approve"
- [ ] Add approval comments (min 10 chars)
- [ ] Leave "Override Grade" unchecked
- [ ] Click "Submit Approval"
- [ ] Evaluation moves to "Approved" tab
- [ ] Status changes to "Approved" (green badge)
- [ ] Verify notifications sent to:
  - [ ] Student: "Final evaluation approved. Grade: X.XX"
  - [ ] Supervisor: "Your evaluation has been approved"

### Test Case 3B: Approve WITH Grade Override
- [ ] Click "Approve"
- [ ] Check "Override Grade" checkbox
- [ ] Enter new grade (1.0-5.0)
- [ ] Add justification (min 20 chars - REQUIRED)
- [ ] Click "Submit Approval"
- [ ] Verify override reason is saved
- [ ] Verify new grade is used instead of calculated grade

### Test Case 3C: Request Revision
- [ ] Click "Request Revision"
- [ ] Add detailed feedback (min 20 chars - REQUIRED)
- [ ] Click "Submit"
- [ ] Evaluation moves to "Revision Requested" tab
- [ ] Status changes to "Revision Requested" (orange badge)
- [ ] Supervisor receives notification
- [ ] Supervisor can edit and resubmit evaluation

### AI Analytics Verification (Post-Approval)
- [ ] After approval, check backend logs for:
  - [ ] "Analyzing X approved evaluations for insights"
  - [ ] "AI analytics generated successfully"
- [ ] Verify AI service received request:
  - [ ] Check AI service logs: POST /api/evaluate-post-approval
  - [ ] Response includes 3 insights (sentiment, skills, performance)
- [ ] Check database `evaluation_analytics` table:
  - [ ] New row inserted with evaluation_id
  - [ ] Insights JSON stored properly
  - [ ] Generated timestamp recorded

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## Flow 4: Admin User Management (Archive & Unarchive) ✅

**Scenario:** Admin archives user → User cannot login → Admin unarchives → User can login again

### Test Case 4A: Archive User
- [ ] Login as admin
- [ ] Navigate to User Management (`/dashboard/admin/users`)
- [ ] **VIEW** "Active Users" tab
- [ ] Select a test user (student/advisor/supervisor)
- [ ] Click "Archive User"
- [ ] Confirm archive action
- [ ] User moves to "Archived Users" tab
- [ ] User status changes to "archived"
- [ ] Verify archive timestamp recorded

### Test Case 4B: Archived User Cannot Login
- [ ] Logout admin
- [ ] **ATTEMPT** login as archived user
- [ ] Enter correct credentials
- [ ] Verify login fails with message: "Account is archived"
- [ ] User redirected back to login page

### Test Case 4C: Unarchive User
- [ ] Login as admin again
- [ ] Navigate to "Archived Users" tab
- [ ] Find previously archived user
- [ ] Click "Unarchive User"
- [ ] Confirm unarchive action
- [ ] User moves back to "Active Users" tab
- [ ] User status changes to "active"

### Test Case 4D: Unarchived User Can Login
- [ ] Logout admin
- [ ] **LOGIN** as previously archived user
- [ ] Enter credentials
- [ ] Login succeeds ✅
- [ ] User redirected to appropriate dashboard
- [ ] All user data intact (internships, reports, evaluations)

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## Flow 5: Admin Rubrics Management (Version Control) ✅

**Scenario:** Admin edits rubric → New version created → History tracked → Activated for use

### Admin Actions
- [ ] Login as admin
- [ ] Navigate to Rubrics Management (`/dashboard/admin/rubrics`)
- [ ] **VIEW** active rubric for CvSU

### Test Case 5A: Edit Rubric (Create New Version)
- [ ] Click "Edit" on active rubric
- [ ] Modify criterion description (e.g., change "Quality of Work" description)
- [ ] Enter change reason (min 10 chars - REQUIRED)
- [ ] Click "Save Changes"
- [ ] New version created in database
- [ ] Version history updated
- [ ] New version number incremented (e.g., v1.0 → v1.1)

### Test Case 5B: View Version History
- [ ] Click "View History" on rubric
- [ ] **VERIFY** version history table shows:
  - [ ] All previous versions listed
  - [ ] Version numbers displayed
  - [ ] Change reasons shown
  - [ ] Modified by (admin name)
  - [ ] Timestamp of each change
- [ ] Click "Compare" between versions (if implemented)

### Test Case 5C: Activate Different Version
- [ ] Select a previous version from history
- [ ] Click "Activate This Version"
- [ ] Enter reason for rollback (min 10 chars)
- [ ] Confirm activation
- [ ] Selected version becomes active
- [ ] Only ONE version active at a time per university

### Test Case 5D: New Evaluations Use Active Rubric
- [ ] Login as supervisor
- [ ] Create new evaluation
- [ ] **VERIFY** evaluation form shows:
  - [ ] Criteria from ACTIVE rubric version
  - [ ] Updated descriptions (if rubric was modified)
  - [ ] Correct grading scale
- [ ] Old evaluations retain original rubric version (data integrity)

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 🎨 CBSU Branding Verification (Task #16) ✅

**Visual consistency across all pages**

### Landing Page
- [ ] CvSU logo displays (48px)
- [ ] "CvSU Internship Management Platform" badge visible
- [ ] Spring Green/Gold gradient background
- [ ] Mentions "Cavite State University"

### Login Page
- [ ] CvSU logo displays (56px)
- [ ] "Cavite State University" subtitle shown
- [ ] Spring Green/Gold color scheme
- [ ] 18px font size readable

### Dashboard Headers (All Roles)
- [ ] Admin Header: CvSU logo (40px) top-left
- [ ] Student Header: CvSU logo (40px) top-left
- [ ] Advisor Header: CvSU logo (40px) top-left
- [ ] Supervisor Header: CvSU logo (40px) top-left
- [ ] Mobile Header: CvSU logo (32px) top-left

### Color Consistency
- [ ] Primary buttons: Spring Green (#16a34a)
- [ ] Secondary elements: Gold (#f59e0b)
- [ ] Success badges: Green
- [ ] Warning badges: Yellow/Orange
- [ ] Danger badges: Red
- [ ] All gradients use CvSU colors

### Typography
- [ ] Base font: 18px (increased from 16px)
- [ ] Line height: 1.7 (improved readability)
- [ ] Headings readable and properly scaled
- [ ] Forms and inputs properly sized

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 🤖 AI Service Integration Testing ✅

### Test 1: AI Service Health Check
```bash
# Test AI service is running
curl http://localhost:8000/
# Expected: {"message": "Intern-Galing AI Service", "status": "running"}

curl http://localhost:8000/health
# Expected: {"service": "Intern-Galing AI", ...health_status}
```
- [ ] Root endpoint responds
- [ ] Health endpoint responds
- [ ] AI engine initialized

### Test 2: Post-Approval Analytics Endpoint
```bash
# Test with sample approved evaluations
curl -X POST http://localhost:8000/api/evaluate-post-approval \
  -H "Content-Type: application/json" \
  -d '[{
    "evaluation_id": "test-123",
    "text": "Student demonstrated excellent technical skills in Python programming and database management. Strong teamwork and communication abilities.",
    "ratings": {"quality": 9, "attitude": 8, "judgment": 8, "cooperation": 9, "dependability": 8, "comprehension": 9, "safety": 8},
    "student_id": "student-1",
    "supervisor_id": "supervisor-1",
    "created_at": "2025-12-01T10:00:00Z",
    "final_grade": 1.5
  }]'
```

**Expected Response:**
```json
{
  "status": "success",
  "total_evaluations_analyzed": 1,
  "insights": [
    {
      "type": "sentiment_trend",
      "title": "Overall Sentiment: Positive",
      "category": "sentiment"
    },
    {
      "type": "skill_analysis",
      "title": "Most Recognized Skills",
      "category": "skills"
    },
    {
      "type": "grade_distribution",
      "title": "Performance Overview",
      "category": "performance"
    }
  ]
}
```

- [ ] Endpoint responds with 200 status
- [ ] Returns top 3 insights
- [ ] Sentiment analysis works
- [ ] Skill extraction works
- [ ] Grade distribution calculated

### Test 3: Backend → AI Service Integration
- [ ] Advisor approves evaluation
- [ ] Backend calls AI service automatically
- [ ] Check backend terminal logs:
  - [ ] "Analyzing X approved evaluations for insights"
  - [ ] "AI analytics generated successfully"
- [ ] No errors in backend logs
- [ ] Analytics stored in database

### Test 4: Verify /api/evaluate-draft REMOVED
```bash
curl -X POST http://localhost:8000/api/evaluate-draft \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'
```
- [ ] Endpoint returns 404 NOT FOUND ✅
- [ ] AI does NOT assist in drafting evaluations ✅

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 🔐 Authentication & Authorization Testing

### Role-Based Access Control
- [ ] **Student** cannot access:
  - [ ] Advisor pages (`/dashboard/advisor/*`)
  - [ ] Supervisor pages (`/dashboard/supervisor/*`)
  - [ ] Admin pages (`/dashboard/admin/*`)
- [ ] **Supervisor** cannot access:
  - [ ] Student pages (except viewing their students)
  - [ ] Advisor pages
  - [ ] Admin pages
- [ ] **Advisor** cannot access:
  - [ ] Admin pages
  - [ ] Supervisor evaluation creation
- [ ] **Admin** can access all pages

### JWT Token Validation
- [ ] Login generates valid JWT token
- [ ] Token stored in session/cookie
- [ ] Expired token redirects to login
- [ ] Invalid token rejected by backend

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 📱 Mobile Responsiveness Testing

### Test on Different Screen Sizes
- [ ] Desktop (1920x1080)
  - [ ] Full sidebar visible
  - [ ] All components properly laid out
  - [ ] CvSU logo visible in header
- [ ] Tablet (768px)
  - [ ] Sidebar collapses to mobile menu
  - [ ] Bottom navigation appears
  - [ ] Forms remain usable
- [ ] Mobile (375px)
  - [ ] Bottom navigation works
  - [ ] Forms stack vertically
  - [ ] CvSU logo sized appropriately (32px)
  - [ ] All text readable (18px base)

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 🐛 Error Handling Testing

### Frontend Error Scenarios
- [ ] Network error (backend down) - shows user-friendly message
- [ ] Validation errors - displays field-specific errors
- [ ] Session expired - redirects to login
- [ ] Form submission errors - shows toast notification

### Backend Error Scenarios
- [ ] Invalid data - returns 400 with error message
- [ ] Unauthorized access - returns 401/403
- [ ] Database errors - returns 500 with safe message
- [ ] AI service down - evaluation still approves (non-blocking)

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## ✅ Final Integration Checklist

### All Services Communicate
- [ ] Frontend → Backend API calls work
- [ ] Backend → Supabase database queries work
- [ ] Backend → AI Service calls work
- [ ] Frontend → Supabase Auth works
- [ ] Document Service (if used) works

### Real-Time Features
- [ ] Notifications appear in real-time
- [ ] Auto-save works (30-second intervals)
- [ ] Status updates reflect immediately

### Data Integrity
- [ ] No data loss during transactions
- [ ] Foreign key relationships maintained
- [ ] Cascading deletes work properly (if applicable)
- [ ] Archive preserves all related data

### Performance
- [ ] Pages load within 2 seconds
- [ ] Forms submit within 1 second
- [ ] No memory leaks (check browser DevTools)
- [ ] AI analytics doesn't slow down approval

**✅ PASS / ❌ FAIL:** _______  
**Notes:** _________________________________________________

---

## 📊 Testing Summary

| Flow | Status | Notes |
|------|--------|-------|
| 1. Student Weekly Reports | ⬜ | |
| 2. Supervisor Final Evaluation | ⬜ | |
| 3. Advisor Review & Approval | ⬜ | |
| 4. Admin User Archive/Unarchive | ⬜ | |
| 5. Admin Rubrics Version Control | ⬜ | |
| 6. CBSU Branding | ⬜ | |
| 7. AI Service Integration | ⬜ | |
| 8. Auth & Authorization | ⬜ | |
| 9. Mobile Responsiveness | ⬜ | |
| 10. Error Handling | ⬜ | |

**Overall Status:** ⬜ PASS / ⬜ FAIL

**Critical Issues Found:** _________________________________________________

**Minor Issues Found:** _________________________________________________

**Ready for Defense:** ⬜ YES / ⬜ NO

---

## 🎯 Post-Testing Actions

- [ ] Fix any critical issues found
- [ ] Document known limitations
- [ ] Prepare demo script for defense
- [ ] Create backup of working database state
- [ ] Test demo flow one more time

**Last Tested By:** _________________  
**Date:** _________________  
**Time:** _________________
