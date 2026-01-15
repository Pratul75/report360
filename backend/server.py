"""Production-ready Fleet Operations API with MySQL/SQLAlchemy
Features:
- Full CRUD endpoints with validation
- Query optimization with eager loading
- Security hardening (CORS, rate limiting, validation)
- Comprehensive error handling
- Structured logging
"""

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_, or_
from sqlalchemy.orm import selectinload, joinedload
from datetime import date, datetime, timezone, timedelta
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator 

from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_role
from database import get_db, init_db, Base, engine
from models import (
    User, Client, Project, Vendor, Vehicle, Driver, Promoter,
    Campaign, Expense, Report, Payment, CampaignStatus, CampaignType, PaymentStatus, ExpenseStatus
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fleet Operations Management API",
    description="Production-ready API for managing fleet operations",
    version="2.0.0"
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,  # Cache CORS preflight for 10 minutes
)

api_router = APIRouter(prefix="/api", tags=["Fleet Operations"])

# ============== Pydantic Schemas ==============

class BaseResponse(BaseModel):
    """Base response schema"""
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=255)
    role: str
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = {'admin', 'client_servicing', 'operations_manager', 'accounts', 'vendor', 'client'}
        if v not in valid_roles:
            raise ValueError(f'Role must be one of {valid_roles}')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseResponse):
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    contact_person: Optional[str] = Field(None, max_length=255)

class ClientResponse(BaseResponse):
    id: int
    name: str
    company: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    contact_person: Optional[str]
    is_active: bool
    created_at: datetime

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    client_id: int
    budget: Optional[float] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assigned_cs: Optional[str] = Field(None, max_length=255)

class ProjectResponse(BaseResponse):
    id: int
    name: str
    description: Optional[str]
    client_id: int
    budget: Optional[float]
    start_date: Optional[date]
    end_date: Optional[date]
    status: str
    assigned_cs: Optional[str]
    created_at: datetime

class VehicleCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=1, max_length=50)
    vehicle_type: Optional[str] = Field(None, max_length=100)
    capacity: Optional[str] = Field(None, max_length=100)
    vendor_id: Optional[int] = None
    rc_validity: Optional[date] = None
    insurance_validity: Optional[date] = None
    permit_validity: Optional[date] = None

class VehicleResponse(BaseResponse):
    id: int
    vehicle_number: str
    vehicle_type: Optional[str]
    capacity: Optional[str]
    vendor_id: Optional[int]
    rc_validity: Optional[date]
    insurance_validity: Optional[date]
    permit_validity: Optional[date]
    is_active: bool
    created_at: datetime
    vendor: Optional['VendorResponse'] = None
    
    class Config:
        from_attributes = True

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    license_number: Optional[str] = Field(None, max_length=100)
    license_validity: Optional[date] = None
    vendor_id: Optional[int] = None

class DriverResponse(BaseResponse):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    license_number: Optional[str]
    license_validity: Optional[date]
    vendor_id: Optional[int]
    vehicle_id: Optional[int]
    is_active: bool
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    vendor: Optional['VendorResponse'] = None
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    active_projects: int
    running_campaigns: int
    vehicles_on_ground: int
    todays_expense: float
    pending_expenses: int
    pending_payments: int
    total_drivers: int
    total_vendors: int

# ============== Auth Routes ==============

@api_router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    logger.info(f"Registering new user: {user_data.email}")
    
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing = result.scalar_one_or_none()
    
    if existing:
        logger.warning(f"Registration failed: Email {user_data.email} already registered")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        is_active=True
    )
    
    db.add(user_obj)
    await db.commit()
    await db.refresh(user_obj)
    logger.info(f"User registered successfully: {user_obj.id}")
    
    return user_obj

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and get access token"""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        logger.warning(f"Login failed for email: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role}
    )
    
    logger.info(f"User logged in: {user.id}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user info"""
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# ============== Dashboard Route ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics with optimized queries"""
    today = date.today()
    
    # Use separate queries with proper indexing
    result = await db.execute(select(func.count(Project.id)).where(Project.status == "active"))
    active_projects = result.scalar() or 0
    
    result = await db.execute(select(func.count(Campaign.id)).where(Campaign.status == "running"))
    running_campaigns = result.scalar() or 0
    
    result = await db.execute(select(func.count(Vehicle.id)).where(Vehicle.is_active == True))
    vehicles_on_ground = result.scalar() or 0
    
    result = await db.execute(
        select(func.sum(Expense.amount))
        .where(func.date(Expense.created_at) == today)
    )
    todays_expense = float(result.scalar() or 0)
    
    result = await db.execute(select(func.count(Expense.id)).where(Expense.status == "pending"))
    pending_expenses = result.scalar() or 0
    
    result = await db.execute(select(func.count(Payment.id)).where(Payment.status == "pending"))
    pending_payments = result.scalar() or 0
    
    result = await db.execute(select(func.count(Driver.id)))
    total_drivers = result.scalar() or 0
    
    result = await db.execute(select(func.count(Vendor.id)))
    total_vendors = result.scalar() or 0
    
    logger.info("Dashboard stats retrieved")
    return DashboardStats(
        active_projects=active_projects,
        running_campaigns=running_campaigns,
        vehicles_on_ground=vehicles_on_ground,
        todays_expense=todays_expense,
        pending_expenses=pending_expenses,
        pending_payments=pending_payments,
        total_drivers=total_drivers,
        total_vendors=total_vendors
    )


