#!/bin/bash

# AI Service Analytics Endpoint Testing Script
# Tests the new /api/evaluate-post-approval endpoint

echo "=========================================="
echo "AI Service Analytics Testing"
echo "=========================================="
echo ""

AI_SERVICE_URL="${AI_SERVICE_URL:-http://localhost:8000}"

echo "Testing AI Service at: $AI_SERVICE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
curl -s "$AI_SERVICE_URL/health" | jq '.'
echo ""
echo ""

# Test 2: Root Endpoint
echo "2️⃣  Testing Root Endpoint..."
curl -s "$AI_SERVICE_URL/" | jq '.'
echo ""
echo ""

# Test 3: Post-Approval Analytics (Single Evaluation)
echo "3️⃣  Testing Post-Approval Analytics (Single Evaluation)..."
curl -s -X POST "$AI_SERVICE_URL/api/evaluate-post-approval" \
  -H "Content-Type: application/json" \
  -d '[{
    "evaluation_id": "test-eval-001",
    "text": "Student demonstrated excellent technical skills in Python programming, database management, and web development. Strong teamwork abilities and excellent communication with team members. Showed great initiative in solving complex problems.",
    "ratings": {
      "quality": 9,
      "attitude": 8,
      "judgment": 8,
      "cooperation": 9,
      "dependability": 8,
      "comprehension": 9,
      "safety": 8
    },
    "student_id": "student-001",
    "supervisor_id": "supervisor-001",
    "created_at": "2025-12-01T10:00:00Z",
    "final_grade": 1.5
  }]' | jq '.'
echo ""
echo ""

# Test 4: Post-Approval Analytics (Multiple Evaluations)
echo "4️⃣  Testing Post-Approval Analytics (Multiple Evaluations)..."
curl -s -X POST "$AI_SERVICE_URL/api/evaluate-post-approval" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "evaluation_id": "eval-001",
      "text": "Excellent Python skills and database knowledge. Great teamwork and communication.",
      "ratings": {"quality": 9, "attitude": 8, "judgment": 8, "cooperation": 9, "dependability": 8, "comprehension": 9, "safety": 8},
      "student_id": "student-001",
      "supervisor_id": "supervisor-001",
      "created_at": "2025-12-01T10:00:00Z",
      "final_grade": 1.5
    },
    {
      "evaluation_id": "eval-002",
      "text": "Strong Java programming and problem-solving abilities. Good collaboration with team members.",
      "ratings": {"quality": 8, "attitude": 7, "judgment": 7, "cooperation": 8, "dependability": 7, "comprehension": 8, "safety": 7},
      "student_id": "student-002",
      "supervisor_id": "supervisor-001",
      "created_at": "2025-12-02T10:00:00Z",
      "final_grade": 2.0
    },
    {
      "evaluation_id": "eval-003",
      "text": "Demonstrated JavaScript proficiency and web development skills. Excellent leadership and mentoring.",
      "ratings": {"quality": 10, "attitude": 9, "judgment": 9, "cooperation": 10, "dependability": 9, "comprehension": 10, "safety": 9},
      "student_id": "student-003",
      "supervisor_id": "supervisor-002",
      "created_at": "2025-12-03T10:00:00Z",
      "final_grade": 1.25
    }
  ]' | jq '.'
echo ""
echo ""

# Test 5: Verify /api/evaluate-draft is REMOVED
echo "5️⃣  Testing that /api/evaluate-draft is REMOVED (should return 404)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AI_SERVICE_URL/api/evaluate-draft" \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}')

if [ "$HTTP_CODE" = "404" ]; then
  echo "✅ PASS: /api/evaluate-draft correctly removed (404 Not Found)"
else
  echo "❌ FAIL: /api/evaluate-draft still exists (HTTP $HTTP_CODE)"
fi
echo ""
echo ""

# Test 6: Error Handling - Empty Evaluations Array
echo "6️⃣  Testing Error Handling (Empty Array)..."
curl -s -X POST "$AI_SERVICE_URL/api/evaluate-post-approval" \
  -H "Content-Type: application/json" \
  -d '[]' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
