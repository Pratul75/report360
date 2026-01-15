#!/bin/bash

echo "🔧 Setting up Godown Manager Test Users..."
echo ""

# Create test users using backend API
# We'll create test accounts and assign them godown_manager role

docker compose exec -T backend bash << 'BASH_SCRIPT'
python3 << 'PYTHON_SCRIPT'
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.models import Base, User
from sqlalchemy import text

async def setup():
    """Setup godown_manager users in database"""
    try:
        # Create async engine
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with AsyncSessionLocal() as session:
            # Check existing users
            result = await session.execute(text('SELECT DISTINCT role FROM users ORDER BY role'))
            roles = [row[0] for row in result.fetchall()]
            print(f"✓ Database connected! Roles found: {roles}")
            
            # Check godown_manager count
            result = await session.execute(text('SELECT COUNT(*) FROM users WHERE role = "godown_manager"'))
            count = result.scalar()
            print(f"  Current godown_manager users: {count}")
            
            if count == 0:
                print("\n  Creating test godown_manager users...")
                
                # Create godown_manager test user (using correct column names)
                insert_sql = text('''
                    INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
                    VALUES 
                    (:name, :email, :pwd_hash, :role, NOW(), NOW())
                ''')
                
                await session.execute(insert_sql, {
                    'name': 'Godown Manager',
                    'email': 'godown_mgr@test.com',
                    'pwd_hash': '$2b$12$placeholder_hash_for_testing_only_password123',
                    'role': 'godown_manager'
                })
                print("    ✓ Created: Godown Manager (godown_manager role)")
                
                await session.commit()
                
                # Verify
                result = await session.execute(text('SELECT COUNT(*) FROM users WHERE role = "godown_manager"'))
                final_count = result.scalar()
                print(f"\n  ✓ Final godown_manager users: {final_count}")
            else:
                print(f"\n  ✓ godown_manager users already exist! ({count})")
            
            # Show all godown_manager users
            result = await session.execute(text('SELECT id, name, email, role FROM users WHERE role = "godown_manager"'))
            gm_users = result.fetchall()
            if gm_users:
                print(f"\n  Godown Manager Users:")
                for user in gm_users:
                    print(f"    - {user[1]} ({user[2]}) [ID: {user[0]}]")
        
        await engine.dispose()
        print("\n✓ Setup complete!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Run async function
asyncio.run(setup())
PYTHON_SCRIPT
BASH_SCRIPT

echo ""
echo "Testing godown_manager access..."
echo "1. Login with godown_manager_1 / password123"
echo "2. Check if 'Godown Inventory' menu appears"
echo "3. Should have full CRUD access"
