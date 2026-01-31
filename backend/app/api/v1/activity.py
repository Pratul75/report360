from fastapi import APIRouter, Request, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.activity import Activity
from app.models.activity_file import ActivityFile
from sqlalchemy import select
from collections import defaultdict
import uuid, os

router = APIRouter(prefix="/activities", tags=["Activities"])
UPLOAD_DIR = "uploads/activities"
os.makedirs(UPLOAD_DIR, exist_ok=True)
@router.get("")
async def get_activities_by_campaign(
    campaign_id: int,
    db: AsyncSession = Depends(get_db)
):
    # 1. Get all activities of campaign
    result = await db.execute(
        select(Activity).where(Activity.campaign_id == campaign_id)
    )
    activities = result.scalars().all()

    response = []

    for activity in activities:
        # 2. Get files of this activity
        files_result = await db.execute(
            select(ActivityFile).where(ActivityFile.activity_id == activity.id)
        )
        files = files_result.scalars().all()

        grouped = defaultdict(list)

        for f in files:
            grouped[f.field_name].append({
                "url": f"/uploads/activities/{os.path.basename(f.file_path)}",
                "type": f.file_type
            })

        response.append({
            "id": activity.id,
            "project_id": activity.project_id,
            "campaign_id": activity.campaign_id,
            "latitude": activity.latitude,
            "longitude": activity.longitude,
            "location_address": activity.location_address,
            "fields": activity.payload,   # dynamic text
            "media": grouped,             # dynamic images
            
        })

    return response
@router.post("")
async def save_activity(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    form = await request.form()

    print("======== RAW FORM DATA ========")
    for k, v in form.multi_items():
        print(k, v)
    print("================================")

    data = {}
    files = []

    for key, value in form.multi_items():
        if isinstance(value, UploadFile):
            files.append((key, value))
        else:
            data[key] = value

    project_id = int(data.pop("project_id", 0))
    campaign_id = int(data.pop("campaign_id", 0))
    latitude = float(data.pop("latitude", 0))
    longitude = float(data.pop("longitude", 0))
    location_address = data.pop("location_address", None)

    activity = Activity(
        project_id=project_id,
        campaign_id=campaign_id,
        latitude=latitude,
        longitude=longitude,
        location_address=location_address,
        payload=data
    )

    db.add(activity)
    await db.flush()  # 👈 activity.id mil jaayega

    # Save all files (dynamic names, multiple)
    for field_name, file in files:
        filename = f"{uuid.uuid4()}_{file.filename}"
        path = f"{UPLOAD_DIR}/{filename}"

        with open(path, "wb") as f:
            f.write(await file.read())

        file_row = ActivityFile(
            activity_id=activity.id,
            field_name=field_name,
            file_path=path,
            file_type=file.content_type
        )
        db.add(file_row)

    await db.commit()

    return {
        "status": "success",
        "activity_id": activity.id,
        "fields": data,
        "files_count": len(files)
    }
