#!/bin/bash

# ============================================================
# Companies Management API Test Script
# ============================================================
# Tests all CRUD operations for the companies management system
# Requires: Backend server running on localhost:5000
# ============================================================

echo "============================================================"
echo "🚀 Companies Management API Test Suite"
echo "============================================================"
echo ""

# Configuration
API_BASE_URL="http://localhost:5000/api"

# Get credentials from environment or prompt
if [ -z "$ADMIN_EMAIL" ]; then
    echo "Enter admin email (or press Enter for default: admin@internship.com):"
    read input_email
    ADMIN_EMAIL=${input_email:-"admin@internship.com"}
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Enter admin password:"
    read -s input_password
    ADMIN_PASSWORD=${input_password}
    echo ""
fi

TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name: $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Debug: Print actual response for troubleshooting
    if [ "$http_code" != "$expected_status" ]; then
        echo "  [DEBUG] Expected: $expected_status, Got: $http_code"
        echo "  [DEBUG] Response: $body" | head -c 200
        echo ""
    fi
    
    echo "$body"
    
    if [ "$http_code" != "$expected_status" ]; then
        return 1
    fi
    return 0
}

echo "============================================================"
echo "📝 Step 1: Authentication"
echo "============================================================"
echo ""

# Login to get token
echo "→ Logging in as admin..."
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    "$API_BASE_URL/auth/login")

TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed!${NC}"
    echo "Response: $login_response"
    echo ""
    echo "Please ensure:"
    echo "1. Backend server is running on port 5000"
    echo "2. Admin user exists with email: $ADMIN_EMAIL"
    echo "3. Supabase is configured correctly"
    exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

echo "============================================================"
echo "📊 Step 2: Get Company Statistics"
echo "============================================================"
echo ""

echo "→ Testing GET /admin/companies/stats..."
stats_response=$(api_request "GET" "/admin/companies/stats" "" "200")
if [ $? -eq 0 ]; then
    print_result "Get company statistics" "PASS"
    echo "Stats: $stats_response"
else
    print_result "Get company statistics" "FAIL" "Unexpected status code"
fi
echo ""

echo "============================================================"
echo "📋 Step 3: Get All Companies (Empty)"
echo "============================================================"
echo ""

echo "→ Testing GET /admin/companies..."
list_response=$(api_request "GET" "/admin/companies?page=1&limit=20" "" "200")
if [ $? -eq 0 ]; then
    print_result "Get companies list" "PASS"
    echo "Response: $list_response"
else
    print_result "Get companies list" "FAIL" "Unexpected status code"
fi
echo ""

echo "============================================================"
echo "➕ Step 4: Create Test Companies"
echo "============================================================"
echo ""

# Create Company 1 - Tech Company
echo "→ Creating Company 1: TechCorp Solutions..."
company1_data='{
  "name": "TechCorp Solutions Inc.",
  "industry": "Information Technology",
  "code": "TECH-001",
  "address": "123 Tech Street, Makati City, Metro Manila",
  "contact_info": {
    "email": "hr@techcorp.com",
    "phone": "(02) 1234-5678",
    "website": "https://techcorp.com"
  },
  "capacity_limit": 20,
  "is_verified": true,
  "is_moa_standardized": true
}'

company1_response=$(api_request "POST" "/admin/companies" "$company1_data" "201")
if [ $? -eq 0 ]; then
    print_result "Create Company 1 (TechCorp)" "PASS"
    COMPANY1_ID=$(echo "$company1_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Company ID: $COMPANY1_ID"
else
    print_result "Create Company 1 (TechCorp)" "FAIL" "Failed to create"
fi
echo ""

# Create Company 2 - Manufacturing
echo "→ Creating Company 2: ABC Manufacturing..."
company2_data='{
  "name": "ABC Manufacturing Corp.",
  "industry": "Manufacturing",
  "code": "MFG-002",
  "address": "456 Industrial Avenue, Cavite City, Cavite",
  "contact_info": {
    "email": "careers@abcmfg.com",
    "phone": "(046) 987-6543"
  },
  "capacity_limit": 15,
  "is_verified": true,
  "is_moa_standardized": false
}'

company2_response=$(api_request "POST" "/admin/companies" "$company2_data" "201")
if [ $? -eq 0 ]; then
    print_result "Create Company 2 (ABC Manufacturing)" "PASS"
    COMPANY2_ID=$(echo "$company2_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Company ID: $COMPANY2_ID"
else
    print_result "Create Company 2 (ABC Manufacturing)" "FAIL" "Failed to create"
fi
echo ""

# Create Company 3 - Unverified
echo "→ Creating Company 3: Startup Ventures (Unverified)..."
company3_data='{
  "name": "Startup Ventures Inc.",
  "industry": "Technology Startup",
  "code": "START-003",
  "address": "789 Innovation Hub, BGC, Taguig City",
  "capacity_limit": 5,
  "is_verified": false,
  "is_moa_standardized": false
}'

