#!/bin/bash

# Godown Inventory Module - Quick Test Script
# This script tests the main functionality of the godown inventory module

set -e

API_URL="http://localhost:8001/api/v1"
TOKEN_FILE="/tmp/test_token.txt"

echo "======================================"
echo "Godown Inventory Module - Test Suite"
echo "======================================"
echo ""

# Function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo "✓ $2"
    else
        echo "✗ $2 (Exit code: $1)"
    fi
}

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s "$API_URL/../health" | jq '.' 2>/dev/null && test_result 0 "Health check passed" || test_result 1 "Health check failed"
echo ""

# Test 2: Get Godowns (should fail without token)
echo "Test 2: Get Godowns without token (should fail)"
curl -s "$API_URL/godowns" 2>/dev/null | jq '.' | grep -q "detail" && test_result 0 "Correctly rejected unauthorized request" || test_result 1 "Should reject unauthorized request"
echo ""

# Test 3: Check if godowns table exists (via backend logs)
echo "Test 3: Verify Database Tables"
docker compose logs backend 2>&1 | grep -q "Database tables created successfully" && test_result 0 "Database tables created" || test_result 1 "Database tables creation failed"
echo ""

# Test 4: Check if routes are registered
echo "Test 4: Check Route Registration"
docker compose logs backend 2>&1 | grep -q "application startup complete" && test_result 0 "Application started successfully" || test_result 1 "Application startup failed"
echo ""

# Test 5: Verify File Structure
echo "Test 5: Verify File Structure"
files_to_check=(
    "backend/app/models/godown.py"
    "backend/app/schemas/godown.py"
    "backend/app/repositories/godown_repo.py"
    "backend/app/services/godown_service.py"
    "backend/app/api/v1/godowns.py"
    "frontend/src/pages/Godowns.js"
    "frontend/src/pages/GodownInventory.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (NOT FOUND)"
    fi
done
echo ""

# Test 6: Check Permission Configuration
echo "Test 6: Check Permission Configuration"
if grep -q "GODOWN_CREATE\|GODOWN_READ\|GODOWN_UPDATE\|GODOWN_DELETE" backend/app/core/role_permissions.py 2>/dev/null; then
    test_result 0 "Godown permissions configured"
else
    test_result 1 "Godown permissions NOT configured"
fi

if grep -q "INVENTORY_CREATE\|INVENTORY_READ\|INVENTORY_UPDATE\|INVENTORY_DELETE" backend/app/core/role_permissions.py 2>/dev/null; then
    test_result 0 "Inventory permissions configured"
else
    test_result 1 "Inventory permissions NOT configured"
fi
echo ""

# Test 7: Check godown_manager role
echo "Test 7: Check godown_manager Role Configuration"
if grep -q "godown_manager" backend/app/core/role_permissions.py 2>/dev/null; then
    test_result 0 "godown_manager role configured"
else
    test_result 1 "godown_manager role NOT configured"
fi
echo ""

# Test 8: Check Frontend Routes
echo "Test 8: Check Frontend Route Configuration"
if grep -q "godown-inventory" frontend/src/App.js 2>/dev/null; then
    test_result 0 "Frontend routes configured"
else
    test_result 1 "Frontend routes NOT configured"
fi
echo ""

# Test 9: Check Menu Integration
echo "Test 9: Check Menu Integration"
if grep -q "Godown Inventory" frontend/src/components/Layout.js 2>/dev/null; then
    test_result 0 "Menu item integrated"
else
    test_result 1 "Menu item NOT integrated"
fi
echo ""

# Test 10: Frontend Build Check
echo "Test 10: Frontend Build Status"
if [ -d "frontend/build" ]; then
    test_result 0 "Frontend build exists"
else
    test_result 1 "Frontend build does not exist"
fi
echo ""

echo "======================================"
echo "Test Suite Complete"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Start the application: docker compose up"
echo "2. Login as admin or godown_manager user"
echo "3. Verify 'Godown Inventory' menu item appears"
echo "4. Test create/read/update/delete operations"
echo "5. Check low stock alerts functionality"
echo ""
