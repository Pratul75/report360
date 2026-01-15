# Deployment Guide

## Production Deployment

### Prerequisites

- Docker & Docker Compose
- MongoDB Atlas or self-hosted MongoDB
- SSL certificates
- Domain name

### Environment Setup

#### 1. Backend Environment (.env)

```bash
# Production settings
APP_NAME="Fleet Operations Platform"
VERSION="1.0.0"
API_V1_PREFIX="/api/v1"

# Database
MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/"
DB_NAME="fleet_operations_prod"

# Security (Generate secure keys!)
SECRET_KEY="your-super-secret-key-min-32-chars"
JWT_SECRET_KEY="your-jwt-secret-key-min-32-chars"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# ML Service
ML_SERVICE_URL="http://ml-service:8002"

# OpenAI (Optional)
OPENAI_API_KEY="sk-..."
```

#### 2. Frontend Environment (.env.production)

```bash
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### Docker Deployment

#### 1. Build Images

```bash
# Build backend
cd backend
docker build -t fleetops-backend:1.0.0 .

# Build frontend
cd frontend
docker build -t fleetops-frontend:1.0.0 .

# Build ML service
cd ml-service
docker build -t fleetops-ml:1.0.0 .
```

#### 2. Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: fleetops-backend:1.0.0
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=${MONGO_URL}
      - DB_NAME=${DB_NAME}
      - SECRET_KEY=${SECRET_KEY}
    restart: always
    
  frontend:
    image: fleetops-frontend:1.0.0
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=${BACKEND_URL}
    restart: always
    
  ml-service:
    image: fleetops-ml:1.0.0
    ports:
      - "8002:8002"
    volumes:
      - ml-data:/app/ml-service/data
    restart: always

volumes:
  ml-data:
```

#### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

#### 1. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleetops-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fleetops-backend
  template:
    metadata:
      labels:
        app: fleetops-backend
    spec:
      containers:
      - name: backend
        image: fleetops-backend:1.0.0
        ports:
        - containerPort: 8001
        env:
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: fleetops-secrets
              key: mongo-url
```

#### 2. Service & Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fleetops-backend
spec:
  selector:
    app: fleetops-backend
  ports:
  - port: 80
    targetPort: 8001
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fleetops-ingress
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fleetops-backend
            port:
              number: 80
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Health Checks

```bash
# Backend
curl https://api.yourdomain.com/health

# ML Service
curl https://ml.yourdomain.com/health
```

### Monitoring

#### 1. Application Logs

```bash
# Docker logs
docker-compose logs -f backend

# Kubernetes logs
kubectl logs -f deployment/fleetops-backend
```

#### 2. Metrics (Prometheus + Grafana)

Add prometheus-fastapi-instrumentator to backend

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

### Backup Strategy

#### MongoDB Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGO_URL" --out=/backups/$DATE
tar -czf /backups/$DATE.tar.gz /backups/$DATE
rm -rf /backups/$DATE

# Keep last 30 days
find /backups -name "*.tar.gz" -mtime +30 -delete
```

### SSL/TLS

```bash
# Let's Encrypt with certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Performance Optimization

1. **Enable Gzip**
2. **CDN for static assets**
3. **Database indexing**
4. **Redis caching**
5. **Load balancing**

### Security Checklist

- [ ] HTTPS enabled
- [ ] Secure environment variables
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SQL injection protection
- [ ] XSS prevention
- [ ] Regular security updates
- [ ] Firewall rules
- [ ] API authentication
- [ ] Input validation

### Maintenance

#### Zero-Downtime Deployment

```bash
# Rolling update
kubectl rollout restart deployment/fleetops-backend

# Monitor rollout
kubectl rollout status deployment/fleetops-backend
```

#### Database Migrations

For future SQL migration:

```bash
alembic upgrade head
```

### Troubleshooting

#### Backend Not Starting

1. Check logs: `docker logs fleetops-backend`
2. Verify environment variables
3. Test MongoDB connection
4. Check port availability

#### High Memory Usage

1. Monitor with `docker stats`
2. Optimize queries
3. Add caching
4. Scale horizontally

### Support

For deployment issues, contact devops@fleetops.com
