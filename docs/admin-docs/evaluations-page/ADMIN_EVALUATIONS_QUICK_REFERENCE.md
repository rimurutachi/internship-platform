# Admin Evaluations Management - Quick Reference

## Quick Start

### Access the Page
```
URL: /dashboard/admin/evaluations
Role Required: admin
```

### Start Backend & Frontend
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev
```

---

## API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/evaluations` | List all evaluations with filters |
| GET | `/api/admin/evaluations/:id` | Get single evaluation details |
| GET | `/api/admin/evaluations/:id/ai-results` | Get AI analysis results |
| PATCH | `/api/admin/evaluations/:id/validate-sentiment` | Validate sentiment analysis |
| PATCH | `/api/admin/evaluations/:id/validate-features` | Validate feature extraction |
| PATCH | `/api/admin/evaluations/:id/validate-bias` | Validate bias check |
| POST | `/api/admin/evaluations/:id/approve` | Approve evaluation |
| POST | `/api/admin/evaluations/:id/override-grade` | Override AI grade |
| POST | `/api/admin/evaluations/:id/reject` | Reject evaluation |
| POST | `/api/admin/evaluations/:id/request-reprocess` | Request AI reprocess |
| GET | `/api/admin/evaluations/metrics/quality` | Get quality metrics |
| GET | `/api/admin/evaluations/metrics/by-supervisor` | Get supervisor metrics |
| GET | `/api/admin/evaluations/metrics/by-company` | Get company metrics |
| POST | `/api/admin/evaluations/bulk-approve` | Bulk approve evaluations |
| POST | `/api/admin/evaluations/bulk-export` | Export evaluations (CSV/JSON) |

---

## Status States

| Status | Color | Meaning |
|--------|-------|---------|
| **draft** | Gray | Supervisor creating, not submitted |
| **submitted** | Blue | Submitted, awaiting AI processing |
| **processed** | Yellow | AI analysis complete, awaiting admin review |
| **approved** | Green | Admin approved, final grade set |

---

## Common Tasks

### 1. View All Evaluations
```typescript
// Frontend API call
const response = await adminEvaluationsAPI.getEvaluations({
  page: 1,
  limit: 20
});
```

### 2. Filter by Status
```typescript
const response = await adminEvaluationsAPI.getEvaluations({
  status: 'processed',
  page: 1,
  limit: 20
});
```

### 3. Search by Student
```typescript
const response = await adminEvaluationsAPI.getEvaluations({
  search: 'John Doe',
  page: 1,
  limit: 20
});
```

### 4. Approve Evaluation
```typescript
await adminEvaluationsAPI.approveEvaluation(evaluationId, {
  use_ai_grade: true,
  notes: 'Approved - AI grade accurate'
});
```

### 5. Override Grade
```typescript
await adminEvaluationsAPI.overrideGrade(evaluationId, {
  new_grade: 88,
  reason: 'Adjusted based on additional context'
});
```

### 6. Reject Evaluation
```typescript
await adminEvaluationsAPI.rejectEvaluation(evaluationId, {
  reason: 'incomplete_feedback',
  comments: 'Please provide more detailed technical assessment'
});
```

### 7. Export to CSV
```typescript
await adminEvaluationsAPI.bulkExport({
  format: 'csv',
  filters: { status: 'approved' },
  include_ai_results: true
});
```

---

## Rating Scales

All ratings are on a scale of **1-10**:

- **rating_overall** - Overall performance
- **rating_technical** - Technical skills
- **rating_communication** - Communication skills  
- **rating_work_ethic** - Work ethic and professionalism

**Average Rating** = Sum of all 4 ratings ÷ 4

---

## AI Results Components

### Sentiment Scores
```typescript
{
  positive: 0.75,  // 75% positive sentiment
  neutral: 0.20,   // 20% neutral sentiment
  negative: 0.05   // 5% negative sentiment
}
```

### Extracted Features
```typescript
[
  "strong_communication",
  "technical_aptitude", 
  "teamwork_skills",
  "problem_solving"
]
```

### Grade & Confidence
- **recommended_grade**: 0-100 (AI calculated grade)
- **confidence_score**: 0-1 (AI confidence in recommendation)
- **bias_check_passed**: boolean (bias detection result)

---

## Quality Metrics

### Dashboard Cards

**Total This Month**
- Count of all evaluations created this month
- All statuses included

**Total Processed**  
- Count of evaluations with status "processed" or "approved"
- This month only

**Avg Confidence**
- Average of all confidence_score values
- From processed evaluations
- Displayed as percentage (0-100%)

**Bias Pass Rate**
- Percentage of evaluations passing bias check
- From processed evaluations
- Displayed as percentage

---

## Filter Options

### Status Filter
- All Status
- Draft
- Submitted  
- Processed
- Approved

### Supervisor Filter
- Select from list of supervisors

### Company Filter
- Select from list of companies

### Date Range
- Start date
- End date

### Search
- Student name search
- Email search

---

## Validation Actions

### Validate Sentiment
```typescript
await adminEvaluationsAPI.validateSentiment(evaluationId, {
  is_accurate: true,
  notes: 'Sentiment analysis matches feedback tone'
});
```

