"""
Comprehensive Role-Based Permissions Matrix
Maps each role to their allowed operations across the system
"""

from enum import Enum
from typing import List, Dict

class Permission(str, Enum):
    # User Management
    USER_CREATE = "user.create"
    USER_READ = "user.read"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_PASSWORD_SET = "user.password.set"
    
    # Client Management
    CLIENT_CREATE = "client.create"
    CLIENT_READ = "client.read"
    CLIENT_UPDATE = "client.update"
    CLIENT_DELETE = "client.delete"
    
    # Project Management
    PROJECT_CREATE = "project.create"
    PROJECT_READ = "project.read"
    PROJECT_UPDATE = "project.update"
    PROJECT_DELETE = "project.delete"
    
    # Campaign Management
    CAMPAIGN_CREATE = "campaign.create"
    CAMPAIGN_READ = "campaign.read"
    CAMPAIGN_UPDATE = "campaign.update"
    CAMPAIGN_DELETE = "campaign.delete"
    
    # Vendor Management
    VENDOR_CREATE = "vendor.create"
    VENDOR_READ = "vendor.read"
    VENDOR_UPDATE = "vendor.update"
    VENDOR_DELETE = "vendor.delete"
    
    # Vehicle Management
    VEHICLE_CREATE = "vehicle.create"
    VEHICLE_READ = "vehicle.read"
    VEHICLE_UPDATE = "vehicle.update"
    VEHICLE_DELETE = "vehicle.delete"
    
    # Driver Management
    DRIVER_CREATE = "driver.create"
    DRIVER_READ = "driver.read"
    DRIVER_UPDATE = "driver.update"
    DRIVER_DELETE = "driver.delete"
    
    # Promoter Management
    PROMOTER_CREATE = "promoter.create"
    PROMOTER_READ = "promoter.read"
    PROMOTER_UPDATE = "promoter.update"
    PROMOTER_DELETE = "promoter.delete"
    
    # Promoter Activity Management
    PROMOTER_ACTIVITY_CREATE = "promoter_activity.create"
    PROMOTER_ACTIVITY_READ = "promoter_activity.read"
    PROMOTER_ACTIVITY_UPDATE = "promoter_activity.update"
    PROMOTER_ACTIVITY_DELETE = "promoter_activity.delete"
    
    # Expense Management
    EXPENSE_CREATE = "expense.create"
    EXPENSE_READ = "expense.read"
    EXPENSE_UPDATE = "expense.update"
    EXPENSE_DELETE = "expense.delete"
    EXPENSE_APPROVE = "expense.approve"
    
    # Report Management
    REPORT_CREATE = "report.create"
    REPORT_READ = "report.read"
    REPORT_UPDATE = "report.update"
    REPORT_DELETE = "report.delete"
    
    # Invoice Management
    INVOICE_CREATE = "invoice.create"
    INVOICE_READ = "invoice.read"
    INVOICE_UPDATE = "invoice.update"
    INVOICE_DELETE = "invoice.delete"
    INVOICE_APPROVE = "invoice.approve"
    
    # Payment Management
    PAYMENT_CREATE = "payment.create"
    PAYMENT_READ = "payment.read"
    PAYMENT_UPDATE = "payment.update"
    PAYMENT_DELETE = "payment.delete"
    
    # Dashboard & Analytics
    DASHBOARD_VIEW = "dashboard.view"
    VENDOR_DASHBOARD_VIEW = "vendor_dashboard.view"
    CLIENT_SERVICING_DASHBOARD_VIEW = "client_servicing_dashboard.view"
    DRIVER_DASHBOARD_VIEW = "driver_dashboard.view"
    ANALYTICS_VIEW = "analytics.view"
    
    # Godown & Inventory Management
    GODOWN_CREATE = "godown.create"
    GODOWN_READ = "godown.read"
    GODOWN_UPDATE = "godown.update"
    GODOWN_DELETE = "godown.delete"
    
    INVENTORY_CREATE = "inventory.create"
    INVENTORY_READ = "inventory.read"
    INVENTORY_UPDATE = "inventory.update"
    INVENTORY_DELETE = "inventory.delete"
    
    # Settings
    SETTINGS_VIEW = "settings.view"
    SETTINGS_UPDATE = "settings.update"


