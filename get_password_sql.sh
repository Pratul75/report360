#!/bin/bash
# Quick Password Update Helper
# This generates the SQL command you can run directly in MySQL

if [ $# -ne 2 ]; then
    echo "Usage: $0 <email> <new_password>"
    echo ""
    echo "This will generate SQL command that you can copy-paste in MySQL"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"

# Generate hash
HASH=$(docker exec fleet_backend python -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt']); print(pwd_context.hash('$PASSWORD'))" 2>/dev/null)

echo "════════════════════════════════════════════════════════════════"
echo "Copy-paste this SQL command in MySQL:"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "UPDATE users"
echo "SET password_hash = '$HASH',"
echo "    password_hint = '$PASSWORD'"
echo "WHERE email = '$EMAIL';"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Or run this complete command:"
echo "────────────────────────────────────────────────────────────────"
echo "docker exec fleet_mysql mysql -u root -psecretpassword fleet_operations -e \\"
echo "\"UPDATE users SET password_hash='$HASH', password_hint='$PASSWORD' WHERE email='$EMAIL';\""
echo ""
