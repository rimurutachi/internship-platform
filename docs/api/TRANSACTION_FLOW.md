# Internship Platform - Complete Transaction Flow

## Overview

This document provides a complete visual representation of all transaction flows in the Intern-Galing Platform, addressing the thesis advisor requirement for **"Complete transaction flow should be visible"**.

---

## 1. User Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Created: Admin creates user
    Created --> Active: User activates account
    Active --> Deployed: Student assigned to company
    Deployed --> Completed: Internship ends (automated)
    Completed --> PendingGraduation: All requirements met
    PendingGraduation --> Graduated: Admin confirms graduation
    Graduated --> Archived: Post-internship archival
    
    Active --> Inactive: Admin deactivates
    Inactive --> Active: Admin reactivates
    Active --> Archived: Admin archives (soft delete)
```

### User Status State Machine

| Status | Description | Allowed Transitions |
|--------|-------------|---------------------|
| `created` | Account created, not yet activated | → `active` |
| `active` | Normal active user | → `deployed`, `inactive`, `archived` |
| `deployed` | Student assigned to internship company | → `completed`, `inactive` |
| `completed` | Internship finished | → `pending_graduation` |
| `pending_graduation` | Awaiting admin graduation confirmation | → `graduated` |
| `graduated` | Successfully completed internship program | → `archived` |
| `inactive` | Temporarily deactivated | → `active` |
| `archived` | Soft-deleted, data preserved | Terminal state |

---

## 2. Internship Assignment Flow

```mermaid
flowchart TD
    A[Admin creates internship slot] --> B{Company has capacity?}
    B -->|Yes| C[Assign student to company]
    B -->|No| D[Increase capacity or wait]
    D --> B
    C --> E[Set start_date and end_date]
    E --> F[Student status: deployed]
    F --> G[12-week internship begins]
    
    G --> H{End date reached?}
    H -->|No| I[Continue weekly reports]
    I --> G
    H -->|Yes| J[Automation job marks completed]
    J --> K[Student status: completed]
    K --> L[Trigger supervisor evaluation]
```

### Company Capacity Management

- **Total Capacity**: Maximum students a company can accept
- **Current Interns**: Active students deployed to company
- **Utilization**: `(current_interns / total_capacity) * 100%`
- **Available Slots**: `total_capacity - current_interns`

---

## 3. Weekly Report Submission Flow (Student → Supervisor → Advisor)

```mermaid
sequenceDiagram
    participant S as Student
    participant DB as Database
    participant SUP as Supervisor
    participant ADV as Advisor
    participant WS as WebSocket
    
    Note over S: Week N of 12-week internship
    
    S->>DB: POST /api/evaluations/weekly-reports
    DB-->>S: Report created (status: submitted)
    DB->>WS: Emit notification to Supervisor
    WS-->>SUP: "New weekly report from Student"
    
    SUP->>DB: GET /api/supervisor/weekly-reports
    DB-->>SUP: List of pending reports
    
    alt Approved
        SUP->>DB: PATCH /api/supervisor/weekly-reports/:id/approve
        DB-->>SUP: Report approved
        DB->>WS: Emit notification to Student
        WS-->>S: "Your Week N report was approved"
    else Needs Revision
        SUP->>DB: PATCH /api/supervisor/weekly-reports/:id/reject
        DB-->>SUP: Report sent back
        DB->>WS: Emit notification to Student
        WS-->>S: "Week N report needs revision"
        S->>S: Revise and resubmit
    end
    
    Note over ADV: After all 12 weeks complete
    ADV->>DB: GET /api/advisor/weekly-reports
    DB-->>ADV: All approved reports for review
```

### Weekly Report Status Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Student creates
    Draft --> Submitted: Student submits
    Submitted --> Approved: Supervisor approves
    Submitted --> NeedsRevision: Supervisor rejects
    NeedsRevision --> Submitted: Student revises
    Approved --> [*]: Final state
```

---

## 4. Evaluation & Grading Flow

