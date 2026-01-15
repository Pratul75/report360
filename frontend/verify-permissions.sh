#!/bin/bash

# Permission Hook Audit - Verification Script
# Verifies that all files using hasPermission have proper imports AND calls

echo "🔍 PERMISSION HOOK AUDIT - VERIFICATION"
echo "========================================"
echo ""

# Count files with hasPermission
FILES_USING_PERMISSION=$(find src/pages -name "*.js" -exec grep -l "hasPermission" {} \; | wc -l)
echo "Files using hasPermission(): $FILES_USING_PERMISSION"

# Count files importing usePermissions
FILES_IMPORTING_HOOK=$(find src/pages -name "*.js" -exec grep -l "import.*usePermissions" {} \; | wc -l)
echo "Files importing usePermissions: $FILES_IMPORTING_HOOK"

echo ""

# Check 1: Find files using hasPermission but not importing usePermissions
echo "🔎 CHECK 1: Missing imports..."
MISSING_IMPORTS=0

for file in $(find src/pages -name "*.js" -exec grep -l "hasPermission" {} \;); do
    if ! grep -q "import.*usePermissions" "$file"; then
        echo "❌ MISSING IMPORT: $file"
        MISSING_IMPORTS=$((MISSING_IMPORTS + 1))
    fi
done

if [ $MISSING_IMPORTS -eq 0 ]; then
    echo "✅ All files have proper imports!"
else
    echo "❌ Found $MISSING_IMPORTS file(s) with missing imports"
    exit 1
fi

echo ""

# Check 2: Find files importing but not calling usePermissions()
echo "🔎 CHECK 2: Hook not called (imported but unused)..."
MISSING_CALLS=0

for file in $(find src/pages -name "*.js" -exec grep -l "hasPermission" {} \;); do
    if ! grep -q "usePermissions()" "$file"; then
        echo "❌ HOOK NOT CALLED: $file"
        echo "   Fix: Add 'const { hasPermission } = usePermissions();'"
        MISSING_CALLS=$((MISSING_CALLS + 1))
    fi
done

if [ $MISSING_CALLS -eq 0 ]; then
    echo "✅ All files call the hook properly!"
else
    echo "❌ Found $MISSING_CALLS file(s) not calling usePermissions()"
    exit 1
fi

echo ""
echo "📋 Files with permission checks:"
find src/pages -name "*.js" -exec grep -l "hasPermission" {} \; | sed 's|src/pages/||' | sort

echo ""
echo "✅ All verification checks passed!"
echo "All permission checks are properly implemented."
