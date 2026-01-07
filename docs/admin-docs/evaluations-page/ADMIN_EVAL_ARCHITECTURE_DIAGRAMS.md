# Admin Evaluations Refactor - Architecture Diagram

## 📊 Data Flow Architecture

### BEFORE Refactor
```
┌─────────────────────────────────────────────────────────┐
│                  Admin Evaluations Page                  │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┬────────────────┐
        │             │                │
        ▼             ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ View Modal   │  │Approve Modal │  │Reject Modal  │
│(read-only)   │  │(grade input) │  │(reason input)│
└──────────────┘  └──────────────┘  └──────────────┘
                        │                  │
                        ▼                  ▼
                  ┌──────────────┐  ┌──────────────┐
                  │API: approve  │  │API: reject   │
                  │finalGrade:xx │  │reason: "..."│
                  └──────────────┘  └──────────────┘


### AFTER Refactor
```
┌─────────────────────────────────────────────────────────┐
│                  Admin Evaluations Page                  │
│                    (with logging)                        │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┬────────────────┐
        │             │                │
        ▼             ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ View Modal   │  │Approve Modal │  │Archive Modal │
│(read-only)   │  │(confirmation)│  │(confirmation)│
└──────────────┘  │+ score summary   │(no input)    │
                  │(no grade input)  └──────────────┘
                  └──────────────┘        │
                        │                 │
                        ▼                 ▼
                  ┌──────────────┐  ┌──────────────┐
                  │API: approve  │  │API: reject   │
                  │finalGrade: - │  │reason: ARCH- │
                  │(undefined)   │  │IVED (soft    │
                  └──────────────┘  │delete)       │
                        │            └──────────────┘
                        │                  │
                        ▼                  ▼
                  Backend calculates    Backend marks
                  grade from total_score as archived
```

---

## 🔄 Approval Flow Diagram

### BEFORE: Manual Grade Entry
```
┌────────────────────────────────────┐
│ Supervisor submits evaluation      │
│ + provides total_score: 52/70      │
└────────────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Admin approves     │
        │ (enters grade:??)  │ ← Admin must calculate manually!
        └────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Backend saves      │
        │ final_grade (admin │
        │ input)             │
        └────────────────────┘


### AFTER: Automatic Grade Calculation
```
┌────────────────────────────────────┐
│ Supervisor submits evaluation      │
│ + provides total_score: 52/70      │
└────────────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Admin approves     │
        │ (sees score        │
        │ summary + grade)   │ ← convertScoreToGrade(52) → 2.0
        └────────────────────┘ ← Just confirm, no input!
                 │
                 ▼
        ┌────────────────────┐
        │ Backend converts   │
        │ total_score to     │
        │ final_grade auto   │
        │ (52 → 2.0)         │
        └────────────────────┘
```

---

## 🗂️ Archive vs Delete Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                     Reject (OLD)                             │
├──────────────────────────────────┬──────────────────────────┤
│ Action:                          │ Hard Delete               │
│ Data:                            │ LOST (unrecoverable)      │
│ Supervisor notification:         │ YES - must resubmit       │
│ AI feature compatibility:        │ NO (data gone)            │
│ Use case:                        │ Fix bad evaluations       │
│ Button color:                    │ RED (destructive)         │
└──────────────────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Archive (NEW)                              │
├──────────────────────────────────┬──────────────────────────┤
│ Action:                          │ Soft Delete               │
│ Data:                            │ PRESERVED (recoverable)   │
│ Supervisor notification:         │ NO                        │
│ AI feature compatibility:        │ YES (data available)      │
│ Use case:                        │ Housekeeping/cleanup      │
│ Button color:                    │ AMBER (warning)           │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 📊 Grade Conversion Visual

```
Score (0-70) → CvSU Grade (1.0-5.0)

70 ┌─────────────────────────────────────────┐
   │ ████████ 1.0 (Excellent)                │
65 │ ████████ 1.25-1.75 (Very Good)          │
   │                                          │
55 │ ████████ 2.0 (Good)                     │
50 │ ████████ 2.25-2.75                      │
   │                                          │
40 │ ████████ 3.0 (Fair)                     │
35 │ ████████                                │
   │                                          │
25 │ ████████ 4.0 (Poor)                     │
20 │ ████████                                │
   │                                          │
10 │ ████████ 5.0 (Failing)                  │
 0 └─────────────────────────────────────────┘

Examples:
  70 points → 1.0  ✅ Perfect
  52 points → 2.0  ✓  Good
  35 points → 3.0  ⚠️  Fair
  30 points → 4.0  ❌ Poor
  10 points → 5.0  🔴 Failing
```

---

## 📋 Component Hierarchy

### Before
```
AdminEvaluationsPage
├── EvaluationTable
│   └── (Confidence column)
├── ViewEvaluationModal
├── ApproveEvaluationModal
│   └── Input (grade)
├── RejectEvaluationModal
│   └── Textarea (reason)
└── OverrideGradeModal
```

### After
```
AdminEvaluationsPage
├── EvaluationTable
│   └── (No Confidence column)
│   └── Uses: convertScoreToGrade()
├── ViewEvaluationModal
├── ApproveEvaluationModal
│   └── Uses: convertScoreToGrade()
│   └── Displays: score summary
├── ArchiveEvaluationModal (was RejectEvaluationModal)
│   └── Displays: archive details
└── OverrideGradeModal
```

---

## 🎯 State Machine Diagram