```mermaid
sequenceDiagram
    participant SUP as Supervisor
    participant DB as Database
    participant ADV as Advisor
    participant AI as AI Service
    participant STU as Student
    participant WS as WebSocket
    
    Note over SUP: After internship ends
    
    SUP->>DB: POST /api/supervisor/evaluations
    Note right of SUP: Includes ratings + feedback
    DB-->>SUP: Evaluation created (status: submitted)
    DB->>WS: Emit to Advisor
    WS-->>ADV: "New evaluation pending approval"
    
    ADV->>DB: GET /api/advisor/evaluations/:id
    DB-->>ADV: Evaluation details
    
    ADV->>AI: POST /api/evaluate-post-approval
    Note right of AI: Sentiment + skill analysis only
    AI-->>ADV: Analytics insights (NOT grade)
    
    ADV->>DB: PATCH /api/advisor/evaluations/:id/approve
    Note right of ADV: Sets final_grade, grade_reveal_date
    DB-->>ADV: Evaluation approved
    DB->>WS: Emit to Student
    WS-->>STU: "Your evaluation is ready"
    
    Note over STU: Checks grade reveal date
    alt Before reveal date
        STU->>DB: GET /api/student/evaluations
        DB-->>STU: Evaluation visible, grade hidden
    else After reveal date
        STU->>DB: GET /api/student/evaluations
        DB-->>STU: Full evaluation with grade
    end
```

### Evaluation Status Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Supervisor creates
    Draft --> Submitted: Supervisor submits
    Submitted --> Approved: Advisor approves
    Approved --> Completed: Grade revealed to student
    
    Note right of Approved: grade_reveal_date controls visibility
```

### AI Service Role (Analytics Only, NOT Grading)

The AI service is used **exclusively for analytics and insights**, not for determining grades:

| AI Endpoint | Purpose | Used By |
|-------------|---------|---------|
| `/api/evaluate` | Sentiment analysis + skill extraction | Admin analytics |
| `/api/evaluate-with-bias` | Enhanced sentiment + bias detection | Admin analytics |
| `/api/evaluate-post-approval` | Post-approval insights | Advisor review |
| `/api/batch-evaluate` | Batch historical analysis | Admin reports |

**Important**: Final grades are determined by:
1. Supervisor ratings (technical, communication, work_ethic)
2. Advisor professional judgment
3. Advisor can override with `grade_override` + `grade_override_reason`

---

## 5. Complete End-to-End Flow

```mermaid
flowchart TB
    subgraph Phase1[Phase 1: Enrollment]
        A1[Admin creates student account] --> A2[Admin creates internship]
        A2 --> A3[Assign student to company]
        A3 --> A4[Set internship dates]
    end
    
    subgraph Phase2[Phase 2: Deployment]
        B1[Student status: deployed] --> B2[12-week internship begins]
        B2 --> B3[Weekly report cycle x12]
    end
    
    subgraph Phase3[Phase 3: Weekly Reports]
        C1[Student submits report] --> C2{Supervisor review}
        C2 -->|Approve| C3[Report approved]
        C2 -->|Reject| C4[Student revises]
        C4 --> C1
        C3 --> C5{Week 12?}
        C5 -->|No| C1
        C5 -->|Yes| C6[All reports complete]
    end
    
    subgraph Phase4[Phase 4: Evaluation]
        D1[Supervisor submits evaluation] --> D2[Advisor reviews]
        D2 --> D3[Advisor uses AI for insights]
        D3 --> D4[Advisor approves + sets grade]
        D4 --> D5[Grade reveal date set]
    end
    
    subgraph Phase5[Phase 5: Graduation]
        E1[Student views final grade] --> E2[Internship marked complete]
        E2 --> E3[Student: pending_graduation]
        E3 --> E4[Admin confirms graduation]
        E4 --> E5[Student: graduated]
        E5 --> E6[Optional: archive]
    end
    
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
```

---

## 6. Notification Flow

```mermaid
flowchart LR
    subgraph Events[Triggering Events]
        E1[Weekly report submitted]
        E2[Report approved/rejected]
        E3[Evaluation submitted]
        E4[Evaluation approved]
        E5[Internship ending soon]
    end
    
    subgraph Socket[Socket.io Emissions]
        S1["emitNewNotification()"]
        S2["emitEvaluationUpdate()"]
        S3["emitConversationUpdate()"]
    end
    
    subgraph Rooms[Socket Rooms]
        R1["user:{userId}"]
        R2["evaluation:{evalId}"]
        R3["conversation:{convId}"]
    end
    
    E1 --> S1 --> R1
    E2 --> S1 --> R1
    E3 --> S2 --> R2
    E4 --> S2 --> R2
    E5 --> S1 --> R1
