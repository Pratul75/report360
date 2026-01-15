#!/bin/bash

# Test Admin CRUD Operations
# This tests that Admin has FULL CRUD on all modules

API_URL="http://localhost:8001/api/v1"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔐 ADMIN CRUD TEST"
echo "=========================================="
echo ""

# Step 1: Login as Admin
echo "📝 Step 1: Login as Admin"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fleet.com", "password": "Admin@2026"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Function to test CRUD
test_crud() {
  local MODULE=$1
  local ENDPOINT=$2
  local CREATE_DATA=$3
  local UPDATE_DATA=$4
  
  echo "----------------------------------------"
  echo "Testing: $MODULE"
  echo "----------------------------------------"
  
  # CREATE
  echo -n "  CREATE... "
  CREATE_RESPONSE=$(curl -s -X POST "$API_URL/$ENDPOINT" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_DATA")
  
  CREATE_STATUS=$(echo $CREATE_RESPONSE | jq -r '.id // "error"')
  
  if [ "$CREATE_STATUS" = "error" ]; then
    echo -e "${RED}❌ FAILED${NC}"
    echo "    Response: $CREATE_RESPONSE"
    return 1
  else
    ITEM_ID=$CREATE_STATUS
    echo -e "${GREEN}✅ OK (ID: $ITEM_ID)${NC}"
  fi
  
  # READ
  echo -n "  READ... "
  READ_RESPONSE=$(curl -s -X GET "$API_URL/$ENDPOINT/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  READ_STATUS=$(echo $READ_RESPONSE | jq -r '.id // "error"')
  
  if [ "$READ_STATUS" = "error" ]; then
    echo -e "${RED}❌ FAILED${NC}"
    echo "    Response: $READ_RESPONSE"
    return 1
  else
    echo -e "${GREEN}✅ OK${NC}"
  fi
  
  # UPDATE
  echo -n "  UPDATE... "
  UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/$ENDPOINT/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA")
  
  UPDATE_STATUS=$(echo $UPDATE_RESPONSE | jq -r '.id // "error"')
  
  if [ "$UPDATE_STATUS" = "error" ]; then
    echo -e "${RED}❌ FAILED (404 or Method Not Found?)${NC}"
    echo "    Response: $UPDATE_RESPONSE"
    return 1
  else
    echo -e "${GREEN}✅ OK${NC}"
  fi
  
  # DELETE
  echo -n "  DELETE... "
  DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/$ENDPOINT/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  DELETE_STATUS=$(echo "$DELETE_RESPONSE" | tail -n1)
  
  if [ "$DELETE_STATUS" = "204" ] || [ "$DELETE_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
  else
    echo -e "${RED}❌ FAILED (HTTP $DELETE_STATUS)${NC}"
    echo "    Response: $(echo "$DELETE_RESPONSE" | head -n -1)"
    return 1
  fi
  
  echo ""
  return 0
}

# Test all modules
PASSED=0
FAILED=0

# Generate random ID for unique keys
RAND_ID=$RANDOM

# Clients
test_crud "CLIENTS" "clients" \
  '{"name": "Test Client", "email": "test@client.com", "phone": "1234567890", "address": "Test Address"}' \
  '{"name": "Updated Client"}' && ((PASSED++)) || ((FAILED++))

# Projects
test_crud "PROJECTS" "projects" \
  '{"name": "Test Project", "client_id": 1, "start_date": "2024-01-01", "end_date": "2024-12-31", "budget": 10000}' \
  '{"name": "Updated Project"}' && ((PASSED++)) || ((FAILED++))

# Campaigns
test_crud "CAMPAIGNS" "campaigns" \
  '{"name": "Test Campaign", "project_id": 1, "start_date": "2024-01-01", "end_date": "2024-12-31", "campaign_type": "btl", "location": "Test Location"}' \
  '{"name": "Updated Campaign"}' && ((PASSED++)) || ((FAILED++))

# Drivers
test_crud "DRIVERS" "drivers" \
  '{"name": "Test Driver", "license_number": "DL'$RAND_ID'", "phone": "1234567890", "email": "driver'$RAND_ID'@test.com"}' \
  '{"name": "Updated Driver"}' && ((PASSED++)) || ((FAILED++))

# Vehicles
test_crud "VEHICLES" "vehicles" \
  '{"vehicle_number": "VEH'$RAND_ID'", "model": "Test Model", "capacity": "10", "vehicle_type": "Van"}' \
  '{"model": "Updated Model"}' && ((PASSED++)) || ((FAILED++))

# Vendors
test_crud "VENDORS" "vendors" \
  '{"name": "Test Vendor", "email": "vendor'$RAND_ID'@test.com", "phone": "1234567890", "address": "Test Address"}' \
  '{"name": "Updated Vendor"}' && ((PASSED++)) || ((FAILED++))

# Expenses
test_crud "EXPENSES" "expenses" \
  '{"campaign_id": 1, "amount": 1000, "expense_type": "fuel", "description": "Test expense"}' \
  '{"description": "Updated expense"}' && ((PASSED++)) || ((FAILED++))

# Reports
test_crud "REPORTS" "reports" \
  '{"campaign_id": 1, "report_date": "2024-01-15", "content": "Test report content"}' \
  '{"content": "Updated content"}' && ((PASSED++)) || ((FAILED++))

echo "=========================================="
echo "📊 RESULTS"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL ADMIN CRUD TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi
