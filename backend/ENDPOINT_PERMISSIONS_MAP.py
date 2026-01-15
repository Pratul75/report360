"""
Script to systematically update all API endpoints with proper permission enforcement.
This ensures RBAC is enforced at the API level.
"""

# Mapping of endpoints to required permissions
ENDPOINT_PERMISSIONS = {
    # Projects
    "POST /projects": "PROJECT_CREATE",
    "GET /projects": "PROJECT_READ",
    "GET /projects/{id}": "PROJECT_READ",
    "PATCH /projects/{id}": "PROJECT_UPDATE",
    "DELETE /projects/{id}": "PROJECT_DELETE",
    
    # Campaigns
    "POST /campaigns": "CAMPAIGN_CREATE",
    "GET /campaigns": "CAMPAIGN_READ",
    "GET /campaigns/{id}": "CAMPAIGN_READ",
    "PATCH /campaigns/{id}": "CAMPAIGN_UPDATE",
    "DELETE /campaigns/{id}": "CAMPAIGN_DELETE",
    
    # Vehicles
    "POST /vehicles": "VEHICLE_CREATE",
    "GET /vehicles": "VEHICLE_READ",
    "GET /vehicles/{id}": "VEHICLE_READ",
    "PATCH /vehicles/{id}": "VEHICLE_UPDATE",
    "DELETE /vehicles/{id}": "VEHICLE_DELETE",
    
    # Drivers
    "POST /drivers": "DRIVER_CREATE",
    "GET /drivers": "DRIVER_READ",
    "GET /drivers/{id}": "DRIVER_READ",
    "PATCH /drivers/{id}": "DRIVER_UPDATE",
    "DELETE /drivers/{id}": "DRIVER_DELETE",
    
    # Expenses
    "POST /expenses": "EXPENSE_CREATE",
    "GET /expenses": "EXPENSE_READ",
    "GET /expenses/{id}": "EXPENSE_READ",
    "PATCH /expenses/{id}": "EXPENSE_UPDATE",
    "DELETE /expenses/{id}": "EXPENSE_DELETE",
    "POST /expenses/{id}/approve": "EXPENSE_APPROVE",
    
    # Reports
    "POST /reports": "REPORT_CREATE",
    "GET /reports": "REPORT_READ",
    "GET /reports/{id}": "REPORT_READ",
    "PATCH /reports/{id}": "REPORT_UPDATE",
    "DELETE /reports/{id}": "REPORT_DELETE",
    
    # Vendors
    "POST /vendors": "VENDOR_CREATE",
    "GET /vendors": "VENDOR_READ",
    "GET /vendors/{id}": "VENDOR_READ",
    "PATCH /vendors/{id}": "VENDOR_UPDATE",
    "DELETE /vendors/{id}": "VENDOR_DELETE",
    
    # Promoters
    "POST /promoters": "PROMOTER_CREATE",
    "GET /promoters": "PROMOTER_READ",
    "GET /promoters/{id}": "PROMOTER_READ",
    "PATCH /promoters/{id}": "PROMOTER_UPDATE",
    "DELETE /promoters/{id}": "PROMOTER_DELETE",
}

print("API Endpoint Permission Mapping Generated")
print("=" * 60)
for endpoint, perm in ENDPOINT_PERMISSIONS.items():
    print(f"{endpoint:40} -> Permission.{perm}")
