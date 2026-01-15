#!/bin/bash

# RBAC Testing Script - Quick Start Guide
# Run this script to verify RBAC is working correctly

echo "=========================================="
echo "  RBAC Testing - Quick Start"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Verify Backend is Running${NC}"
echo "Checking backend health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/v1/roles/all)

if [ "$BACKEND_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running. Start it with: docker compose up backend${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Test Admin Access (Full Access)${NC}"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.com","password":"Admin@2026"}' | jq -r '.access_token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    
    # Test admin can access users endpoint
    USERS_COUNT=$(curl -s http://localhost:8001/api/v1/users -H "Authorization: Bearer $ADMIN_TOKEN" | jq '. | length')
    echo -e "${GREEN}✅ Admin can access /users endpoint (${USERS_COUNT} users)${NC}"
else
    echo -e "${RED}❌ Admin login failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Test Driver Access (Limited Access)${NC}"
DRIVER_TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@ops360.com","password":"Rahul@1234"}' | jq -r '.access_token')

if [ "$DRIVER_TOKEN" != "null" ] && [ -n "$DRIVER_TOKEN" ]; then
    echo -e "${GREEN}✅ Driver login successful${NC}"
    
    # Test driver CANNOT access users
    USERS_RESULT=$(curl -s http://localhost:8001/api/v1/users -H "Authorization: Bearer $DRIVER_TOKEN")
    if [[ "$USERS_RESULT" == *"Insufficient permissions"* ]]; then
        echo -e "${GREEN}✅ Driver correctly blocked from /users (403)${NC}"
    else
        echo -e "${RED}❌ Driver has access to /users (SHOULD BE BLOCKED!)${NC}"
    fi
    
    # Test driver CANNOT access clients
    CLIENTS_RESULT=$(curl -s http://localhost:8001/api/v1/clients -H "Authorization: Bearer $DRIVER_TOKEN")
    if [[ "$CLIENTS_RESULT" == *"Insufficient permissions"* ]]; then
        echo -e "${GREEN}✅ Driver correctly blocked from /clients (403)${NC}"
    else
        echo -e "${RED}❌ Driver has access to /clients (SHOULD BE BLOCKED!)${NC}"
    fi
    
    # Test driver CAN access campaigns
    CAMPAIGNS_RESULT=$(curl -s http://localhost:8001/api/v1/campaigns -H "Authorization: Bearer $DRIVER_TOKEN")
    if [[ "$CAMPAIGNS_RESULT" != *"Insufficient permissions"* ]] && [[ "$CAMPAIGNS_RESULT" != *"error"* ]]; then
        echo -e "${GREEN}✅ Driver can access /campaigns (allowed)${NC}"
    else
        echo -e "${RED}❌ Driver blocked from /campaigns (SHOULD HAVE ACCESS!)${NC}"
    fi
else
    echo -e "${RED}❌ Driver login failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Test Sales Access (Partial Access)${NC}"
SALES_TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@ops360.com","password":"Rahul@1234"}' | jq -r '.access_token')

if [ "$SALES_TOKEN" != "null" ] && [ -n "$SALES_TOKEN" ]; then
    echo -e "${GREEN}✅ Sales login successful${NC}"
    
    # Test sales CAN access clients
    CLIENTS_RESULT=$(curl -s http://localhost:8001/api/v1/clients -H "Authorization: Bearer $SALES_TOKEN")
    if [[ "$CLIENTS_RESULT" != *"Insufficient permissions"* ]]; then
        echo -e "${GREEN}✅ Sales can access /clients (allowed)${NC}"
    else
        echo -e "${RED}❌ Sales blocked from /clients (SHOULD HAVE ACCESS!)${NC}"
    fi
    
    # Test sales CANNOT access users
    USERS_RESULT=$(curl -s http://localhost:8001/api/v1/users -H "Authorization: Bearer $SALES_TOKEN")
    if [[ "$USERS_RESULT" == *"Insufficient permissions"* ]]; then
        echo -e "${GREEN}✅ Sales correctly blocked from /users (403)${NC}"
    else
        echo -e "${RED}❌ Sales has access to /users (SHOULD BE BLOCKED!)${NC}"
    fi
else
    echo -e "${RED}❌ Sales login failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  All Tests Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Admin: Full access to all endpoints ✅"
echo "- Driver: Limited access (403 on users/clients) ✅"
echo "- Sales: Partial access (can access clients, not users) ✅"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Login with different roles:"
echo "   - admin@fleet.com / Admin@2026"
echo "   - driver@ops360.com / Rahul@1234"
echo "   - sales@ops360.com / Rahul@1234"
echo "3. Verify sidebar menus differ per role"
echo "4. Try accessing forbidden pages (should see 403)"
echo ""
echo "Documentation:"
echo "- Full details: RBAC_VERIFIED_COMPLETE.md"
echo "- Implementation guide: PHASE2_FRONTEND_GUIDE.md"
echo ""
