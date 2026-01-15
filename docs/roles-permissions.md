# Roles and Permissions

## User Roles

### 1. Admin
**Full System Access**
- All CRUD operations
- User management
- System configuration
- All reports and analytics

### 2. Client Servicing
**Client & Project Management**
- Create/edit clients and projects
- View all campaigns
- Access reports
- Limited expense approval

**Restrictions:**
- Cannot manage vendors/vehicles/drivers
- Cannot approve payments

### 3. Operations Manager
**Operational Execution**
- Create/manage campaigns
- Assign vehicles, drivers, promoters
- Upload execution reports
- Manage expenses

**Restrictions:**
- Cannot create clients/projects
- Cannot approve payments
- Read-only access to analytics

### 4. Accounts
**Financial Management**
- View all expenses
- Approve/reject expenses
- Manage payments
- Financial reports

**Restrictions:**
- Cannot create campaigns
- Cannot manage operations
- Read-only access to clients/projects

### 5. Vendor
**Limited Vendor Access**
- View assigned campaigns
- Upload invoices
- Track payments
- View own vehicles/drivers

**Restrictions:**
- Cannot see other vendors
- Cannot approve anything
- Limited to assigned work

### 6. Client
**Read-Only Client Access**
- View own projects
- View campaign progress
- Download reports
- Track budget utilization

**Restrictions:**
- Read-only access
- Cannot create/edit anything
- Cannot see other clients

## Permission Matrix

| Resource | Admin | Client Servicing | Operations | Accounts | Vendor | Client |
|----------|-------|------------------|------------|----------|--------|--------|
| Clients | CRUD | CRUD | R | R | - | R (own) |
| Projects | CRUD | CRUD | R | R | - | R (own) |
| Campaigns | CRUD | CRUD | CRUD | R | R (assigned) | R (own) |
| Vendors | CRUD | R | CRUD | R | R (self) | - |
| Vehicles | CRUD | R | CRUD | R | R (own) | - |
| Drivers | CRUD | R | CRUD | R | R (own) | - |
| Expenses | CRUD | R | CRUD | CRU (approve) | CR | R (own) |
| Reports | CRUD | R | CRUD | R | R (own) | R (own) |
| Payments | CRUD | R | R | CRUD | R (own) | - |
| Analytics | R | R | R | R | - | R (own) |
| Settings | CRUD | - | - | - | - | - |

**Legend:**
- C = Create
- R = Read
- U = Update
- D = Delete
- - = No Access

## Implementation

Permissions are enforced at multiple levels:

1. **API Level** - FastAPI dependencies check roles
2. **Service Level** - Business logic validates permissions
3. **UI Level** - React components conditionally render

## Example Usage

```python
# In API endpoint
from app.core.permissions import Permission

@router.post("/campaigns")
async def create_campaign(
    data: CampaignCreate,
    current_user = Depends(Permission.require_operations())
):
    # Only admin and operations_manager can create campaigns
    pass
```
