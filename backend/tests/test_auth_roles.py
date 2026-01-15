import asyncio
import pytest
from sqlalchemy import text
from database import AsyncSessionLocal, engine
from models import Role, User
from auth import create_access_token, get_current_user, get_password_hash

@pytest.mark.asyncio
async def test_get_current_user_includes_roles():
    async with AsyncSessionLocal() as session:
        # create a test role
        role = Role(name='qa_role', description='QA role')
        session.add(role)
        await session.commit()
        await session.refresh(role)

        # create a test user
        pw = get_password_hash('testpass')
        user = User(email='testuser+qa@example.com', name='QA User', password_hash=pw, role='client', is_active=True)
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # associate role (insert directly to avoid lazy-load issues)
        await session.execute(
            text('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (:uid, :rid)'),
            {'uid': user.id, 'rid': role.id}
        )
        await session.commit()

        # create token and call get_current_user
        token = create_access_token({'user_id': user.id, 'email': user.email})
        returned = await get_current_user(token=token, db=session)

        # assert the returned user has the role attached
        role_names = [r.name for r in getattr(returned, 'roles', [])]
        assert 'qa_role' in role_names