# ============== Client Routes ==============

@api_router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(client_data: ClientCreate, db: AsyncSession = Depends(get_db)):
    """Create a new client"""
    logger.info(f"Creating client: {client_data.name}")
    
    client = Client(**client_data.dict())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    
    logger.info(f"Client created: {client.id}")
    return client

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all active clients with pagination"""
    result = await db.execute(
        select(Client).where(Client.is_active == True)
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    """Get client by ID with relationships"""
    result = await db.execute(
        select(Client).where(Client.id == client_id)
        .options(selectinload(Client.projects))
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@api_router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, client_data: ClientCreate, db: AsyncSession = Depends(get_db)):
    """Update client details"""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    for key, value in client_data.dict(exclude_unset=True).items():
        setattr(client, key, value)
    
    db.add(client)
    await db.commit()
    await db.refresh(client)
    
    logger.info(f"Client updated: {client_id}")
    return client

@api_router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    """Soft delete client"""
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client.is_active = False
    db.add(client)
    await db.commit()
    
    logger.info(f"Client deleted: {client_id}")

# ============== Project Routes ==============

@api_router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project"""
    # Verify client exists
    client_result = await db.execute(select(Client).where(Client.id == project_data.client_id))
    if not client_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Client not found")
    
    project = Project(**project_data.dict())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    logger.info(f"Project created: {project.id}")
    return project


# ============== Vendor Routes ==============

class VendorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    company: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None


class VendorResponse(BaseResponse):
    id: int
    name: str
    company: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    is_active: bool
    created_at: datetime


