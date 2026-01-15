from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from pathlib import Path
import shutil
from datetime import datetime
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/upload", tags=["Upload"])

REPORTS_UPLOAD_DIR = Path("/app/backend/uploads/reports")
REPORTS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

VEHICLES_UPLOAD_DIR = Path("/app/backend/uploads/vehicles")
VEHICLES_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/report-photo")
async def upload_report_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload a photo for a report"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        filename = f"report_{timestamp}_{current_user.get('id')}{file_extension}"
        file_path = REPORTS_UPLOAD_DIR / filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the path that will be accessible via static files
        return {
            "success": True,
            "filename": filename,
            "url": f"/uploads/reports/{filename}",
            "path": f"/uploads/reports/{filename}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.post("/vehicle-document")
async def upload_vehicle_document(
    file: UploadFile = File(...),
    document_type: str = Form(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Upload a vehicle document (RC or Insurance)"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(file.filename).suffix
        doc_prefix = document_type if document_type in ['rc', 'insurance'] else 'vehicle'
        filename = f"{doc_prefix}_{timestamp}_{current_user.get('id')}{file_extension}"
        file_path = VEHICLES_UPLOAD_DIR / filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the path that will be accessible via static files
        return {
            "success": True,
            "filename": filename,
            "url": f"/uploads/vehicles/{filename}",
            "path": f"/uploads/vehicles/{filename}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
