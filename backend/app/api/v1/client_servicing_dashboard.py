from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel
import io
import csv
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.database.connection import get_db
from app.core.security import get_current_user
from app.api.dependencies import require_permission
from app.core.role_permissions import Permission
from app.services.client_servicing_dashboard_service import ClientServicingDashboardService
from app.models.user import User

router = APIRouter(
    prefix="/client-servicing-dashboard",
    tags=["Client Servicing Dashboard"]
)


class ProjectProgressResponse(BaseModel):
    today: int
    completed: int
    pending: int
    upcoming: int
    recent_projects: list

class VehicleMovementResponse(BaseModel):
    active_vehicles: int
    assigned_vehicles: int
    unassigned_vehicles: int
    total_distance_km: float
    vehicles: list

class ExpenseSnapshotResponse(BaseModel):
    total_expenses: float
    approved: dict
    pending: dict
    rejected: dict
    campaign_breakdown: list

class LiveUpdatesResponse(BaseModel):
    activities: list
    total_count: int


@router.get(
    "/project-progress",
    response_model=ProjectProgressResponse,
    dependencies=[Depends(require_permission(Permission.CLIENT_SERVICING_DASHBOARD_VIEW))]
)
async def get_project_progress(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get project progress overview
    - Today's Projects
    - Completed Projects
    - Pending Projects
    - Upcoming Projects
    """
    try:
        result = await ClientServicingDashboardService.get_project_progress(
            db=db,
            start_date=start_date,
            end_date=end_date,
            client_id=client_id
        )
        print(f"[DEBUG] Project Progress Result: {result}")
        return result
    except Exception as e:
        print(f"[ERROR] Project Progress Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching project progress: {str(e)}")


@router.get(
    "/vehicle-movement",
    response_model=VehicleMovementResponse,
    dependencies=[Depends(require_permission(Permission.CLIENT_SERVICING_DASHBOARD_VIEW))]
)
async def get_vehicle_movement(
    start_date: Optional[date] = Query(None, description="Filter start date"),
    end_date: Optional[date] = Query(None, description="Filter end date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get vehicle movement summary
    - Active Vehicles
    - Assigned Vehicles
    - Unassigned Vehicles
    - Total Distance
    """
    try:
        result = await ClientServicingDashboardService.get_vehicle_movement(
            db=db,
            start_date=start_date,
            end_date=end_date
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vehicle movement: {str(e)}")


@router.get(
    "/expense-snapshot",
    response_model=ExpenseSnapshotResponse,
    dependencies=[Depends(require_permission(Permission.CLIENT_SERVICING_DASHBOARD_VIEW))]
)
async def get_expense_snapshot(
    start_date: Optional[date] = Query(None, description="Filter start date (default: 30 days ago)"),
    end_date: Optional[date] = Query(None, description="Filter end date (default: today)"),
    campaign_id: Optional[int] = Query(None, description="Filter by campaign"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get daily expense snapshot
    - Total Expenses
    - Approved/Pending/Rejected breakdown
    - Campaign-wise split
    """
    try:
        result = await ClientServicingDashboardService.get_daily_expense_snapshot(
            db=db,
            start_date=start_date,
            end_date=end_date,
            campaign_id=campaign_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching expense snapshot: {str(e)}")


@router.get(
    "/live-updates",
    response_model=LiveUpdatesResponse,
    dependencies=[Depends(require_permission(Permission.CLIENT_SERVICING_DASHBOARD_VIEW))]
)
async def get_live_updates(
    limit: int = Query(20, description="Number of recent activities to fetch", ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get live photo and GPS updates from promoter activities
    - Recent photos
    - GPS coordinates
    - Timestamps
    """
    try:
        result = await ClientServicingDashboardService.get_live_photo_gps_updates(
            db=db,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching live updates: {str(e)}")


@router.get(
    "/export",
    dependencies=[Depends(require_permission(Permission.CLIENT_SERVICING_DASHBOARD_VIEW))]
)
async def export_dashboard_report(
    format: str = Query("excel", description="Export format: pdf, excel"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export dashboard report in specified format
    - Excel: CSV format with all dashboard data
    - PDF: Simple text report
    """
    
    # Fetch all dashboard data
    project_progress = await ClientServicingDashboardService.get_project_progress(
        db=db, start_date=start_date, end_date=end_date
    )
    vehicle_movement = await ClientServicingDashboardService.get_vehicle_movement(
        db=db, start_date=start_date, end_date=end_date
    )
    expense_snapshot = await ClientServicingDashboardService.get_daily_expense_snapshot(
        db=db, start_date=start_date, end_date=end_date
    )
    
    if format.lower() == "excel":
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Client Servicing Dashboard Report"])
        writer.writerow([f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        if start_date:
            writer.writerow([f"Period: {start_date} to {end_date or 'Present'}"])
        writer.writerow([])
        
        # Project Progress Section
        writer.writerow(["PROJECT PROGRESS"])
        writer.writerow(["Metric", "Count"])
        writer.writerow(["Today's Projects", project_progress.get("today", 0)])
        writer.writerow(["Completed Projects", project_progress.get("completed", 0)])
        writer.writerow(["Pending Projects", project_progress.get("pending", 0)])
        writer.writerow(["Upcoming Projects", project_progress.get("upcoming", 0)])
        writer.writerow([])
        
        # Recent Projects
        writer.writerow(["RECENT PROJECTS"])
        writer.writerow(["Project Name", "Client", "Start Date", "End Date", "Status"])
        for project in project_progress.get("recent_projects", [])[:10]:
            writer.writerow([
                project.get("name", ""),
                project.get("client_name", ""),
                project.get("start_date", ""),
                project.get("end_date", ""),
                project.get("status", "")
            ])
        writer.writerow([])
        
        # Vehicle Movement Section
        writer.writerow(["VEHICLE MOVEMENT"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Active Vehicles", vehicle_movement.get("active_vehicles", 0)])
        writer.writerow(["Assigned Vehicles", vehicle_movement.get("assigned_vehicles", 0)])
        writer.writerow(["Unassigned Vehicles", vehicle_movement.get("unassigned_vehicles", 0)])
        writer.writerow(["Total Distance (km)", vehicle_movement.get("total_distance_km", 0)])
        writer.writerow([])
        
        # Expense Snapshot Section
        writer.writerow(["EXPENSE SNAPSHOT"])
        writer.writerow(["Total Expenses", f"₹{expense_snapshot.get('total_expenses', 0):,.2f}"])
        writer.writerow([])
        writer.writerow(["Status", "Count", "Amount"])
        approved = expense_snapshot.get("approved", {})
        pending = expense_snapshot.get("pending", {})
        rejected = expense_snapshot.get("rejected", {})
        writer.writerow(["Approved", approved.get("count", 0), f"₹{approved.get('amount', 0):,.2f}"])
        writer.writerow(["Pending", pending.get("count", 0), f"₹{pending.get('amount', 0):,.2f}"])
        writer.writerow(["Rejected", rejected.get("count", 0), f"₹{rejected.get('amount', 0):,.2f}"])
        writer.writerow([])
        
        # Campaign Breakdown
        writer.writerow(["CAMPAIGN EXPENSE BREAKDOWN"])
        writer.writerow(["Campaign", "Expense Amount"])
        for campaign in expense_snapshot.get("campaign_breakdown", [])[:15]:
            writer.writerow([
                campaign.get("campaign_name", "Unknown"),
                f"₹{campaign.get('total_expense', 0):,.2f}"
            ])
        
        # Prepare response
        output.seek(0)
        filename = f"client_servicing_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),  # utf-8-sig for Excel compatibility
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    elif format.lower() == "pdf":
        # Create proper PDF using reportlab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
        
        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        elements.append(Paragraph("CLIENT SERVICING DASHBOARD", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M:%S')}", styles['Normal']))
        if start_date:
            elements.append(Paragraph(f"Period: {start_date} to {end_date or 'Present'}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # PROJECT PROGRESS Section
        elements.append(Paragraph("PROJECT PROGRESS", heading_style))
        project_data = [
            ['Metric', 'Count'],
            ["Today's Projects", str(project_progress.get('today', 0))],
            ['Completed Projects', str(project_progress.get('completed', 0))],
            ['Pending Projects', str(project_progress.get('pending', 0))],
            ['Upcoming Projects', str(project_progress.get('upcoming', 0))]
        ]
        
        project_table = Table(project_data, colWidths=[4*inch, 2*inch])
        project_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(project_table)
        elements.append(Spacer(1, 20))
        
        # VEHICLE MOVEMENT Section
        elements.append(Paragraph("VEHICLE MOVEMENT", heading_style))
        vehicle_data = [
            ['Metric', 'Value'],
            ['Active Vehicles', str(vehicle_movement.get('active_vehicles', 0))],
            ['Assigned Vehicles', str(vehicle_movement.get('assigned_vehicles', 0))],
            ['Unassigned Vehicles', str(vehicle_movement.get('unassigned_vehicles', 0))],
            ['Total Distance', f"{vehicle_movement.get('total_distance_km', 0):,.2f} km"]
        ]
        
        vehicle_table = Table(vehicle_data, colWidths=[4*inch, 2*inch])
        vehicle_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(vehicle_table)
        elements.append(Spacer(1, 20))
        
        # EXPENSE SNAPSHOT Section
        elements.append(Paragraph("EXPENSE SNAPSHOT", heading_style))
        approved = expense_snapshot.get("approved", {})
        pending = expense_snapshot.get("pending", {})
        rejected = expense_snapshot.get("rejected", {})
        
        expense_data = [
            ['Status', 'Count', 'Amount (₹)'],
            ['Total', '-', f"{expense_snapshot.get('total_expenses', 0):,.2f}"],
            ['Approved', str(approved.get('count', 0)), f"{approved.get('amount', 0):,.2f}"],
            ['Pending', str(pending.get('count', 0)), f"{pending.get('amount', 0):,.2f}"],
            ['Rejected', str(rejected.get('count', 0)), f"{rejected.get('amount', 0):,.2f}"]
        ]
        
        expense_table = Table(expense_data, colWidths=[2.5*inch, 1.5*inch, 2*inch])
        expense_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, 1), colors.lightblue),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 2), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(expense_table)
        elements.append(Spacer(1, 20))
        
        # CAMPAIGN BREAKDOWN Section
        campaign_breakdown = expense_snapshot.get("campaign_breakdown", [])[:10]
        if campaign_breakdown:
            elements.append(Paragraph("CAMPAIGN EXPENSE BREAKDOWN (Top 10)", heading_style))
            campaign_data = [['Campaign', 'Expense Amount (₹)']]
            for campaign in campaign_breakdown:
                campaign_data.append([
                    campaign.get("campaign_name", "Unknown"),
                    f"{campaign.get('total_expense', 0):,.2f}"
                ])
            
            campaign_table = Table(campaign_data, colWidths=[4*inch, 2*inch])
            campaign_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(campaign_table)
        
        # Build PDF
        doc.build(elements)
        
        # Prepare response
        buffer.seek(0)
        filename = f"client_servicing_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{format}'. Supported formats: excel, pdf"
        )
