from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.models.project_field import ProjectField
import json

router = APIRouter(prefix="/driver", tags=["Driver Forms"])

@router.get("/projects/{project_id}/form")
async def get_driver_form(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectField).where(ProjectField.project_id == project_id)
    )
    fields = result.scalars().all()

    # JSON-safe response
    response = []
    for f in fields:
        response.append({
            "id": f.id,
            "field_name": f.field_name,
            "field_type": f.field_type,
            "required": f.required,
            "options": json.loads(f.options) if f.options else []
        })
    return response
