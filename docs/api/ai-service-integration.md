# AI Service Integration API Documentation

## Overview

The AI Service Integration enables real-time feedback analysis and comprehensive evaluation processing using Python FastAPI backend with LLT (Linear Law-based Transformation) and sentiment analysis.

## Architecture

```
Frontend → Backend (Node.js/Express) → AI Service (Python FastAPI)
                ↓
         Supabase PostgreSQL
         (evaluations + evaluations_ai_analysis tables)
```

## Endpoints

### 1. Analyze Draft Evaluation

**Endpoint:** `POST /api/evaluations/analyze-draft`

**Description:** Lightweight real-time analysis for supervisors while composing evaluations. Returns features and sentiment without bias checking for speed.

**Authorization:** Requires `supervisor` role

**Request Body:**
```json
{
  "text": "The student demonstrated excellent problem-solving skills in React and Node.js. Strong communication with the team and consistently met deadlines."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "features": {
      "technical_skills": ["React", "Node.js", "problem-solving"],
      "soft_skills": ["communication", "time management"]
    },
    "sentiment": {
      "score": 0.85,
      "label": "positive",
      "breakdown": {
        "positive": 0.85,
        "neutral": 0.10,
        "negative": 0.05
      }
    },
    "processing_time_ms": 45
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Text is too short for analysis (minimum 5 characters)"
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "error": "AI Service Error: Connection timeout"
}
```

---

### 2. Submit Evaluation (Enhanced with AI)

**Endpoint:** `POST /api/evaluations/:id/submit`

**Description:** Submits evaluation for processing with full AI analysis including bias detection. Creates record in `evaluations_ai_analysis` table and links to evaluation.

**Authorization:** Requires `supervisor` role

**Request Parameters:**
- `id` (path parameter): UUID of the evaluation to submit

**Request Body:** None required (evaluation data already exists from creation)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "internship_id": "660e8400-e29b-41d4-a716-446655440001",
      "supervisor_id": "770e8400-e29b-41d4-a716-446655440002",
      "feedback_text": "Excellent performance throughout the internship...",
      "rating_overall": 9,
      "rating_technical": 9,
      "rating_communication": 8,
      "rating_work_ethic": 9,
      "status": "submitted",
      "submitted_at": "2025-12-03T10:30:00.000Z",
      "ai_analysis_id": "880e8400-e29b-41d4-a716-446655440003",
      "bias_check_passed": true,
      "confidence_score": 0.92,
      "created_at": "2025-12-03T09:00:00.000Z",
      "updated_at": "2025-12-03T10:30:00.000Z"
    },
    "ai_analysis": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "evaluation_id": "550e8400-e29b-41d4-a716-446655440000",
      "technical_skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
      "soft_skills": ["communication", "teamwork", "problem-solving", "time management"],
      "sentiment_score": 0.85,
      "sentiment_label": "positive",
      "sentiment_breakdown": {
        "positive": 0.85,
        "neutral": 0.10,
        "negative": 0.05
      },
      "bias_flags": [],
      "bias_check_passed": true,
      "confidence_score": 0.92,
      "processing_time_ms": 1250,
      "created_at": "2025-12-03T10:30:00.000Z"
    }
  },
  "message": "Evaluation submitted and processing!"
}
```

**Response (AI Service Unavailable - 200 with Warning):**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "submitted",
      "submitted_at": "2025-12-03T10:30:00.000Z",
      "ai_analysis_id": null,
      "bias_check_passed": null,
      "confidence_score": null
    },
    "ai_analysis": null,
    "warning": "AI analysis unavailable"
  },
  "message": "Evaluation submitted and processing!"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "Evaluation not found"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Feedback text is too short for submission (minimum 10 characters)"
}
```

---

## Database Schema

### evaluations_ai_analysis Table

