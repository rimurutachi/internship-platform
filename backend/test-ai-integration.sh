#!/bin/bash

# AI Service Integration Test Script
# Tests the new AI-powered evaluation endpoints

echo "🚀 Testing AI Service Integration for Evaluations Module"
echo "========================================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:5000"
AI_SERVICE_URL="http://localhost:8000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "1️⃣  Checking service availability..."
echo ""

# Check Backend
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Backend is running at $BACKEND_URL"
else
    echo -e "${RED}✗${NC} Backend is NOT running at $BACKEND_URL"
    echo "   Start backend: cd backend && npm run dev"
fi

# Check AI Service
if curl -s -o /dev/null -w "%{http_code}" "$AI_SERVICE_URL/health" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} AI Service is running at $AI_SERVICE_URL"
else
    echo -e "${YELLOW}⚠${NC}  AI Service is NOT running at $AI_SERVICE_URL"
    echo "   Start AI service: cd ai-service && source venv/bin/activate && python main.py"
fi

echo ""
echo "========================================================"
echo ""

# Test Data
TEST_TEXT="The student demonstrated excellent problem-solving skills in React and Node.js. Strong communication with the team and consistently met deadlines. Shows great initiative and teamwork."

echo "2️⃣  Test Data:"
echo "Text: $TEST_TEXT"
echo ""

# Get authentication token (you'll need to replace this with actual token)
echo "3️⃣  Authentication:"
echo -e "${YELLOW}⚠${NC}  You need to provide a valid JWT token"
echo "   Set TOKEN variable: export TOKEN='your-jwt-token-here'"
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} TOKEN environment variable not set"
    echo ""
    echo "To run tests, first authenticate and export your token:"
    echo "  export TOKEN='your-jwt-token-here'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Token found"
echo ""

echo "========================================================"
echo ""

# Test 1: Analyze Draft Evaluation
echo "4️⃣  Test 1: Analyze Draft Evaluation"
echo "   POST /api/evaluations/analyze-draft"
echo ""

RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/evaluations/analyze-draft" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"text\":\"$TEST_TEXT\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Draft analysis successful"
else
    echo -e "${RED}✗${NC} Draft analysis failed"
fi

echo ""
echo "========================================================"
echo ""

# Test 2: Create and Submit Evaluation
echo "5️⃣  Test 2: Create and Submit Evaluation (End-to-End)"
echo ""

# First, create an evaluation
echo "Step 1: Creating evaluation..."
CREATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/evaluations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"internship_id\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"supervisor_id\": \"770e8400-e29b-41d4-a716-446655440002\",
    \"feedback_text\": \"$TEST_TEXT\",
    \"rating_overall\": 9,
    \"rating_technical\": 9,
    \"rating_communication\": 8,
    \"rating_work_ethic\": 9
  }")

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Extract evaluation ID
EVAL_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id' 2>/dev/null)

if [ "$EVAL_ID" != "null" ] && [ -n "$EVAL_ID" ]; then
    echo -e "${GREEN}✓${NC} Evaluation created with ID: $EVAL_ID"
    echo ""
    
    # Now submit the evaluation
    echo "Step 2: Submitting evaluation for AI processing..."
    SUBMIT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/evaluations/$EVAL_ID/submit" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$SUBMIT_RESPONSE" | jq '.' 2>/dev/null || echo "$SUBMIT_RESPONSE"
    echo ""
    
    if echo "$SUBMIT_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Evaluation submitted and AI analysis complete"
        
        # Check if AI analysis data is present
        if echo "$SUBMIT_RESPONSE" | jq -e '.data.ai_analysis' >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} AI analysis data received"
            
            # Extract key metrics
            TECH_SKILLS=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.ai_analysis.technical_skills[]' 2>/dev/null | tr '\n' ', ')
            SOFT_SKILLS=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.ai_analysis.soft_skills[]' 2>/dev/null | tr '\n' ', ')
            SENTIMENT=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.ai_analysis.sentiment_label' 2>/dev/null)
            BIAS_CHECK=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.ai_analysis.bias_check_passed' 2>/dev/null)
            CONFIDENCE=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.ai_analysis.confidence_score' 2>/dev/null)
            
            echo ""
            echo "   📊 AI Analysis Results:"
            echo "   ├─ Technical Skills: $TECH_SKILLS"
            echo "   ├─ Soft Skills: $SOFT_SKILLS"
            echo "   ├─ Sentiment: $SENTIMENT"
            echo "   ├─ Bias Check: $BIAS_CHECK"
            echo "   └─ Confidence: $CONFIDENCE"
        else
            echo -e "${YELLOW}⚠${NC}  AI analysis not available (service may be down)"
        fi
    else
        echo -e "${RED}✗${NC} Evaluation submission failed"
    fi
else
    echo -e "${RED}✗${NC} Failed to create evaluation"
fi

echo ""
echo "========================================================"
echo ""

# Test 3: Direct AI Service Test
echo "6️⃣  Test 3: Direct AI Service Health Check"
echo "   GET $AI_SERVICE_URL/health"
echo ""

AI_HEALTH=$(curl -s "$AI_SERVICE_URL/health")
echo "$AI_HEALTH" | jq '.' 2>/dev/null || echo "$AI_HEALTH"
echo ""

if echo "$AI_HEALTH" | jq -e '.status' >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} AI Service is healthy"
else
    echo -e "${RED}✗${NC} AI Service health check failed"
fi

echo ""
echo "========================================================"
echo ""
echo "🎉 Test script completed!"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Check service availability"
echo "✓ Test draft analysis endpoint"
echo "✓ Test full evaluation submission with AI"
echo "✓ Verify AI service health"
echo ""
echo "For manual testing, use the Postman collection or:"
echo "  curl commands in docs/api/ai-service-integration.md"
echo ""
