# Schema Mapping - AI Service to Database

## ⚠️ IMPORTANT: Database Schema Differences

The actual `evaluations_ai_analysis` table in Supabase uses **different column names** than what the AI service returns. The backend code now handles this mapping automatically.

---

## 📊 Field Mapping Reference

### AI Service Response → Database Columns

| AI Service Response | Database Column | Type | Notes |
|---------------------|-----------------|------|-------|
| `features.technical_skills` | `extracted_technical_skills` | `text[]` | Direct mapping |
| `features.soft_skills` | `extracted_soft_skills` | `text[]` | Direct mapping |
| `sentiment.breakdown.positive` | `sentiment_positive_score` | `real` | Extract from breakdown |
| `sentiment.breakdown.neutral` | `sentiment_neutral_score` | `real` | Extract from breakdown |
| `sentiment.breakdown.negative` | `sentiment_negative_score` | `real` | Extract from breakdown |
| `sentiment.label` | `overall_sentiment` | `text` | Values: 'positive', 'neutral', 'negative' |
| `bias_check.flags` | `potential_biases` | `text[]` | Direct mapping |
| `confidence_score` | `overall_confidence_score` | `real` | Range: 0.0 - 1.0 |
| `processing_time_ms` | `processing_time_ms` | `integer` | Direct mapping |
| (hardcoded) | `ai_model_version` | `text` | Set to 'v1.0.0' |

### Optional Fields (Set to Empty Arrays for Now)

| Database Column | Current Value | Future Use |
|----------------|---------------|------------|
| `key_achievements` | `[]` | Can extract from feedback text |
| `areas_for_improvement` | `[]` | Can extract from feedback text |
| `ai_recommendations` | `[]` | Generate based on analysis |
| `suggested_improvements` | `[]` | Generate based on analysis |

---

## 🔍 Schema Validation

### Sentiment Scores Constraint
```sql
CHECK (
  sentiment_positive_score >= 0 AND sentiment_positive_score <= 1 AND
  sentiment_neutral_score >= 0 AND sentiment_neutral_score <= 1 AND
  sentiment_negative_score >= 0 AND sentiment_negative_score <= 1 AND
  (sentiment_positive_score + sentiment_neutral_score + sentiment_negative_score) <= 1.01
)
```
**Note:** Sum of all sentiment scores must be ≤ 1.01 (allows for minor floating point errors)

### Confidence Score Constraint
```sql
CHECK (overall_confidence_score >= 0 AND overall_confidence_score <= 1)
```

### Processing Time Constraint
```sql
CHECK (processing_time_ms >= 0)
```

---

## 📝 Example Data Flow

### 1. AI Service Returns:
```json
{
  "features": {
    "technical_skills": ["React", "Node.js", "TypeScript"],
    "soft_skills": ["communication", "teamwork"]
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
  "bias_check": {
    "passed": true,
    "flags": []
  },
  "confidence_score": 0.92,
  "processing_time_ms": 1250
}
```

### 2. Backend Maps to Database:
```typescript
{
  evaluation_id: "uuid-here",
  extracted_technical_skills: ["React", "Node.js", "TypeScript"],
  extracted_soft_skills: ["communication", "teamwork"],
  key_achievements: [],
  areas_for_improvement: [],
  sentiment_positive_score: 0.85,
  sentiment_neutral_score: 0.10,
  sentiment_negative_score: 0.05,
  overall_sentiment: "positive",
  ai_recommendations: [],
  suggested_improvements: [],
  potential_biases: [],
  ai_model_version: "v1.0.0",
  processing_time_ms: 1250,
  overall_confidence_score: 0.92
}
```

### 3. Database Stores:
```sql
INSERT INTO evaluations_ai_analysis (
  evaluation_id,
  extracted_technical_skills,
  extracted_soft_skills,
  sentiment_positive_score,
  sentiment_neutral_score,
  sentiment_negative_score,
  overall_sentiment,
  potential_biases,
  overall_confidence_score,
  processing_time_ms,
  ai_model_version
) VALUES (
  'uuid-here',
  ARRAY['React', 'Node.js', 'TypeScript'],
  ARRAY['communication', 'teamwork'],
  0.85,
  0.10,
  0.05,
  'positive',
  ARRAY[]::text[],
  0.92,
  1250,
  'v1.0.0'
);
```

---

## 🎯 Usage in Code

### Service Layer (Already Implemented)
```typescript
// backend/src/services/evaluationService.ts

const aiResult = await aiService.analyzeEvaluation(text, ratings);

// Mapping happens here:
const { data: aiAnalysisRecord } = await supabase
  .from('evaluations_ai_analysis')
  .insert({
    evaluation_id: evaluationId,
    extracted_technical_skills: aiResult.features.technical_skills, // ✅ Mapped
    extracted_soft_skills: aiResult.features.soft_skills, // ✅ Mapped
    sentiment_positive_score: aiResult.sentiment.breakdown?.positive || 0, // ✅ Extracted
    sentiment_neutral_score: aiResult.sentiment.breakdown?.neutral || 0, // ✅ Extracted
    sentiment_negative_score: aiResult.sentiment.breakdown?.negative || 0, // ✅ Extracted
    overall_sentiment: aiResult.sentiment.label, // ✅ Mapped
    potential_biases: aiResult.bias_check.flags, // ✅ Mapped
    ai_model_version: 'v1.0.0', // ✅ Hardcoded
    processing_time_ms: aiResult.processing_time_ms, // ✅ Mapped
    overall_confidence_score: aiResult.confidence_score, // ✅ Mapped
  });
```

---

## 🔄 Existing View: `evaluation_details`

The database already has a view that joins evaluations with AI analysis:

```sql
SELECT * FROM evaluation_details WHERE id = 'evaluation-uuid';
```

**Returns:**
- All evaluation fields
- All AI analysis fields (prefixed appropriately)
- Student, supervisor, and advisor details

**Use this view** for comprehensive evaluation data instead of manual joins.

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Don't use** `technical_skills` → Use `extracted_technical_skills`
2. ❌ **Don't use** `soft_skills` → Use `extracted_soft_skills`
3. ❌ **Don't use** `sentiment_score` → Use `sentiment_positive_score`, etc.
4. ❌ **Don't use** `bias_flags` → Use `potential_biases`
5. ❌ **Don't use** `confidence_score` → Use `overall_confidence_score`

---

## ✅ Verification Checklist

- [x] Column names match actual database schema
- [x] Sentiment scores extracted from breakdown object
- [x] Empty arrays used for optional fields
- [x] AI model version hardcoded
- [x] Constraints validated (scores between 0-1, sum ≤ 1.01)
- [x] Foreign key relationship maintained
- [x] TypeScript interfaces updated

---

**Updated:** December 3, 2025  
**Status:** Schema mapping corrected and production-ready
