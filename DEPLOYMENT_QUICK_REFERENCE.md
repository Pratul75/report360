# Live Server Deployment - Quick Reference

## Server को ये दो चीज़ें दीजिए:

### 1️⃣ File: `.env` (Server के लिए)
```env
# Database
MYSQL_ROOT_PASSWORD=your-strong-password
MYSQL_DATABASE=fleet_operations_prod
MYSQL_USER=fleet_user_prod
MYSQL_PASSWORD=your-strong-password

# Security (IMPORTANT - generate करो!)
SECRET_KEY=abcd1234efGh_ijK-lmN5oPqRsT6UvWxYz7AaBbCcDd
JWT_SECRET_KEY=xyz123AbCd_EfGh-IjKL5mNoPqRsT6UvWxYz7AaBbC

# URLs (अपने domain के साथ)
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_ML_SERVICE_URL=https://your-domain.com/ml

# CORS
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false

# Optional
OPENAI_API_KEY=sk-your-key (अगर ML features चाहिए)
```

### 2️⃣ Code files:
```
/backend
/frontend
/ml-service
/docker-compose.yml
```

---

## 🚀 Server पर Deploy करने के लिए:

```bash
# 1. Server पर जाओ
ssh user@your-server.com

# 2. Project folder में जाओ
cd /opt/report360

# 3. Code pull करो (git से)
git clone https://github.com/your-repo/report360.git
cd report360

# 4. .env file बनाओ
nano .env
# ऊपर दिए गए values paste करो
# अपने values के साथ update करो
# Ctrl+X, Y, Enter से save करो

# 5. Docker containers start करो
docker compose --env-file .env up -d

# 6. Status check करो
docker compose ps
docker compose logs -f backend
```

---

## 🔐 Secret Keys Generate करना

```bash
# Terminal पर run करो:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# ऐसा output आएगा:
# abcd1234EfGh_IJK-LmN5oPqRsT6UvWxYz7AaBbCcDdEeFfGgHh

# इसे SECRET_KEY में paste करो
# फिर दोबारा generate करो JWT_SECRET_KEY के लिए
```

---

## ✅ Deployment के बाद verify करो:

```bash
# Health check
curl https://your-domain.com/health

# Backend is running?
curl https://your-domain.com/api/health

# Frontend accessible?
curl https://your-domain.com

# Logs देखो
docker compose logs --tail=50 backend
```

---

## 📋 Checklist:

- [ ] Strong passwords generate किए (min 16 chars)?
- [ ] Secret keys generate किए?
- [ ] Domain name update किया REACT_APP_API_URL में?
- [ ] CORS_ORIGINS update किया?
- [ ] ENVIRONMENT=production किया?
- [ ] .env file को git में commit नहीं किया?
- [ ] HTTPS/SSL certificate install किया?
- [ ] Database backup plan बना दी?

---

## 🆘 Troubleshooting:

| Problem | Solution |
|---------|----------|
| Login failing | Check SECRET_KEY और JWT_SECRET_KEY |
| CORS error | Update CORS_ORIGINS with your domain |
| Database error | Check MYSQL_PASSWORD और host |
| Frontend can't reach API | Check REACT_APP_API_URL |
| 404 on pages | Check REACT_APP_API_URL path |

---

## 📞 Need Help?

1. Check [PRODUCTION_ENV_GUIDE.md](PRODUCTION_ENV_GUIDE.md) for detailed info
2. Check `.env.production.example` for all available variables
3. Check backend logs: `docker compose logs backend`
4. Check frontend logs: `docker compose logs frontend`

---

**Happy Deployment!** 🎉