### Evaluation Status Flow
```
                    ┌──────────────┐
                    │   DRAFTED    │
                    └────────┬─────┘
                             │
                             ▼
                    ┌──────────────┐
                    │  SUBMITTED   │ ← Supervisor submits
                    └────┬─────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    ┌──────────────┐            ┌──────────────┐
    │  APPROVED    │            │  ARCHIVED*   │ ← Admin archives
    └──────────────┘            └──────────────┘
          │
          │ (shown to advisor/student)
          ▼
    ┌──────────────┐
    │  COMPLETED   │
    └──────────────┘

* New status added for soft-deleted evaluations
```

---

## 🔌 API Integration Points

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (AdminEvaluationsPage)             │
└──────────────────┬──────────────────────────────────────┘
                   │
      ┌────────────┼────────────┬────────────┐
      │            │            │            │
      ▼            ▼            ▼            ▼
   GET /        PATCH /       POST /      POST /
   admin/      admin/{id}    admin/{id}  admin/{id}/
   evaluate    approve       reject      override-grade
      │            │            │            │
      ├────────────┼────────────┼────────────┤
      │ RESPONSE   │            │            │
      ├────────────┤            │            │
      │ {          │            │            │
      │  data: [   │    ✅      │   🗂️       │
      │    {       │  Grade:   │  Reason:   │
      │  id,       │  undef    │  ARCHIVED  │
      │  total_    │            │            │
      │  score,    │  Backend   │  Backend   │
      │  ...       │  calculates│  soft-    │
      │    }       │  from      │  deletes   │
      │  ],        │  score     │            │
      │  metrics   │            │            │
      │ }          │            │            │
      └────────────┴────────────┴────────────┘
```

---

## 📝 Logging Flow Diagram

### Example: Approval Action
```
User clicks "Approve"
       │
       ▼
handleOpenApprove(evaluation)
       │
       ├─ console.log('📋 Opening approve modal...')
       │
       ▼
Modal displays with score summary
       │
       ├─ Uses: convertScoreToGrade(total_score)
       │
       ▼
User clicks "Approve" button
       │
       ├─ console.log('🔵 handleApprove called...')
       │
       ▼
API Call: POST /admin/evaluations/{id}/approve
       │
       ├─ console.log('📤 Sending approval request...')
       │
       ▼
Backend Response
       │
       ├─ 200 OK: Grade calculated and saved
       │
       ├─ console.log('✅ API response: Approved')
       │
       ▼
Toast: "Evaluation approved successfully"
       │
       ├─ loadEvaluations() reloads list
       │
       ├─ console.log('📊 Loading evaluations...')
       │
       ▼
Table updated with new status
```

---

## 🎨 UI Component Changes

### ApproveEvaluationModal

#### BEFORE
```
┌─────────────────────────────────┐
│ 👁️  Approve Evaluation          │
├─────────────────────────────────┤
│ Confirm the final grade for Juan│
│                                 │
│ Final Grade (%)                 │
│ ┌─────────────────────────────┐ │
│ │ 85.5                        │ │ ← Input field
│ └─────────────────────────────┘ │
│                                 │
│ AI Suggested: 82.3%             │
│                                 │
│ Evaluation Summary:             │
│ ┌─────────────────────────────┐ │
│ │ Technical: 4/5              │ │
│ │ Work Ethic: 3/5             │ │
│ │ Communication: 4/5          │ │
│ │ Overall: 4/5                │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]  [Approve]             │
└─────────────────────────────────┘
```

#### AFTER
```
┌─────────────────────────────────┐
│ ✅ Approve Evaluation           │
├─────────────────────────────────┤
│ Confirm approval for Juan       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Are you sure?               │ │
│ │ This will set final grade   │ │
│ │ based on supervisor's score │ │
│ └─────────────────────────────┘ │
│                                 │
│ Score Summary:                  │
│ ┌─────────────────────────────┐ │
│ │ Total Score: 52/70          │ │ ← Automatic
│ │ Equivalent Grade: 2.00      │ │ ← Calculated
│ └─────────────────────────────┘ │
│                                 │
│ Criteria:                       │
│ ┌─────────────────────────────┐ │
│ │ Technical: 4/5              │ │
│ │ Work Ethic: 3/5             │ │
│ │ Communication: 4/5          │ │
│ │ Overall: 4/5                │ │
│ └─────────────────────────────┘ │
│                                 │
│ Submitted by: Supervisor Name  │
│                                 │
│ [Cancel]  [✅ Approve]          │
└─────────────────────────────────┘
```

---

## 🎯 Summary Comparison Table

```
┌────────────────────┬──────────────────┬──────────────────┐
│ Feature            │ BEFORE           │ AFTER            │
├────────────────────┼──────────────────┼──────────────────┤
│ Table Columns      │ 8 (with Conf)    │ 7 (no Conf)      │
│ Grade Input        │ ✅ Required      │ ❌ Removed       │
│ Grade Calculation  │ ❌ Manual        │ ✅ Automatic     │
│ Score Display      │ ❌ Percentage    │ ✅ CvSU Scale    │
│ Confirmation Flow  │ ❌ Input + Click │ ✅ Click confirm │
│ Reject Function    │ ✅ Hard Delete   │ ❌ Removed       │
│ Archive Function   │ ❌ N/A           │ ✅ Soft Delete   │
│ Data Preservation  │ ❌ No (rejected) │ ✅ Yes (archived)│
│ Console Logging    │ ⚠️  Minimal      │ ✅ Comprehensive │
├────────────────────┼──────────────────┼──────────────────┤
│ TypeScript Errors  │ 0                │ 0                │
│ Component Files    │ 4                │ 5                │
│ Total LOC          │ ~700             │ ~900             │
└────────────────────┴──────────────────┴──────────────────┘
```

---

**Architecture updated successfully! 🎉**
