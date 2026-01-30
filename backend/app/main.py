from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger
from app.database.connection import init_db, close_db

# Import API routers
from app.api.v1 import (
    auth, dashboard, clients, projects, campaigns,
    vendors, vehicles, drivers, promoters, expenses, reports, users, roles, promoter_activities,
    vendor_dashboard, invoices, payments, client_servicing_dashboard, driver_dashboard, vendor_booking,
    ml_insights, accounts, operations, analytics, upload, godowns , driver_forms
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Fleet Operations Platform...")
    await init_db()
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Fleet Operations Platform...")
    await close_db()
    logger.info("Application shutdown complete")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.CORS_ORIGINS.split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
uploads_dir = Path("/uploads")

if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    logger.info(f"Mounted uploads directory at {uploads_dir}")
else:
    logger.warning(f"Uploads directory not found at {uploads_dir}")

# Include API routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(roles.router, prefix=settings.API_V1_PREFIX)
app.include_router(clients.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(campaigns.router, prefix=settings.API_V1_PREFIX)
app.include_router(vendors.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
app.include_router(drivers.router, prefix=settings.API_V1_PREFIX)
app.include_router(promoters.router, prefix=settings.API_V1_PREFIX)
app.include_router(promoter_activities.router, prefix=settings.API_V1_PREFIX)
app.include_router(expenses.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(vendor_dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(client_servicing_dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(driver_dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(vendor_booking.router, prefix=settings.API_V1_PREFIX)
app.include_router(invoices.router, prefix=settings.API_V1_PREFIX)
app.include_router(payments.router, prefix=settings.API_V1_PREFIX)
app.include_router(accounts.router, prefix=settings.API_V1_PREFIX)
app.include_router(operations.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(ml_insights.router, prefix=settings.API_V1_PREFIX)
app.include_router(upload.router, prefix=settings.API_V1_PREFIX)
app.include_router(godowns.router, prefix=settings.API_V1_PREFIX)
app.include_router(driver_forms.router, prefix=settings.API_V1_PREFIX)
app.include_router(godowns.inventory_router, prefix=settings.API_V1_PREFIX)
from app.api.v1 import campaign_driver_workflow_router
app.include_router(campaign_driver_workflow_router, prefix=f"{settings.API_V1_PREFIX}/daily-activity")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "database": "MySQL"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "database": "MySQL with SQLAlchemy"
    }