```sql
CREATE TABLE public.evaluations_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
    technical_skills TEXT[],
    soft_skills TEXT[],
    sentiment_score DECIMAL(5,2) NOT NULL,
    sentiment_label VARCHAR(20) NOT NULL,
    sentiment_breakdown JSONB,
    bias_flags TEXT[],
    bias_check_passed BOOLEAN DEFAULT true,
    confidence_score DECIMAL(5,2) NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### evaluations Table (Updated Fields)

```sql
-- New columns added to existing evaluations table
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS ai_analysis_id UUID REFERENCES public.evaluations_ai_analysis(id);
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS bias_check_passed BOOLEAN;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
```

---

## AI Service Integration

### Backend Service Layer

**File:** `backend/src/services/aiService.ts`

**Methods:**
- `analyzeDraft(text: string)` - Lightweight analysis for real-time feedback
- `analyzeEvaluation(text: string, ratings: object)` - Full analysis with bias detection
- `isServiceAvailable()` - Health check for AI service
- `getFallbackAnalysis(text: string)` - Fallback when AI service is down

**Configuration:**
```env
AI_SERVICE_URL=http://localhost:8000
```

### Python AI Service Endpoints

**Base URL:** `http://localhost:8000`

**Health Check:** `GET /health`

**Draft Analysis:** `POST /api/evaluate-draft`
- Fast processing (~50ms)
- No bias detection
- Returns features + sentiment

**Full Analysis:** `POST /api/evaluate-with-bias`
- Complete processing (~1-2 seconds)
- Includes bias detection
- Requires ratings data

---

## Integration Flow

### Draft Analysis Flow
```
1. Supervisor types feedback in frontend
2. Frontend debounces and sends POST /api/evaluations/analyze-draft
3. Backend calls aiService.analyzeDraft(text)
4. AI Service processes and returns features + sentiment
5. Frontend displays real-time insights
```

### Submission Flow
```
1. Supervisor clicks "Submit Evaluation"
2. Frontend sends POST /api/evaluations/:id/submit
3. Backend:
   a. Fetches evaluation from database
   b. Calls aiService.analyzeEvaluation(text, ratings)
   c. AI Service returns full analysis with bias check
   d. Inserts record into evaluations_ai_analysis table
   e. Updates evaluations table with ai_analysis_id, bias_check_passed, confidence_score
   f. Emits real-time WebSocket event
4. Frontend displays success with AI insights
```

---

## Error Handling

### Backend Error Handling
- **AI Service Unavailable**: Falls back to submission without AI analysis
- **Invalid Input**: Returns 400 with validation error
- **Database Error**: Returns 500 with error message
- **Timeout**: 30-second timeout on AI service calls

### Frontend Error Handling
- Display user-friendly error messages
- Retry logic for transient failures
- Graceful degradation when AI service is down

---

## Testing

### Manual Testing with cURL

**Test Draft Analysis:**
```bash
curl -X POST http://localhost:5000/api/evaluations/analyze-draft \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "Student showed excellent React and Node.js skills. Great teamwork and communication."
  }'
```

**Test Evaluation Submission:**
```bash
# First create an evaluation, then submit it
curl -X POST http://localhost:5000/api/evaluations/EVALUATION_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Integration Testing

See `backend/tests/integration/ai-service.test.ts` for automated tests.

---

## Performance Considerations

- **Draft Analysis**: < 100ms response time (no bias check)
- **Full Analysis**: 1-2 seconds (includes bias detection)
- **Caching**: Consider caching draft analysis results for 5-10 seconds
- **Rate Limiting**: Implement on frontend to prevent excessive API calls

---

## Security

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Only supervisors can analyze/submit evaluations
- **RLS Policies**: Database-level security on evaluations_ai_analysis table
- **Input Validation**: Text length and format validation on both frontend and backend

---

## Future Enhancements

1. **Caching Layer**: Redis cache for frequently analyzed text
2. **Batch Processing**: Process multiple evaluations in parallel
3. **ML Model Improvements**: Continuous training on new evaluation data
4. **Real-time Suggestions**: AI-powered writing suggestions while typing
5. **Historical Analysis**: Track bias trends over time
6. **Custom Training**: Train models on institution-specific evaluation criteria
