# API Contracts

## Authentication

### POST /api/v1/auth/register
Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "password": "securepassword",
  "role": "admin"
}
```

**Response:** 201 Created
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "admin",
  "is_active": true,
  "created_at": "2025-12-30T10:00:00Z"
}
```

### POST /api/v1/auth/login
Login and get access token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### GET /api/v1/auth/me
Get current user information

**Headers:** `Authorization: Bearer <token>`

**Response:** 200 OK
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin",
  "is_active": true,
  "created_at": "2025-12-30T10:00:00Z"
}
```

## Dashboard

### GET /api/v1/dashboard/stats
Get dashboard statistics

**Response:**
```json
{
  "active_projects": 15,
  "running_campaigns": 8,
  "vehicles_on_ground": 45,
  "todays_expense": 125000.50,
  "pending_expenses": 12,
  "pending_payments": 5
}
```

## Campaigns

### POST /api/v1/campaigns
Create a new campaign

**Request:**
```json
{
  "name": "Mumbai Metro Campaign",
  "description": "L-shape campaign for metro stations",
  "project_id": "507f1f77bcf86cd799439011",
  "campaign_type": "l_shape",
  "start_date": "2025-01-15",
  "end_date": "2025-02-15",
  "budget": 500000,
  "locations": "Andheri, Bandra, Dadar"
}
```

**Response:** 201 Created
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Mumbai Metro Campaign",
  "status": "planning",
  "campaign_type": "l_shape",
  "created_at": "2025-12-30T10:00:00Z"
}
```

### GET /api/v1/campaigns
List all campaigns

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "Mumbai Metro Campaign",
    "status": "running",
    "campaign_type": "l_shape",
    "budget": 500000
  }
]
```

## More endpoints documented at /docs (Swagger UI)
