#!/bin/bash

# Quick test for update endpoint
echo "Testing Update Company endpoint..."

# Get auth token
read -p "Enter admin email: " email
read -sp "Enter password: " password
echo ""

login_response=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}")

TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Logged in"

# Use existing company ID from your DB
COMPANY_ID="319cd18b-ff69-45e1-bdba-ccbdeb4e1204"

echo "Testing PATCH /admin/companies/$COMPANY_ID"

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH \
  http://localhost:5000/api/admin/companies/$COMPANY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Manufacturing Corp. (Updated)",
    "capacity_limit": 25,
    "is_moa_standardized": true
  }')

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "Status: $http_status"
echo "Response: $body"
