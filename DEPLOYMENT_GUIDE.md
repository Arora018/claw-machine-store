# 🚀 Claw Machine Store - Cloud Deployment Guide

## Architecture Overview

The system consists of:
1. **Backend API** - Node.js/Express + MongoDB Atlas (deployed to Railway/Render)
2. **Admin Dashboard** - React web app (deployed to Vercel/Netlify)
3. **Tablet APK** - React Native app with offline SQLite storage

## 🎯 Quick Deploy to Cloud

### Step 1: Setup MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free account and cluster
3. In Security > Network Access: Add IP `0.0.0.0/0` (allow all) for development
4. In Security > Database Access: Create user `clawstore` with password `clawstore123`
5. Get connection string from Connect > Connect your application

### Step 2: Deploy Backend to Railway (Free)

1. Go to [Railway.app](https://railway.app/)
2. Connect your GitHub account
3. Deploy from GitHub repo (or import this project)
4. Add environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=production
   PORT=3000
   ```
5. Deploy! Your API will be at `https://your-app-name.railway.app`

### Step 3: Deploy Admin Dashboard to Vercel (Free)

1. Go to [Vercel.com](https://vercel.com/)
2. Import your GitHub repo
3. Set build settings:
   - Framework: Create React App
   - Root Directory: `admin-web`
   - Build Command: `npm run build`
   - Install Command: `npm install`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy! Your dashboard will be at `https://your-admin.vercel.app`

### Step 4: Build APK

1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`
4. Update `tablet-app/App.js` line 17:
   ```javascript
   const CLOUD_API_URL = 'https://your-backend.railway.app/api';
   ```
5. Build APK: `eas build --platform android`
6. Download and install APK on tablet

## 🔧 Alternative Cloud Platforms

### Backend Deployment Options:

**Railway.app (Recommended)**
- Zero config deployment
- Automatic HTTPS
- Built-in PostgreSQL/MongoDB
- Free tier: 512MB RAM, $5 credit/month

**Render.com**
- Free tier available
- Auto-deploys from Git
- Built-in database options
- Use `render.yaml` config provided

**Heroku**
- Classic platform
- Easy deployment
- Add-ons available
- Free tier discontinued (paid plans start $5/month)

**Fly.io**
- Modern platform
- Global deployment
- Docker-based
- Free allowances

### Frontend Deployment Options:

**Vercel (Recommended for React)**
- Optimized for React/Next.js
- Automatic CI/CD
- Global CDN
- Free tier generous

**Netlify**
- Easy drag-and-drop deployment
- Form handling
- Serverless functions
- Free tier available

**GitHub Pages**
- Free hosting
- Direct from repository
- Custom domains
- Simple setup

## 📱 APK Build Options

### Expo EAS Build (Recommended)
```bash
cd tablet-app
npx eas-cli@latest build --platform android
```

### Local Build with Expo
```bash
cd tablet-app
expo build:android
```

### React Native CLI Build
```bash
cd tablet-app
npx react-native run-android --variant=release
```

## 🔐 Security Configuration

### Production Environment Variables

**Backend (.env)**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=long-random-secret-key-minimum-32-characters
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-admin-dashboard.vercel.app
```

**Admin Dashboard (.env)**
```bash
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_ENV=production
```

### MongoDB Atlas Security
1. Enable IP Whitelist (add `0.0.0.0/0` for development)
2. Use strong passwords
3. Enable database auditing
4. Regular backups

### API Security
- JWT tokens expire in 24 hours
- CORS configured for specific domains
- Rate limiting enabled
- Input validation on all endpoints

## 🚀 Deployment Commands

### Quick Deploy Backend
```bash
# Clone and setup
git clone <your-repo>
cd backend
npm install
cp production.env .env
# Edit .env with your MongoDB URI
npm start
```

### Quick Deploy Admin Dashboard
```bash
cd admin-web
npm install
npm run build
# Deploy build folder to Vercel/Netlify
```

### Build and Test APK
```bash
cd tablet-app
npm install
expo install
# Update API URL in App.js
expo build:android
```

## 🔍 Testing Your Deployment

### Backend Health Check
```bash
curl https://your-backend.railway.app/health
```

### API Test
```bash
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Admin Dashboard Test
1. Visit `https://your-admin.vercel.app`
2. Login with `admin` / `admin123`
3. Check if data loads from cloud API

### APK Test
1. Install APK on Android device
2. Test offline functionality
3. Test sync when connected to internet

## 📊 Monitoring & Maintenance

### Railway Monitoring
- Check logs in Railway dashboard
- Monitor usage and limits
- Set up alerts for downtime

### Database Monitoring
- MongoDB Atlas provides built-in monitoring
- Set up alerts for connection issues
- Regular data backups

### Error Tracking
- Add Sentry for error tracking
- Monitor API response times
- Track user sessions and crashes

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway deploy
```

## 📞 Support & Troubleshooting

### Common Issues:

**MongoDB Connection Failed**
- Check IP whitelist in Atlas
- Verify connection string
- Check network connectivity

**APK Not Installing**
- Enable "Unknown Sources" in Android settings
- Check APK compatibility
- Verify signing certificate

**Admin Dashboard Blank**
- Check API URL configuration
- Verify CORS settings
- Check network connectivity

### Getting Help:
- Check Railway/Vercel logs for deployment issues
- Use browser DevTools for frontend issues
- Check MongoDB Atlas logs for database issues

---

## 🎉 You're Ready!

Once deployed, you'll have:
- ✅ Cloud backend API accessible worldwide
- ✅ Admin dashboard for managing the store
- ✅ Offline-capable APK for tablets
- ✅ Automatic data sync between all components
- ✅ Scalable architecture for growth

Your claw machine store is now cloud-ready! 🚀 