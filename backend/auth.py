from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, Role, Permission

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """Decode token and return DB User instance."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception

        result = await db.execute(
            select(User).where(User.id == int(user_id)).options(selectinload(User.roles))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # ADMIN superuser bypass
        user_role_names = [r.name for r in getattr(current_user, 'roles', [])]
        # fallback to legacy single-role field if association not used
        legacy_role = getattr(current_user, 'role', None)
        if legacy_role:
            if hasattr(legacy_role, 'value'):
                legacy_val = legacy_role.value
            else:
                legacy_val = str(legacy_role).lower()
            if legacy_val not in user_role_names:
                user_role_names.append(legacy_val)

        if 'admin' in user_role_names:
            return current_user
        for allowed in allowed_roles:
            if allowed in user_role_names:
                return current_user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted")

    return role_checker


def require_permissions(required_permissions: List[str]):
    async def perm_checker(current_user: User = Depends(get_current_user)):
        # ADMIN bypass, include legacy role fallback
        user_role_names = [r.name for r in getattr(current_user, 'roles', [])]
        legacy_role = getattr(current_user, 'role', None)
        if legacy_role:
            if hasattr(legacy_role, 'value'):
                legacy_val = legacy_role.value
            else:
                legacy_val = str(legacy_role).lower()
            if legacy_val not in user_role_names:
                user_role_names.append(legacy_val)

        if 'admin' in user_role_names:
            return current_user

        user_permissions = set()
        for role in getattr(current_user, 'roles', []):
            for p in getattr(role, 'permissions', []):
                user_permissions.add(p.name)

        for rp in required_permissions:
            if rp not in user_permissions:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing required permission")
        return current_user

    return perm_checker


# Backwards-compatible alias used in server.py
def require_role(allowed_roles: List[str]):
    return require_roles(allowed_roles)
