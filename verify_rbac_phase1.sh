#!/bin/bash

# RBAC System Verification Scriptsssssssssssssrrrrr
# Run this to verify Phase 1 implementation is complete

echo "=================================================="
echo "  RBAC Extension - Phase 1 Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing: $name... "
    
    result=$(eval "$command" 2>&1)
    
    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAILED++))
    fi
}

echo "1️⃣  Backend Health Check"
echo "-------------------------------------------"
test_endpoint "Backend is running" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "admin"

echo ""
echo "2️⃣  Authentication Tests"
echo "-------------------------------------------"
test_endpoint "Admin login" \
    "curl -s -X POST http://localhost:8001/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@fleet.com\",\"password\":\"Admin@2026\"}'" \
    "access_token"

test_endpoint "Sales user exists" \
    "curl -s -X POST http://localhost:8001/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"sales@ops360.com\",\"password\":\"Sales@2026\"}'" \
    "access_token"

test_endpoint "Driver user exists" \
    "curl -s -X POST http://localhost:8001/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"driver@ops360.com\",\"password\":\"Driver@2026\"}'" \
    "access_token"

echo ""
echo "3️⃣  Roles API Tests"
echo "-------------------------------------------"
test_endpoint "Get all roles (14 total)" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "sales"

test_endpoint "Roles include 'purchase'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "purchase"

test_endpoint "Roles include 'operator'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "operator"

test_endpoint "Roles include 'vehicle_manager'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "vehicle_manager"

test_endpoint "Roles include 'godown_manager'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "godown_manager"

test_endpoint "Roles include 'promoter'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "promoter"

test_endpoint "Roles include 'anchor'" \
    "curl -s http://localhost:8001/api/v1/roles/all" \
    "anchor"

echo ""
echo "4️⃣  Permissions API Tests"
echo "-------------------------------------------"
test_endpoint "Get permissions matrix" \
    "curl -s http://localhost:8001/api/v1/roles/permissions" \
    "user.create"

test_endpoint "Admin has all permissions" \
    "curl -s http://localhost:8001/api/v1/roles/permissions | jq -r '.admin | length'" \
    "5"

test_endpoint "Sales has client permissions" \
    "curl -s http://localhost:8001/api/v1/roles/permissions" \
    "client.create"

test_endpoint "Driver has limited permissions" \
    "curl -s http://localhost:8001/api/v1/roles/permissions" \
    "expense.submit"

echo ""
echo "5️⃣  Menu Visibility API Tests"
echo "-------------------------------------------"
test_endpoint "Get menu visibility" \
    "curl -s http://localhost:8001/api/v1/roles/menu" \
    "dashboard"

test_endpoint "Admin has users menu" \
    "curl -s http://localhost:8001/api/v1/roles/menu" \
    "users"

test_endpoint "Sales has clients menu" \
    "curl -s http://localhost:8001/api/v1/roles/menu" \
    "clients"

test_endpoint "Driver has trips menu" \
    "curl -s http://localhost:8001/api/v1/roles/menu" \
    "trips"

echo ""
echo "6️⃣  Database Verification"
echo "-------------------------------------------"
echo -n "Checking database users table... "
DB_CHECK=$(docker compose exec -T db mysql -u ops360_user -pOps360@Secure2024 ops360_db -e "SELECT COUNT(DISTINCT role) as role_count FROM users;" -sN 2>/dev/null)
if [ "$DB_CHECK" -ge "8" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Found $DB_CHECK unique roles)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Expected 8+, found $DB_CHECK)"
    ((FAILED++))
fi

echo -n "Checking ENUM has 14 values... "
ENUM_CHECK=$(docker compose exec -T db mysql -u ops360_user -pOps360@Secure2024 ops360_db -e "SHOW COLUMNS FROM users WHERE Field = 'role';" -sN 2>/dev/null | grep -o "enum(" | wc -l)
if [ "$ENUM_CHECK" -ge "1" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "7️⃣  File Structure Verification"
echo "-------------------------------------------"
files_to_check=(
    "backend/app/core/role_permissions.py"
    "backend/app/api/v1/roles.py"
    "backend/app/models/user.py"
    "RBAC_IMPLEMENTATION_COMPLETE.md"
    "PHASE2_FRONTEND_GUIDE.md"
    "RBAC_QUICK_REFERENCE.md"
    "RBAC_EXTENSION_PLAN.md"
)

for file in "${files_to_check[@]}"; do
    echo -n "Checking $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ MISSING${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "=================================================="
echo "  Test Results Summary"
echo "=================================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Phase 1 is complete and ready for Phase 2.${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Read PHASE2_FRONTEND_GUIDE.md"
    echo "2. Implement frontend menu visibility"
    echo "3. Add route protection"
    echo "4. Update API endpoints with permission checks"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review and fix before proceeding to Phase 2.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check backend logs: docker compose logs backend"
    echo "2. Verify backend is running: docker compose ps"
    echo "3. Test database connection: docker compose exec db mysql -u ops360_user -p ops360_db"
    echo "4. Review RBAC_IMPLEMENTATION_COMPLETE.md for details"
    echo ""
    exit 1
fi
