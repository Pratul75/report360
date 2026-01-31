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

    # 🔥 IMPORTANT: convert properly
    data = {}
    for key, value in form.items():
        if key != "photo":
            data[key] = value

    print("FINAL DATA:", data)  # debug ke liye

    project_id = int(data.pop("project_id"))
    campaign_id = int(data.pop("campaign_id"))
    latitude = float(data.pop("latitude"))
    longitude = float(data.pop("longitude"))
    location_address = data.pop("location_address")

    photo_path = None
    if photo:
        filename = f"{uuid.uuid4()}.jpg"
        photo_path = f"{UPLOAD_DIR}/{filename}"
        with open(photo_path, "wb") as f:
            f.write(await photo.read())

    payload = data  # baaki saare dynamic fields

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
    await db.refresh(activity)

    return {
        "status": "success",
        "id": activity.id,
        "saved_data": {
            "project_id": project_id,
            "campaign_id": campaign_id,
            "latitude": latitude,
            "longitude": longitude,
            "location_address": location_address,
            "payload": payload,
            "photo": photo_path
        }
    }