class RolePermissions:
    """Central permissions matrix for all roles"""
    
    ROLE_PERMISSIONS: Dict[str, List[Permission]] = {
        # ADMIN - Full access to everything
        "admin": [perm for perm in Permission],
        
        # SALES - Project creation, client management, vendor selection
        "sales": [
            Permission.CLIENT_CREATE,
            Permission.CLIENT_READ,
            Permission.CLIENT_UPDATE,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_READ,
            Permission.PROJECT_UPDATE,
            Permission.CAMPAIGN_READ,
            Permission.VENDOR_READ,
            Permission.REPORT_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # PURCHASE - Budget confirmation, vendor costing
        "purchase": [
            Permission.VENDOR_CREATE,
            Permission.VENDOR_READ,
            Permission.VENDOR_UPDATE,
            Permission.PROJECT_READ,
            Permission.CAMPAIGN_READ,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # CLIENT_SERVICING - Project ownership, operations assignment
        "client_servicing": [
            Permission.CLIENT_READ,
            Permission.PROJECT_CREATE,
            Permission.PROJECT_READ,
            Permission.PROJECT_UPDATE,
            Permission.CAMPAIGN_CREATE,
            Permission.CAMPAIGN_READ,
            Permission.CAMPAIGN_UPDATE,
            Permission.VENDOR_READ,
            Permission.VEHICLE_READ,
            Permission.DRIVER_READ,
            Permission.PROMOTER_READ,
            Permission.PROMOTER_ACTIVITY_READ,
            Permission.REPORT_CREATE,
            Permission.REPORT_READ,
            Permission.REPORT_UPDATE,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
            Permission.CLIENT_SERVICING_DASHBOARD_VIEW,
        ],
        
        # OPERATIONS_MANAGER - Campaign execution and monitoring
        "operations_manager": [
            Permission.PROJECT_READ,
            Permission.CAMPAIGN_CREATE,
            Permission.CAMPAIGN_READ,
            Permission.CAMPAIGN_UPDATE,
            Permission.VEHICLE_CREATE,
            Permission.VEHICLE_READ,
            Permission.VEHICLE_UPDATE,
            Permission.DRIVER_CREATE,
            Permission.DRIVER_READ,
            Permission.DRIVER_UPDATE,
            Permission.PROMOTER_CREATE,
            Permission.PROMOTER_READ,
            Permission.PROMOTER_UPDATE,
            Permission.EXPENSE_READ,
            Permission.REPORT_READ,
            Permission.DRIVER_DASHBOARD_VIEW,  # Can view all driver dashboards
            Permission.DASHBOARD_VIEW,
        ],
        
        # OPERATOR - Coordination of vans, vendors, drivers
        "operator": [
            Permission.CAMPAIGN_READ,
            Permission.CAMPAIGN_UPDATE,
            Permission.VEHICLE_READ,
            Permission.VEHICLE_UPDATE,
            Permission.DRIVER_READ,
            Permission.DRIVER_UPDATE,
            Permission.VENDOR_READ,
            Permission.PROMOTER_READ,
            Permission.PROMOTER_UPDATE,
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # DRIVER - Vehicle movement, GPS, KM tracking, expenses
        "driver": [
            Permission.CAMPAIGN_READ,  # Only assigned campaigns
            Permission.VEHICLE_READ,   # Only assigned vehicle
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,   # Only own expenses
            Permission.DRIVER_DASHBOARD_VIEW,  # Own driver dashboard
            Permission.DASHBOARD_VIEW,
        ],
        
        # PROMOTER - Activity data, footfall, photos (can create but NOT edit)
        "promoter": [
            Permission.CAMPAIGN_READ,  # Only assigned campaigns
            Permission.PROMOTER_READ,  # Only own data
            Permission.PROMOTER_UPDATE,
            Permission.PROMOTER_ACTIVITY_CREATE,  # Can add new activities
            Permission.PROMOTER_ACTIVITY_READ,     # Can view activities
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,
            Permission.REPORT_CREATE,
            Permission.REPORT_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # ANCHOR - Campaign hosting confirmation
        "anchor": [
            Permission.CAMPAIGN_READ,  # Only assigned campaigns
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # VENDOR - Vehicles, drivers, invoices
        "vendor": [
            Permission.CAMPAIGN_READ,  # Only assigned campaigns
            Permission.VEHICLE_CREATE,
            Permission.VEHICLE_READ,
            Permission.VEHICLE_UPDATE,
            Permission.DRIVER_CREATE,
            Permission.DRIVER_READ,
            Permission.DRIVER_UPDATE,
            Permission.INVOICE_CREATE,
            Permission.INVOICE_READ,
            Permission.INVOICE_UPDATE,
            Permission.PAYMENT_READ,
            Permission.VENDOR_DASHBOARD_VIEW,
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # VEHICLE_MANAGER - Vehicle health and documents
        "vehicle_manager": [
            Permission.VEHICLE_CREATE,
            Permission.VEHICLE_READ,
            Permission.VEHICLE_UPDATE,
            Permission.DRIVER_READ,
            Permission.CAMPAIGN_READ,
            Permission.EXPENSE_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # GODOWN_MANAGER - Inventory movement and godown management
        "godown_manager": [
            Permission.CAMPAIGN_READ,
            Permission.PROJECT_READ,
            Permission.DASHBOARD_VIEW,
            Permission.GODOWN_CREATE,
            Permission.GODOWN_READ,
            Permission.GODOWN_UPDATE,
            Permission.GODOWN_DELETE,
            Permission.INVENTORY_CREATE,
            Permission.INVENTORY_READ,
            Permission.INVENTORY_UPDATE,
            Permission.INVENTORY_DELETE,
        ],
        
        # ACCOUNTS - Expense approval and payments
        "accounts": [
            Permission.PROJECT_READ,
            Permission.CAMPAIGN_READ,
            Permission.VENDOR_READ,
            Permission.EXPENSE_CREATE,
            Permission.EXPENSE_READ,
            Permission.EXPENSE_UPDATE,
            Permission.EXPENSE_APPROVE,
            Permission.INVOICE_READ,
            Permission.INVOICE_APPROVE,
            Permission.PAYMENT_CREATE,
            Permission.PAYMENT_READ,
            Permission.PAYMENT_UPDATE,
            Permission.REPORT_READ,
            Permission.DASHBOARD_VIEW,
        ],
        
        # CLIENT - View reports only (read-only)
        "client": [
            Permission.PROJECT_READ,   # Only own projects
            Permission.CAMPAIGN_READ,  # Only own campaigns
            Permission.REPORT_READ,    # Only own reports
            Permission.DASHBOARD_VIEW,
        ],
    }
    
    @classmethod
    def get_permissions(cls, role: str) -> List[Permission]:
        """Get all permissions for a given role"""
        return cls.ROLE_PERMISSIONS.get(role, [])
    
    @classmethod
    def has_permission(cls, role: str, permission: Permission) -> bool:
        """Check if a role has a specific permission"""
        role_perms = cls.get_permissions(role)
        return permission in role_perms
    
    @classmethod
    def can_read(cls, role: str, resource: str) -> bool:
        """Check if role can read a resource"""
        read_perm = Permission(f"{resource}.read")
        return cls.has_permission(role, read_perm)
    
    @classmethod
    def can_write(cls, role: str, resource: str) -> bool:
        """Check if role can create/update a resource"""
        create_perm = Permission(f"{resource}.create")
        update_perm = Permission(f"{resource}.update")
        return (cls.has_permission(role, create_perm) or 
                cls.has_permission(role, update_perm))


# Simplified role groups for common permission checks
ROLES_WITH_CLIENT_ACCESS = [
    "admin", "sales", "client_servicing"
]

ROLES_WITH_PROJECT_WRITE = [
    "admin", "sales", "client_servicing"
]

ROLES_WITH_CAMPAIGN_WRITE = [
    "admin", "client_servicing", "operations_manager", "operator"
]

ROLES_WITH_EXPENSE_APPROVAL = [
    "admin", "accounts"
]

ROLES_WITH_USER_MANAGEMENT = [
    "admin"
]

ROLES_WITH_SETTINGS_ACCESS = [
    "admin"
]

# Frontend menu visibility matrix
MENU_VISIBILITY = {
    "admin": ["dashboard", "clients", "projects", "campaigns", "vendors", "vendor-dashboard", "client-servicing-dashboard", "driver-dashboard", "vehicles", "drivers", "promoters", "promoter-activities", "operations", "expenses", "reports", "accounts", "analytics", "settings"],
    "sales": ["dashboard", "clients", "projects", "campaigns", "vendors", "reports"],
    "purchase": ["dashboard", "vendors", "projects", "campaigns"],
    "client_servicing": ["dashboard", "client-servicing-dashboard", "clients", "projects", "campaigns", "reports", "operations", "vendors", "vehicles"],
    "operations_manager": ["dashboard", "driver-dashboard", "projects", "campaigns", "operations", "drivers", "vehicles", "promoters", "promoter-activities", "expenses", "reports"],
    "operator": ["dashboard", "campaigns", "operations", "drivers", "vehicles", "vendors", "promoters", "promoter-activities"],
    "driver": ["dashboard", "driver-dashboard", "expenses", "campaigns"],
    "promoter": ["dashboard", "campaigns", "promoter-activities", "reports", "expenses"],
    "anchor": ["dashboard", "events", "campaigns", "promoter-activities"],
    "vendor": ["vendor-dashboard", "campaigns", "vehicles", "drivers"],
    "vehicle_manager": ["dashboard", "vehicles", "drivers", "maintenance"],
    "godown_manager": ["dashboard", "inventory", "stock", "campaigns"],
    "accounts": ["dashboard", "expenses", "payments", "reports", "projects", "campaigns", "vendors"],
    "client": ["dashboard", "reports", "projects", "campaigns"],
}
