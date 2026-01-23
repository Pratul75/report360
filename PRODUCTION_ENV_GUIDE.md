# Production Deployment - Environment Variables Guide

## जब आप Live Server पर Deploy करोगे तो क्या करना है?

### 📋 Step 1: Environment Variables तैयार करो

Server के लिए एक `.env` file बनाना होगा। Template के लिए `.env.production.example` देखो।

---

## 🔐 जरूरी Variables (MUST HAVE)

### 1. **Database Configuration**
```env
MYSQL_ROOT_PASSWORD=very-strong-password-min-16-chars
MYSQL_DATABASE=fleet_operations_prod
MYSQL_USER=fleet_user_prod
MYSQL_PASSWORD=very-strong-password-min-16-chars
```
**क्यों:** Database को connect करने के लिए
**कहाँ से:** आपका database server credentials

---

### 2. **Secret Keys** ⭐ (सबसे जरूरी)
```env
SECRET_KEY=generate-random-secure-key-32-chars
JWT_SECRET_KEY=generate-random-secure-key-32-chars
```
**कैसे generate करो:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
**क्यों:** User authentication और security के लिए
**⚠️ WARNING:** Production में हमेशा CHANGE करो! Local के same secrets न रखो!

---

### 3. **Frontend URLs**
```env
REACT_APP_API_URL=https://your-live-domain.com/api
REACT_APP_ML_SERVICE_URL=https://your-live-domain.com/ml
```
**क्यों:** Frontend को backend URL पता चलेगा
**कहाँ से:** आपका live server domain

---

### 4. **CORS Origins** (Frontend को allow करने के लिए)
```env
CORS_ORIGINS=https://your-live-domain.com,https://www.your-live-domain.com
```
**क्यों:** जो domains से requests आएंगी उन्हें allow करना
**उदाहरण:** `https://report360.rechargestudio.com`

---

### 5. **Environment Type**
```env
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false
```
**क्यों:** Production में error handling सही तरीके से काम करे

---

## 📱 Optional लेकिन उपयोगी Variables

### ML Service (AI features के लिए)
```env
OPENAI_API_KEY=sk-your-openai-api-key
```
**कहाँ से:** https://platform.openai.com/api-keys

### Email Configuration (Notifications के लिए)
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

---

## 📦 Server पर Deploy करने का Process

### **Option 1: Docker Compose के साथ (Recommended)**

```bash
# Server पर जाओ
ssh your-server

# Project directory में जाओ
cd /path/to/report360

# .env file बनाओ
nano .env

# Content paste करो (ऊपर दिए गए values के साथ)
# अपने values के साथ update करो
# Ctrl+X, Y, Enter से save करो

# Containers start करो
docker compose --env-file .env up -d
```

---

## ✅ Pre-Deployment Checklist

- [ ] Database credentials set किए?
- [ ] Secret keys generate और change किए?
- [ ] Frontend URLs सही दिए?
- [ ] CORS origins में अपना domain add किया?
- [ ] HTTPS enabled है?
- [ ] Database backup plan है?
- [ ] Logs monitoring setup है?
- [ ] Error tracking (Sentry) setup किया?

---

## 🚨 Security Best Practices

### ❌ NEVER करो:
```
❌ .env file को git में commit न करो
❌ Production secrets को hardcode न करो
❌ Same secrets local और production में न रखो
❌ Weak passwords न use करो
❌ HTTP का use न करो (HTTPS use करो)
```

### ✅ DO करो:
```
✅ Strong, unique passwords (min 16 chars)
✅ Secrets को securely store करो
✅ Regular database backups लो
✅ Logs को monitor करो
✅ SSL certificate install करो
✅ Firewall configure करो
```

---

## 🔧 Database Initial Setup

```bash
# Server पर Docker container में जाओ
docker compose exec backend python

# Python में
from auth import get_password_hash
password = "admin_initial_password"
hash = get_password_hash(password)
print(hash)
```

फिर यह hash अपने database में admin user के लिए use करो।

---

## 📊 Server Requirements

Minimum specs:
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB (logs के लिए और data के लिए)
- **Database:** MySQL 8.0 या ऊपर
- **Node.js:** 18+ (अगर frontend separate host पर है)
- **Python:** 3.11+

---

## 🔍 Health Check

Deploy करने के बाद check करो:

```bash
# Backend health
curl https://your-domain.com/health

# Frontend accessibility
curl https://your-domain.com

# Database connection
docker compose logs backend | grep "database"
```

---

## 📞 Common Issues और Solutions

### Issue: "Could not validate credentials"
**Solution:** JWT_SECRET_KEY correctly set है?

### Issue: "CORS error"
**Solution:** CORS_ORIGINS में आपका frontend domain है?

### Issue: "Database connection failed"
**Solution:** Database credentials सही हैं? Database running है?

### Issue: "Frontend showing 404"
**Solution:** REACT_APP_API_URL सही है?

---

## 📝 Environment Variables Summary

| Variable | Live Server Value | Where From |
|----------|------------------|-----------|
| MYSQL_ROOT_PASSWORD | Strong password | Generate |
| MYSQL_USER | fleet_user_prod | Any name |
| MYSQL_PASSWORD | Strong password | Generate |
| SECRET_KEY | Random 32 chars | Generate |
| JWT_SECRET_KEY | Random 32 chars | Generate |
| REACT_APP_API_URL | https://your-domain/api | Your domain |
| CORS_ORIGINS | https://your-domain | Your domain |
| ENVIRONMENT | production | Fixed |
| LOG_LEVEL | INFO | Fixed |

---

## 🎯 Next Steps

1. `.env.production.example` को reference के रूप में use करो
2. अपने values के साथ `.env` file बनाओ
3. Server पर safely store करो
4. Docker compose के साथ deploy करो
5. Health check करो
6. Logs monitor करो

**Good to go!** 🚀
