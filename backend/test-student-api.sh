#!/bin/bash

# Student Backend API Test Script
# Tests all major student endpoints

API_URL="http://localhost:5000/api/student"
TOKEN="your_test_token_here"  # Replace with actual token

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Student Backend API Testing"
echo "========================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s http://localhost:5000/health | jq .
echo ""

# Test 2: Get Profile
echo -e "${YELLOW}Test 2: Get Student Profile${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/profile | jq .
echo ""

# Test 3: Get Dashboard
echo -e "${YELLOW}Test 3: Get Dashboard Data${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/dashboard | jq .
echo ""

# Test 4: Get Current Internship
echo -e "${YELLOW}Test 4: Get Current Internship${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/internship | jq .
echo ""

# Test 5: Get Progress
echo -e "${YELLOW}Test 5: Get Progress Metrics${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/internship/progress | jq .
echo ""

# Test 6: Get Evaluations
echo -e "${YELLOW}Test 6: Get Evaluations${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     "$API_URL/evaluations?limit=5" | jq .
echo ""

# Test 7: Get Skills Assessment
echo -e "${YELLOW}Test 7: Get Skills Assessment${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/skills-assessment | jq .
echo ""

# Test 8: Get Documents
echo -e "${YELLOW}Test 8: Get Documents${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/documents | jq .
echo ""

# Test 9: Get Required Documents
echo -e "${YELLOW}Test 9: Get Required Documents${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/documents/required | jq .
echo ""

# Test 10: Get Conversations
echo -e "${YELLOW}Test 10: Get Conversations${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/messages/conversations | jq .
echo ""

# Test 11: Get Notifications
echo -e "${YELLOW}Test 11: Get Notifications${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/notifications | jq .
echo ""

# Test 12: Get Mentors
echo -e "${YELLOW}Test 12: Get Mentors${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/mentors | jq .
echo ""

# Test 13: Get Tasks
echo -e "${YELLOW}Test 13: Get Tasks${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/tasks | jq .
echo ""

# Test 14: Get Reminders
echo -e "${YELLOW}Test 14: Get Reminders${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/reminders | jq .
echo ""

# Test 15: Get Timeline
echo -e "${YELLOW}Test 15: Get Internship Timeline${NC}"
curl -s -H "Authorization: Bearer $TOKEN" \
     $API_URL/internship/timeline | jq .
echo ""

echo "========================================"
echo "Testing Complete!"
echo "========================================"
echo ""
echo "To test with real token:"
echo "1. Login to your app"
echo "2. Get JWT token from browser localStorage"
echo "3. Replace TOKEN variable in this script"
echo "4. Run: ./test-student-api.sh"
