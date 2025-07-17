# 🚀 Claw Machine Store - Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create M0 FREE cluster
- [ ] Create database user: `clawstore` / `clawstore123`
- [ ] Set IP whitelist to `0.0.0.0/0`
- [ ] Copy connection string

### 2. Update Connection String
- [ ] Update `backend/production.env` with your MongoDB connection string
- [ ] Replace `cluster0.xxxxx.mongodb.net` with your actual cluster URL

## ✅ Backend Deployment (Railway)

### 1. Deploy to Railway
- [ ] Go to [Railway.app](https://railway.app/)
- [ ] Sign up/login with GitHub
- [ ] Click "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Choose `backend` folder as root directory

### 2. Set Environment Variables
Add these environment variables in Railway:
```
MONGODB_URI=mongodb+srv://clawstore:clawstore123@cluster0.xxxxx.mongodb.net/clawstore?retryWrites=true&w=majority
JWT_SECRET=claw-machine-super-secret-jwt-key-2024-production-ready-secure-token
NODE_ENV=production
PORT=3000
```

### 3. Test Backend
- [ ] Visit `https://your-app.railway.app/health`
- [ ] Should return: `{"status":"healthy"}`

## ✅ Admin Dashboard Deployment (Vercel)

### 1. Deploy to Vercel
- [ ] Go to [Vercel.com](https://vercel.com/)
- [ ] Import from GitHub
- [ ] Select your repository
- [ ] Set root directory to `admin-web`
- [ ] Framework: Create React App

### 2. Set Environment Variables
Add this environment variable in Vercel:
```
REACT_APP_API_URL=https://your-backend.railway.app/api
```

### 3. Test Admin Dashboard
- [ ] Visit `https://your-admin.vercel.app`
- [ ] Login with: `admin` / `admin123`
- [ ] Verify data loads from backend

## ✅ Update URLs After Deployment

### 1. Update Tablet App API URL
Edit `tablet-app/App.js` line 30:
```javascript
const CLOUD_API_URL = 'https://your-actual-railway-url.railway.app/api';
```

### 2. Update Backend CORS
Edit `backend/production.env` line 13:
```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

Then redeploy backend to Railway.

## ✅ APK Build (EAS CLI)

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login and Configure
```bash
eas login
eas build:configure
```

### 3. Build APK
```bash
eas build --platform android
```

### 4. Download APK
- [ ] Download APK from EAS dashboard
- [ ] Install on Android device
- [ ] Test offline functionality
- [ ] Test online sync

## ✅ Final Testing

### 1. System Integration Test
- [ ] Backend health check: `https://your-backend.railway.app/health`
- [ ] Admin dashboard: Login and verify data
- [ ] APK: Install and test POS functionality
- [ ] Sync test: Make sale offline, go online, verify sync

### 2. Production Checklist
- [ ] Change default admin password
- [ ] Test all payment methods
- [ ] Verify inventory tracking
- [ ] Test analytics dashboard
- [ ] Backup database

## 🎉 Go Live!

Your claw machine store is now live with:
- ✅ Cloud backend on Railway
- ✅ Admin dashboard on Vercel
- ✅ Android APK for tablet POS
- ✅ Offline-first architecture
- ✅ Real-time sync

## 📞 Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Test MongoDB Atlas connection
4. Verify all environment variables are set correctly

## 🔗 Quick Links

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard  
- MongoDB Atlas: https://cloud.mongodb.com/
- EAS Build Dashboard: https://expo.dev/

---

🎯 **Estimated Total Time: 45-60 minutes** 