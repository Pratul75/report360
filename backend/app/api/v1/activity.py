from fastapi import APIRouter, Request, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.activity import Activity
import uuid, os

router = APIRouter(prefix="/activities", tags=["Activities"])

UPLOAD_DIR = "uploads/activities"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def save_activity(
    request: Request,
    photo: UploadFile = File(None),
    db: AsyncSession = Depends(get_db)
):
    form = await request.form()
    data = dict(form)

    # SAFE extraction (never crash)
    project_id = int(data.pop("project_id", 0))
    campaign_id = int(data.pop("campaign_id", 0))
    latitude = float(data.pop("latitude", 0))
    longitude = float(data.pop("longitude", 0))
    location_address = data.pop("location_address", None)

    # Photo handling
    photo_path = None
    if photo:
        filename = f"{uuid.uuid4()}.jpg"
        photo_path = f"{UPLOAD_DIR}/{filename}"
        with open(photo_path, "wb") as f:
            f.write(await photo.read())

    # Remaining dynamic fields
    payload = data

    activity = Activity(
        project_id=project_id,
        campaign_id=campaign_id,
        latitude=latitude,
        longitude=longitude,
        location_address=location_address,
        payload=payload,
        photo_path=photo_path
    )

    db.add(activity)
    await db.commit()

    return {
        "status": "success",
        "project_id": project_id,
        "campaign_id": campaign_id,
        "payload": payload,
        "photo": photo_path
    }
