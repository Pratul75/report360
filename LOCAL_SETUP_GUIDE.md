# Local Development Setup Guide

## Project Successfully Running! ✅

Your **Report360** project is now running locally with all services up and healthy.

---

## 📋 Running Services

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend (React)** | http://localhost:3002 | 3002 | ✅ Running |
| **Backend API** | http://localhost:8003 | 8003 | ✅ Running |
| **ML Service** | http://localhost:8002 | 8002 | ✅ Running |
| **MySQL Database** | localhost | 3309 | ✅ Running |
| **phpMyAdmin** | http://localhost:8080 | 8080 | ✅ Running |

---

## 🔧 Environment Configuration

A `.env.local` file has been created with the following settings:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=root_local_123
MYSQL_DATABASE=fleet_operations_local
MYSQL_USER=fleet_user
MYSQL_PASSWORD=fleet_pass_local

# Backend Configuration
SECRET_KEY=local-secret-key-change-in-production
JWT_SECRET_KEY=local-jwt-secret-key-change-in-production
ENVIRONMENT=development
LOG_LEVEL=DEBUG

# CORS Configuration (Allow local frontend)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8003/api
REACT_APP_ML_SERVICE_URL=http://localhost:8002/ml
```

---

## 🚀 Available Commands

### Start All Services
```bash
docker compose --env-file .env.local up -d
```

### Stop All Services
```bash
docker compose --env-file .env.local down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose logs -f ml-service
```

### Restart Services
```bash
# All services
docker compose --env-file .env.local restart

# Specific service
docker compose --env-file .env.local restart backend
```

### Stop Without Removing (Pause)
```bash
docker compose stop
```

### Remove Everything (Clean Up)
```bash
docker compose --env-file .env.local down -v  # -v removes volumes
```

---

## 📝 Database Access

### phpMyAdmin
- **URL**: http://localhost:8080
- **Username**: fleet_user
- **Password**: fleet_pass_local
- **Host**: mysql

### Direct MySQL Connection
```bash
# From host machine
mysql -h 127.0.0.1 -P 3309 -u fleet_user -p fleet_operations_local
# Password: fleet_pass_local
```

---

## 🔍 Testing the Setup

### Check Backend Health
```bash
curl http://localhost:8003/health
```

### Access Frontend
Open your browser and go to:
```
http://localhost:3002
```

### API Endpoint Example
```bash
curl http://localhost:8003/api/health
```

---

## 📁 Project Structure

```
report360/
├── backend/              # FastAPI Backend (Python)
│   ├── app/             # Application code
│   ├── migrations/       # Database migrations
│   ├── Dockerfile       # Backend container config
│   └── requirements.txt  # Python dependencies
├── frontend/            # React Frontend
│   ├── src/            # React source code
│   ├── public/         # Static files
│   ├── Dockerfile      # Frontend container config
│   └── package.json    # NPM dependencies
├── ml-service/         # ML Service (Python)
│   └── app/           # ML application code
├── docker-compose.yml  # Services orchestration
└── .env.local         # Local environment config
```

---

## 💡 Development Tips

### Making Changes
1. **Backend**: Modify files in `backend/` - Docker volumes mount them, so changes auto-reload
2. **Frontend**: Modify files in `frontend/src/` - Changes auto-reload with React hot reload
3. **Database**: Schema changes use Alembic migrations in `backend/alembic/`

### Database Migrations
```bash
# Run migrations from inside backend container
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "migration_name"
```

### Fresh Start
```bash
# Remove everything and start fresh
docker compose --env-file .env.local down -v
docker compose --env-file .env.local up -d
```

---

## ⚠️ Common Issues

### Ports Already in Use
If ports are already in use, modify `docker-compose.yml`:
- Frontend: Change `127.0.0.1:3002` to `127.0.0.1:3003` (example)
- Backend: Change `127.0.0.1:8003` to `127.0.0.1:8004` (example)
- MySQL: Change `127.0.0.1:3309` to `127.0.0.1:3310` (example)

### MySQL Connection Failed
Ensure MySQL container has started:
```bash
docker compose logs mysql
```

### Container Won't Start
View detailed logs:
```bash
docker compose logs <service_name>
```

---

## 🔐 Security Notes

⚠️ **These are LOCAL DEVELOPMENT credentials only!**

For production:
- Change all passwords in environment variables
- Use strong secrets for JWT and SECRET_KEY
- Update CORS_ORIGINS to your production domain
- Review and secure all API endpoints
- Enable HTTPS
- Use environment-specific .env files

---

## 📞 Next Steps

1. ✅ Services are running
2. Open http://localhost:3002 in your browser
3. Log in with your credentials
4. Make your changes to the code
5. Test locally before deploying to production
6. Use `git` to version control changes
7. Deploy to production when ready

---

**Good to go! Happy coding! 🎉**