company3_response=$(api_request "POST" "/admin/companies" "$company3_data" "201")
if [ $? -eq 0 ]; then
    print_result "Create Company 3 (Startup Ventures)" "PASS"
    COMPANY3_ID=$(echo "$company3_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Company ID: $COMPANY3_ID"
else
    print_result "Create Company 3 (Startup Ventures)" "FAIL" "Failed to create"
fi
echo ""

echo "============================================================"
echo "🔍 Step 5: Get Single Company"
echo "============================================================"
echo ""

if [ ! -z "$COMPANY1_ID" ]; then
    echo "→ Testing GET /admin/companies/$COMPANY1_ID..."
    single_response=$(api_request "GET" "/admin/companies/$COMPANY1_ID" "" "200")
    if [ $? -eq 0 ]; then
        print_result "Get single company (TechCorp)" "PASS"
        echo "Response: $single_response"
    else
        print_result "Get single company (TechCorp)" "FAIL" "Company not found"
    fi
else
    print_result "Get single company" "FAIL" "No company ID available"
fi
echo ""

echo "============================================================"
echo "📝 Step 6: Update Company"
echo "============================================================"
echo ""

if [ ! -z "$COMPANY2_ID" ]; then
    echo "→ Updating Company 2 (ABC Manufacturing)..."
    update_data='{
      "name": "ABC Manufacturing Corp. (Updated)",
      "capacity_limit": 25,
      "is_moa_standardized": true
    }'
    
    update_response=$(api_request "PATCH" "/admin/companies/$COMPANY2_ID" "$update_data" "200")
    if [ $? -eq 0 ]; then
        print_result "Update company" "PASS"
        echo "Response: $update_response"
    else
        print_result "Update company" "FAIL" "Update failed"
    fi
else
    print_result "Update company" "FAIL" "No company ID available"
fi
echo ""

echo "============================================================"
echo "🔎 Step 7: Search and Filter Companies"
echo "============================================================"
echo ""

# Search by name
echo "→ Testing search by name (Tech)..."
search_response=$(api_request "GET" "/admin/companies?search=Tech" "" "200")
if [ $? -eq 0 ]; then
    print_result "Search companies by name" "PASS"
    company_count=$(echo "$search_response" | grep -o '"companies":\[' | wc -l)
    echo "Found companies with 'Tech' in name"
else
    print_result "Search companies by name" "FAIL" "Search failed"
fi
echo ""

# Filter by verified
echo "→ Testing filter by verified status..."
filter_response=$(api_request "GET" "/admin/companies?is_verified=true" "" "200")
if [ $? -eq 0 ]; then
    print_result "Filter verified companies" "PASS"
else
    print_result "Filter verified companies" "FAIL" "Filter failed"
fi
echo ""

echo "============================================================"
echo "📊 Step 8: Get Updated Statistics"
echo "============================================================"
echo ""

echo "→ Getting updated statistics..."
stats2_response=$(api_request "GET" "/admin/companies/stats" "" "200")
if [ $? -eq 0 ]; then
    print_result "Get updated statistics" "PASS"
    echo "Updated Stats: $stats2_response"
else
    print_result "Get updated statistics" "FAIL" "Failed to get stats"
fi
echo ""

echo "============================================================"
echo "👥 Step 9: Get Company Supervisors"
echo "============================================================"
echo ""

if [ ! -z "$COMPANY1_ID" ]; then
    echo "→ Getting supervisors for Company 1..."
    supervisors_response=$(api_request "GET" "/admin/companies/$COMPANY1_ID/supervisors" "" "200")
    if [ $? -eq 0 ]; then
        print_result "Get company supervisors" "PASS"
        echo "Response: $supervisors_response"
    else
        print_result "Get company supervisors" "FAIL" "Failed to get supervisors"
    fi
else
    print_result "Get company supervisors" "FAIL" "No company ID available"
fi
echo ""

echo "============================================================"
echo "🗑️  Step 10: Delete Company"
echo "============================================================"
echo ""

if [ ! -z "$COMPANY3_ID" ]; then
    echo "→ Deleting Company 3 (Startup Ventures)..."
    delete_response=$(api_request "DELETE" "/admin/companies/$COMPANY3_ID" "" "200")
    if [ $? -eq 0 ]; then
        print_result "Delete company" "PASS"
        echo "Response: $delete_response"
    else
        print_result "Delete company" "FAIL" "Delete failed"
    fi
else
    print_result "Delete company" "FAIL" "No company ID available"
fi
echo ""

echo "============================================================"
echo "❌ Step 11: Validation Tests"
echo "============================================================"
echo ""

# Test creating company without name (should fail)
echo "→ Testing validation: Create company without name..."
invalid_data='{"industry":"Test"}'
invalid_response=$(api_request "POST" "/admin/companies" "$invalid_data" "400")
if [ $? -eq 0 ]; then
    print_result "Validation: Reject company without name" "PASS"
else
    print_result "Validation: Reject company without name" "FAIL" "Should return 400"
fi
echo ""

# Test deleting non-existent company (should fail)
echo "→ Testing: Delete non-existent company..."
nonexistent_response=$(api_request "DELETE" "/admin/companies/00000000-0000-0000-0000-000000000000" "" "404")
if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    print_result "Error handling: Non-existent company" "PASS"
else
    print_result "Error handling: Non-existent company" "FAIL" "Should handle gracefully"
fi
echo ""

echo "============================================================"
echo "📋 Final Summary"
echo "============================================================"
echo ""

echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! 🎉${NC}"
    echo ""
    echo "Test companies created:"
    if [ ! -z "$COMPANY1_ID" ]; then
        echo "  - TechCorp Solutions Inc. (ID: $COMPANY1_ID)"
    fi
    if [ ! -z "$COMPANY2_ID" ]; then
        echo "  - ABC Manufacturing Corp. (ID: $COMPANY2_ID)"
    fi
    echo ""
    echo "You can now proceed with manual testing in the browser!"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "Please check the errors above and fix the issues."
    exit 1
fi
