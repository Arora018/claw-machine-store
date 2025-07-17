# 🎯 Claw Machine Store Management System

A complete **cloud-first** Point of Sale and inventory management system for claw machine stores.

## 🏗️ Architecture

```
📱 Tablet APK (React Native)    🌐 Admin Dashboard (React)
        |                               |
        |          🔗 API Calls         |
        |                               |
        └─────────── 🚀 Cloud API Backend (Node.js + MongoDB Atlas)
                          |
                    📊 Real-time Analytics
```

## ✨ Features

### 📱 **Tablet POS App (APK)**
- ✅ **Offline-first** with SQLite storage
- ✅ Product catalog with prices in ₹ (Indian Rupees)
- ✅ Shopping cart with quantity controls
- ✅ Multiple payment methods (Cash, UPI, Card)
- ✅ **Auto-sync** when internet available
- ✅ Real-time connection status
- ✅ Session persistence

### 🌐 **Admin Web Dashboard**
- ✅ Sales analytics and reporting
- ✅ Product management (CRUD operations)
- ✅ Real-time data synchronization
- ✅ Excel export functionality
- ✅ Machine inventory tracking
- ✅ User authentication & authorization

### 🚀 **Cloud Backend API**
- ✅ MongoDB Atlas cloud database
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Bulk sync endpoints for offline data
- ✅ RESTful API design
- ✅ **Deploy-ready** for Railway/Render/Heroku

## 🚀 Quick Start

### 1. **Deploy to Cloud** (Recommended)

Follow the complete guide: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

**Quick Deploy:**
1. **Backend**: Deploy to [Railway.app](https://railway.app) (free)
2. **Admin**: Deploy to [Vercel.com](https://vercel.com) (free)
3. **APK**: Build with `eas build --platform android`

### 2. **Local Development**

```bash
# 1. Start Backend
cd backend
npm install
cp production.env .env  # Edit with your MongoDB URI
npm start                # Runs on :3000

# 2. Start Admin Dashboard
cd admin-web
npm install
npm start                # Runs on :3001

# 3. Start Tablet App
cd tablet-app
npm install
expo start               # Scan QR code or run on emulator
```

## 📁 Project Structure

```
claw-machine-store/
├── 📂 backend/                 # Cloud API Server
│   ├── server.js              # Express + MongoDB
│   ├── package.json           # Dependencies
│   ├── Dockerfile             # Container config
│   ├── railway.json           # Railway deployment
│   └── render.yaml            # Render deployment
│
├── 📂 admin-web/              # React Dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── services/api.js    # API client
│   │   └── contexts/          # React contexts
│   ├── package.json
│   └── env.example            # Environment template
│
├── 📂 tablet-app/             # React Native APK
│   ├── App.js                 # Main app with SQLite
│   ├── package.json           # Dependencies + SQLite
│   └── eas.json               # APK build config
│
└── 📄 DEPLOYMENT_GUIDE.md      # Complete deployment guide
```

## 🔧 Technology Stack

### Backend
- **Node.js** + **Express.js** - REST API
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Admin Dashboard
- **React 18** - Frontend framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation

### Tablet App
- **React Native** + **Expo** - Mobile framework
- **React Native Paper** - UI components
- **SQLite** - Offline storage
- **AsyncStorage** - Local preferences
- **NetInfo** - Network detection

## 🌍 Cloud Deployment

### Supported Platforms

| Platform | Backend | Frontend | Database | Cost |
|----------|---------|----------|----------|------|
| **Railway** | ✅ | ❌ | MongoDB Atlas | Free tier |
| **Vercel** | ❌ | ✅ | - | Free |
| **Render** | ✅ | ✅ | PostgreSQL/MongoDB | Free tier |
| **Netlify** | ❌ | ✅ | - | Free |
| **Heroku** | ✅ | ✅ | MongoDB Atlas | $5+/month |

### Environment Variables

**Backend:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-secret-key
NODE_ENV=production
```

**Frontend:**
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

## 📱 APK Building

### Using EAS (Recommended)
```bash
cd tablet-app
npm install -g @expo/eas-cli
eas login
eas build --platform android
```

### Using Expo CLI
```bash
cd tablet-app
expo build:android
```

## 🔐 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Input validation
- ✅ Role-based access control
- ✅ Secure MongoDB Atlas connection

## 📊 Data Flow

```
🏪 Claw Machine Store
    ↓
📱 Tablet POS (Offline SQLite)
    ↓ (Auto-sync when online)
🌐 Cloud Backend API
    ↓
📊 Admin Dashboard (Real-time)
```

## 🎯 Use Cases

1. **Offline Sales**: Tablet works without internet
2. **Real-time Analytics**: Dashboard shows live data
3. **Multi-location**: Deploy once, use anywhere
4. **Scalable**: Cloud infrastructure grows with business
5. **Cost-effective**: Free tiers available

## 🚀 Getting Started

1. **Read**: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)
2. **Deploy**: Backend to Railway, Frontend to Vercel
3. **Build**: APK with EAS
4. **Test**: Complete system end-to-end

## 📞 Support

- 📖 **Documentation**: See `DEPLOYMENT_GUIDE.md`
- 🐛 **Issues**: Check logs in cloud platform dashboards
- 💡 **Features**: Fully offline-capable with cloud sync

---

## 🎉 Features Summary

✅ **Cloud-ready** - Deploy to Railway/Vercel in minutes  
✅ **Offline-first** - Works without internet connection  
✅ **Real-time sync** - Automatic data synchronization  
✅ **Multi-platform** - Web dashboard + Android APK  
✅ **Secure** - JWT auth + MongoDB Atlas  
✅ **Free hosting** - Use free tiers of cloud platforms  
✅ **Production-ready** - Complete business solution  

**Perfect for claw machine store owners who want a modern, cloud-based POS system! 🎯** # MongoDB connection fixed Thu Jul 17 16:06:22 IST 2025