### Validate Features
```typescript
await adminEvaluationsAPI.validateFeatures(evaluationId, {
  is_correct: true,
  corrections: 'Add leadership to features'
});
```

### Validate Bias
```typescript
await adminEvaluationsAPI.validateBias(evaluationId, {
  passed: true,
  reason: 'No bias detected in language or ratings'
});
```

---

## Activity Log Actions

All admin actions are logged with:
- `user_id` - Admin who performed action
- `action` - Action type
- `entity_type` - "evaluation"
- `entity_id` - Evaluation ID
- `description` - Human-readable description
- `metadata` - Additional data (JSON)
- `created_at` - Timestamp

**Logged Actions:**
- `sentiment_validated`
- `features_validated`
- `bias_check_validated`
- `evaluation_approved`
- `grade_overridden`
- `evaluation_rejected`
- `reprocess_requested`

---

## Error Handling

### Common Errors

**404 - Not Found**
```json
{
  "error": "Evaluation not found"
}
```

**400 - Bad Request**
```json
{
  "error": "Evaluation not yet processed by AI",
  "status": "submitted"
}
```

**400 - Invalid Grade**
```json
{
  "error": "Grade must be between 0 and 100"
}
```

**500 - Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## Testing Shortcuts

### Test with Mock Data

**Backend Test:**
```bash
# Using curl
curl -X GET "http://localhost:5000/api/admin/evaluations?status=processed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Frontend Test:**
```typescript
// In browser console
const api = require('@/lib/api/admin-evaluations').adminEvaluationsAPI;
const data = await api.getEvaluations({ status: 'processed' });
console.log(data);
```

### Create Test Evaluation
```sql
-- In Supabase SQL Editor
INSERT INTO evaluations (
  internship_id,
  supervisor_id,
  feedback_text,
  rating_overall,
  rating_technical,
  rating_communication,
  rating_work_ethic,
  status
) VALUES (
  'internship-uuid',
  'supervisor-uuid',
  'Great performance throughout the internship.',
  9,
  8,
  9,
  10,
  'submitted'
);
```

---

## Troubleshooting

### Issue: Evaluations not loading
**Check:**
1. Backend is running (`npm run dev` in backend/)
2. Frontend is running (`npm run dev` in frontend/)
3. Supabase connection is valid
4. JWT token is not expired

### Issue: AI results not showing
**Check:**
1. Evaluation status is "processed" or "approved"
2. `sentiment_scores`, `lit_features` columns have data
3. Check browser console for errors

### Issue: Cannot approve evaluation
**Check:**
1. Evaluation status is "processed"
2. Final grade is provided (or use_ai_grade is true)
3. Grade is between 0-100

### Issue: Export not downloading
**Check:**
1. Browser allows downloads
2. Check network tab for response
3. Verify format is 'csv' or 'json'

---

## File Locations

**Backend:**
```
backend/src/
├── routes/admin/evaluations.routes.ts
├── controllers/admin/evaluationsController.ts
└── services/evaluationsService.ts
```

**Frontend:**
```
frontend/
├── lib/api/admin-evaluations.ts
├── src/types/api.ts (updated)
└── src/app/dashboard/admin/evaluations/page.tsx
```

**Documentation:**
```
docs/
├── ADMIN_EVALUATIONS_IMPLEMENTATION.md
└── ADMIN_EVALUATIONS_QUICK_REFERENCE.md (this file)
```

---

## Keyboard Shortcuts (Future Enhancement)

| Key | Action |
|-----|--------|
| `Ctrl + K` | Search evaluations |
| `Ctrl + F` | Open filters |
| `Ctrl + E` | Export current view |
| `Esc` | Close modal |

---

## Mobile Responsiveness

**Mobile View:**
- Table converts to cards
- Filters collapse into dropdown
- Modals are full-screen
- Touch-friendly buttons

**Tablet View:**
- Side-by-side layout for modals
- Visible filters
- Compact table

**Desktop View:**
- Full table display
- All filters visible
- Multi-column metrics

---

## Performance Tips

1. **Use pagination** - Don't load all evaluations at once
2. **Filter early** - Apply status filters to reduce data
3. **Cache metrics** - Metrics update every 5 minutes
4. **Lazy load AI results** - Only fetch when viewing evaluation
5. **Debounce search** - Wait 300ms before searching

---

## Next Actions After Implementation

1. ✅ Test all endpoints
2. ✅ Verify frontend displays data correctly
3. ✅ Test with real evaluation data
4. ✅ Check activity log creation
5. ✅ Test export functionality
6. ✅ Verify responsive design
7. ✅ Test error handling
8. 🔄 Integrate AI service (Phase 2)
9. 🔄 Add email notifications
10. 🔄 Add advanced analytics

---

## Support

**For Issues:**
- Check backend logs: `backend/logs/`
- Check browser console for frontend errors
- Verify Supabase connection in `.env` files
- Check activity_log table for action history

**For Questions:**
- Refer to `ADMIN_EVALUATIONS_IMPLEMENTATION.md` for detailed docs
- Check `docs/api/rest-endpoints.md` for API specs
- See `docs/DATABASE_SCHEMA.md` for table structures

---

**Last Updated:** November 27, 2025
**Version:** 1.0.0
**Status:** ✅ Implementation Complete