```

---

## 7. Data Archival Flow (No Deletion)

Per thesis advisor requirement: **"Archive instead of delete para may integrity yung data"**

```mermaid
flowchart TD
    A[Admin selects user/record] --> B{Action type?}
    B -->|Archive| C[Set archived_at timestamp]
    C --> D[Record hidden from active queries]
    D --> E[Data preserved for auditing]
    
    B -->|Restore| F[Clear archived_at]
    F --> G[Record visible again]
    
    Note1[No DELETE operations on user data]
    Note2[All records have audit timestamps]
```

### Archived Data Queries

```sql
-- Active records only
SELECT * FROM users WHERE archived_at IS NULL;

-- Include archived for reports
SELECT * FROM users;

-- Archived only for admin review
SELECT * FROM users WHERE archived_at IS NOT NULL;
```

---

## 8. Automation Jobs

```mermaid
flowchart TD
    subgraph DailyJob[Daily Automation - internshipAutomation.ts]
        J1[Check internship end dates] --> J2{End date reached?}
        J2 -->|Yes| J3[Mark internship completed]
        J3 --> J4[Update student to completed]
        J4 --> J5{All requirements met?}
        J5 -->|Yes| J6[Set pending_graduation]
        
        J2 -->|No| J7{7 days remaining?}
        J7 -->|Yes| J8[Send reminder notification]
    end
```

### Automation Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| `checkInternshipEndDates` | Daily 00:00 | Marks completed internships |
| `sendInternshipReminders` | Daily 08:00 | 7-day end reminders |
| `updatePendingGraduation` | Daily 00:00 | Status transitions |

---

## 9. API Endpoint Reference by Flow

### Student Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/student/weekly-reports` | POST | Submit weekly report |
| `/api/student/weekly-reports` | GET | View own reports |
| `/api/student/evaluations` | GET | View final evaluation |

### Supervisor Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/supervisor/weekly-reports` | GET | View pending reports |
| `/api/supervisor/weekly-reports/:id/approve` | PATCH | Approve report |
| `/api/supervisor/weekly-reports/:id/reject` | PATCH | Request revision |
| `/api/supervisor/evaluations` | POST | Submit final evaluation |

### Advisor Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/advisor/weekly-reports` | GET | View all approved reports |
| `/api/advisor/evaluations` | GET | View pending evaluations |
| `/api/advisor/evaluations/:id/approve` | PATCH | Approve + set grade |

### Admin Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET/POST | User management |
| `/api/admin/users/:id/graduate` | POST | Confirm graduation |
| `/api/admin/dashboard/company-capacity` | GET | Company utilization |
| `/api/admin/analytics` | GET | Platform metrics |

---

## 10. Summary: Thesis Advisor Requirements Addressed

| Requirement | Implementation |
|-------------|----------------|
| ✅ Dashboard shows OJT data | Company capacity, internship stats, student deployment |
| ✅ Archive instead of delete | `archived_at` timestamps, no hard deletes |
| ✅ Weekly report flow | Student → Supervisor approval → Advisor visibility |
| ✅ AI for analytics only | Post-approval insights, not grading decisions |
| ✅ Complete transaction flow visible | This document with Mermaid diagrams |

---

*Generated for Intern-Galing Platform - CVSU OJT Management System*