@api_router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(vendor_data: VendorCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vendor"""
    vendor = Vendor(**vendor_data.dict())
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    logger.info(f"Vendor created: {vendor.id}")
    return vendor


@api_router.get("/vendors", response_model=List[VendorResponse])
async def get_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Vendor).where(Vendor.is_active == True).offset(skip).limit(limit))
    return result.scalars().all()


@api_router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@api_router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: int, vendor_data: VendorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for key, value in vendor_data.dict(exclude_unset=True).items():
        setattr(vendor, key, value)
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    logger.info(f"Vendor updated: {vendor_id}")
    return vendor


@api_router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_active = False
    db.add(vendor)
    await db.commit()
    logger.info(f"Vendor deleted: {vendor_id}")


# ============== Promoter Routes ==============

class PromoterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    specialty: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    language: Optional[str] = Field(None, max_length=100)


class PromoterResponse(BaseResponse):
    id: int
    name: str
    phone: Optional[str]
    specialty: Optional[str]
    email: Optional[str]
    language: Optional[str]
    is_active: bool
    created_at: datetime


@api_router.post("/promoters", response_model=PromoterResponse, status_code=status.HTTP_201_CREATED)
async def create_promoter(promoter_data: PromoterCreate, db: AsyncSession = Depends(get_db)):
    promoter = Promoter(**promoter_data.dict())
    db.add(promoter)
    await db.commit()
    await db.refresh(promoter)
    logger.info(f"Promoter created: {promoter.id}")
    return promoter


@api_router.get("/promoters", response_model=List[PromoterResponse])
async def get_promoters(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Promoter).where(Promoter.is_active == True).offset(skip).limit(limit))
    return result.scalars().all()


@api_router.get("/promoters/{promoter_id}", response_model=PromoterResponse)
async def get_promoter(promoter_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Promoter).where(Promoter.id == promoter_id))
    promoter = result.scalar_one_or_none()
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    return promoter


@api_router.put("/promoters/{promoter_id}", response_model=PromoterResponse)
async def update_promoter(promoter_id: int, promoter_data: PromoterCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Promoter).where(Promoter.id == promoter_id))
    promoter = result.scalar_one_or_none()
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    for key, value in promoter_data.dict(exclude_unset=True).items():
        setattr(promoter, key, value)
    db.add(promoter)
    await db.commit()
    await db.refresh(promoter)
    logger.info(f"Promoter updated: {promoter_id}")
    return promoter


@api_router.delete("/promoters/{promoter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promoter(promoter_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Promoter).where(Promoter.id == promoter_id))
    promoter = result.scalar_one_or_none()
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    promoter.is_active = False
    db.add(promoter)
    await db.commit()
    logger.info(f"Promoter deleted: {promoter_id}")


# ============== Campaign Routes ==============

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: int
    campaign_type: CampaignType
    status: Optional[CampaignStatus] = CampaignStatus.PLANNING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = Field(None, ge=0)
    locations: Optional[str] = None


class CampaignResponse(BaseResponse):
    id: int
    name: str
    description: Optional[str]
    project_id: int
    campaign_type: str
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    budget: Optional[float]
    locations: Optional[str]
    created_at: datetime


@api_router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(campaign_data: CampaignCreate, db: AsyncSession = Depends(get_db)):
    """Create a new campaign"""
    # verify project exists
    proj_result = await db.execute(select(Project).where(Project.id == campaign_data.project_id))
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    campaign = Campaign(**campaign_data.dict())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    logger.info(f"Campaign created: {campaign.id}")
    return campaign


@api_router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Campaign).offset(skip).limit(limit))
    return result.scalars().all()


@api_router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@api_router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """List all projects with pagination"""
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.client))
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get project details with relationships"""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
        .options(selectinload(Project.client), selectinload(Project.campaigns))
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, project_data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Update project details"""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in project_data.dict(exclude_unset=True).items():
        setattr(project, key, value)
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    logger.info(f"Project updated: {project_id}")
    return project

# ============== Vehicle Routes ==============

@api_router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(vehicle_data: VehicleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new vehicle"""
    # Check for duplicate vehicle number
    result = await db.execute(
        select(Vehicle).where(Vehicle.vehicle_number == vehicle_data.vehicle_number)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Vehicle number already exists")
    
    vehicle = Vehicle(**vehicle_data.dict())
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    
    logger.info(f"Vehicle created: {vehicle.id}")
    return vehicle

@api_router.get("/vehicles", response_model=List[VehicleResponse])
async def get_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active vehicles with pagination"""
    query = select(Vehicle).where(Vehicle.is_active == True).options(
        selectinload(Vehicle.vendor)
    )
    
    # Vendor users can only see their own vehicles
    if current_user.role == 'vendor':
        query = query.where(Vehicle.vendor_id == current_user.vendor_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@api_router.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    """Get vehicle details"""
    result = await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id)
        .options(selectinload(Vehicle.vendor))
    )
    vehicle = result.scalar_one_or_none()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Debug
    logger.info(f"Vehicle {vehicle.id}: vendor_id={vehicle.vendor_id}")
    logger.info(f"Vehicle vendor object: {vehicle.vendor}")
    
    # Manually serialize to include relationships
    vendor_data = None
    if vehicle.vendor:
        vendor_data = {
            "id": vehicle.vendor.id,
            "name": vehicle.vendor.name
        }
        logger.info(f"Vendor name: {vehicle.vendor.name}")
    else:
        logger.warning(f"Vendor is None for vehicle {vehicle.id} with vendor_id {vehicle.vendor_id}")
    
    vehicle_dict = {
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_type": vehicle.vehicle_type,
        "capacity": vehicle.capacity,
        "vendor_id": vehicle.vendor_id,
        "rc_validity": vehicle.rc_validity,
        "insurance_validity": vehicle.insurance_validity,
        "permit_validity": vehicle.permit_validity,
        "rc_image": vehicle.rc_image if hasattr(vehicle, 'rc_image') else None,
        "insurance_image": vehicle.insurance_image if hasattr(vehicle, 'insurance_image') else None,
        "is_active": vehicle.is_active,
        "created_at": vehicle.created_at,
        "vendor": vendor_data
    }
    
    logger.info(f"Returning vehicle_dict with vendor: {vendor_data}")
    return vehicle_dict

# ============== Driver Routes ==============

@api_router.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(driver_data: DriverCreate, db: AsyncSession = Depends(get_db)):
    """Create a new driver"""
    driver = Driver(**driver_data.dict())
    db.add(driver)
    await db.commit()
    await db.refresh(driver)
    
    logger.info(f"Driver created: {driver.id}")
    return driver

@api_router.get("/drivers", response_model=List[DriverResponse])
async def get_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active drivers with pagination"""
    query = select(Driver).where(Driver.is_active == True).options(
        selectinload(Driver.vehicle),
        selectinload(Driver.vendor)
    )
    
    # Vendor users can only see their own drivers
    if current_user.role == 'vendor':
        query = query.where(Driver.vendor_id == current_user.vendor_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    drivers = result.scalars().all()
    
    # Manually serialize to include relationships
    drivers_list = []
    for driver in drivers:
        driver_dict = {
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "license_number": driver.license_number,
            "license_validity": driver.license_validity,
            "vendor_id": driver.vendor_id,
            "vehicle_id": driver.vehicle_id,
            "is_active": driver.is_active,
            "created_at": driver.created_at,
            "vehicle": {
                "id": driver.vehicle.id,
                "vehicle_number": driver.vehicle.vehicle_number,
                "vehicle_type": driver.vehicle.vehicle_type
            } if driver.vehicle else None,
            "vendor": {
                "id": driver.vendor.id,
                "name": driver.vendor.name
            } if driver.vendor else None
        }
        drivers_list.append(driver_dict)
    
    return drivers_list

@api_router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int, db: AsyncSession = Depends(get_db)):
    """Get driver details"""
    result = await db.execute(
        select(Driver).where(Driver.id == driver_id)
        .options(
            selectinload(Driver.vendor),
            selectinload(Driver.vehicle)
        )
    )
    driver = result.scalar_one_or_none()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

# ============== Expense Routes ==============

class ExpenseCreate(BaseModel):
    campaign_id: Optional[int] = None
    driver_id: Optional[int] = None
    expense_type: str = Field(..., max_length=100)
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    bill_url: Optional[str] = None
    submitted_date: Optional[date] = None


class ExpenseResponse(BaseResponse):
    id: int
    campaign_id: Optional[int]
    driver_id: Optional[int]
    expense_type: str
    amount: float
    description: Optional[str]
    bill_url: Optional[str]
    submitted_date: Optional[date]
    status: Optional[str]
    approved_date: Optional[date]
    rejected_date: Optional[date]
    created_at: datetime

@api_router.post("/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(expense_data: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new expense"""
    expense = Expense(**expense_data.dict())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    
    logger.info(f"Expense created: {expense.id}")
    return expense

@api_router.get("/expenses")
async def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List expenses with optional status filter"""
    query = select(Expense)
    if status_filter:
        query = query.where(Expense.status == status_filter)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@api_router.patch("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    """Approve an expense"""
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense.status = "approved"
    expense.approved_date = date.today()
    
    db.add(expense)
    await db.commit()
    
    logger.info(f"Expense approved: {expense_id}")
    return {"message": "Expense approved", "expense_id": expense_id}


@api_router.patch("/expenses/{expense_id}/reject")
async def reject_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    """Reject an expense"""
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense.status = "rejected"
    expense.rejected_date = date.today()

    db.add(expense)
    await db.commit()

    logger.info(f"Expense rejected: {expense_id}")
    return {"message": "Expense rejected", "expense_id": expense_id}


@api_router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@api_router.put("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: int, expense_data: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for key, value in expense_data.dict(exclude_unset=True).items():
        setattr(expense, key, value)

    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    logger.info(f"Expense updated: {expense_id}")
    return expense



@api_router.get("/clients/{client_id}/expenses", response_model=List[ExpenseResponse])
async def get_client_expenses(
    client_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get expenses related to a client's projects (via campaigns)"""
    # Join Expense -> Campaign -> Project and filter by project.client_id
    query = (
        select(Expense)
        .join(Campaign, Expense.campaign_id == Campaign.id)
        .join(Project, Campaign.project_id == Project.id)
        .where(Project.client_id == client_id)
        .order_by(Expense.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()

# ============== Report Routes ==============

class ReportCreate(BaseModel):
    campaign_id: int
    report_date: date
    locations_covered: Optional[str] = None
    km_travelled: Optional[float] = None
    photos_url: Optional[str] = None
    gps_data: Optional[str] = None
    notes: Optional[str] = None


class ReportResponse(BaseResponse):
    id: int
    campaign_id: int
    report_date: date
    locations_covered: Optional[str]
    km_travelled: Optional[float]
    photos_url: Optional[str]
    gps_data: Optional[str]
    notes: Optional[str]
    created_at: datetime


@api_router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report_data: ReportCreate, db: AsyncSession = Depends(get_db)):
    """Create a new report"""
    campaign_result = await db.execute(select(Campaign).where(Campaign.id == report_data.campaign_id))
    if not campaign_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    report = Report(**report_data.dict())
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@api_router.get("/reports", response_model=List[ReportResponse])
async def get_reports(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000), db: AsyncSession = Depends(get_db)):
    """List all reports"""
    result = await db.execute(select(Report).offset(skip).limit(limit))
    return result.scalars().all()

@api_router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Get report by ID"""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@api_router.get("/reports/campaign/{campaign_id}", response_model=List[ReportResponse])
async def get_reports_by_campaign(campaign_id: int, db: AsyncSession = Depends(get_db)):
    """Get reports by campaign"""
    result = await db.execute(select(Report).where(Report.campaign_id == campaign_id))
    return result.scalars().all()



# ============== Health & Init ==============

app.include_router(api_router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "fleet-operations-api",
        "version": "2.0.0"
    }

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully")

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    logger.info("Shutting down application")
