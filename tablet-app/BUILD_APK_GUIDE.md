# Yanoi POS - Universal APK Build Guide

## 📱 App Overview

**Yanoi POS** is now a **universal app** that works on:
- ✅ **Android Tablets** (landscape and portrait)
- ✅ **Android Phones** (adaptive UI)
- ✅ **Multiple Store Locations** (multi-tenant)
- ✅ **Secure Authentication** (no hardcoded credentials)

## 🔧 Prerequisites

1. **Expo Account**: Create one at https://expo.dev
2. **Backend API**: https://claw-machine-backend.onrender.com (✅ Live)
3. **Admin Dashboard**: https://yanoi-admin-dashboard.vercel.app (✅ Live)
4. **Node.js and npm**: Latest version installed

## 📋 App Configuration

### **Current Settings:**
- **App Name**: Yanoi POS
- **Package**: com.yanoi.pos
- **Version**: 1.0.0
- **Orientation**: Default (supports all orientations)
- **Platform**: Android (Phone & Tablet compatible)

### **Backend Integration:**
- **API URL**: https://claw-machine-backend.onrender.com/api
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: JWT tokens
- **Sync**: Automatic cloud sync when online

## 🏪 Multi-Store Support

### **Predefined Stores:**
1. **Yanoi Main Store** - Main Location
2. **Yanoi Branch 1** - Branch Location 1
3. **Yanoi Branch 2** - Branch Location 2
4. **Custom Store** - User-configurable

### **Store Features:**
- Individual login credentials per store
- Separate product catalogs
- Isolated sales data
- Store-specific settings

## 🔐 Security Features

### **✅ Security Implemented:**
- No hardcoded credentials
- Secure token-based authentication
- Store-specific data isolation
- Encrypted local storage
- Automatic password clearing
- Secure network communication

### **🔒 Credentials Setup:**
Each store requires its own credentials:
- **Main Store**: admin / [Your Secure Password]
- **Branch 1**: branch1_admin / [Unique Password]
- **Branch 2**: branch2_admin / [Unique Password]
- **Custom**: [Your Username] / [Your Password]

## 🚀 Step-by-Step Build Process

### **1. Open Terminal**
```bash
cd /Users/pranav.arora/claw-machine-store/tablet-app
```

### **2. Set npm Configuration (if SSL issues)**
```bash
npm config set strict-ssl false
```

### **3. Login to Expo**
```bash
npx eas-cli login
```
- Enter your Expo username and password
- Create account at https://expo.dev if needed

### **4. Configure EAS Build (first time only)**
```bash
npx eas-cli build:configure
```

### **5. Build APK Options**

#### **Option A: Preview Build (Recommended)**
```bash
npx eas-cli build --platform android --profile preview
```

#### **Option B: Production Build**
```bash
npx eas-cli build --platform android --profile production
```

#### **Option C: Development Build**
```bash
npx eas-cli build --platform android --profile development
```

### **6. Monitor Build Progress**
- Build process takes 5-10 minutes
- You'll receive a link to download the APK
- Monitor progress in the terminal or Expo dashboard

## 🌐 Alternative: Web Build Interface

### **If CLI doesn't work:**

1. **Go to**: https://expo.dev
2. **Login** to your account
3. **Create new project** or **import from GitHub**
4. **Connect Repository**: https://github.com/Arora018/claw-machine-store
5. **Select Path**: `/tablet-app`
6. **Build Settings**:
   - Platform: Android
   - Build Type: APK
   - Profile: Preview or Production

## 📱 APK Installation & Setup

### **1. Download APK**
- Download from the build link provided
- Transfer to your Android device

### **2. Install APK**
- Enable "Unknown Sources" in Android settings
- Install the APK file
- Grant necessary permissions

### **3. First-Time Setup**
1. **Open Yanoi POS**
2. **Select Store** from the list or create custom
3. **Login** with your credentials
4. **Test** basic functionality

### **4. Multi-Store Setup**
1. **Main Store**: Set up with admin credentials
2. **Branch Stores**: Create unique credentials for each
3. **Custom Stores**: Configure API URLs and credentials
4. **Switch Stores**: Use the store menu to switch between locations

## 🧪 Testing Checklist

### **Device Compatibility:**
- [ ] Test on Android tablet (landscape)
- [ ] Test on Android tablet (portrait)
- [ ] Test on Android phone (portrait)
- [ ] Test on Android phone (landscape)

### **Store Functionality:**
- [ ] Store selection screen works
- [ ] Login with correct credentials
- [ ] Product loading and display
- [ ] Add items to cart
- [ ] Process sales (cash, card, UPI)
- [ ] Offline mode functionality
- [ ] Data sync when online

### **Security Testing:**
- [ ] No hardcoded credentials visible
- [ ] Password fields are secure
- [ ] Store data is isolated
- [ ] Logout clears sensitive data
- [ ] Store switching works properly

## 🔧 Troubleshooting

### **SSL Certificate Issues:**
```bash
npm config set strict-ssl false
npm config set registry https://registry.npmjs.org/
```

### **Login Issues:**
```bash
npx eas-cli logout
npx eas-cli login
```

### **Build Failures:**
- Check the build logs in the provided URL
- Verify all dependencies are installed
- Ensure package.json is valid

### **APK Won't Install:**
- Enable "Unknown Sources" in Android settings
- Check available storage space
- Verify APK file is not corrupted

## 📊 App Performance

### **Optimizations:**
- Responsive UI for all screen sizes
- Offline-first architecture
- Efficient data sync
- Minimal battery usage
- Fast startup times

### **System Requirements:**
- **Android**: 5.0 (API 21) or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 100MB free space
- **Network**: Wi-Fi or mobile data for sync

## 🎯 Production Deployment

### **Before Production:**
1. **Test thoroughly** on all target devices
2. **Set up secure credentials** for all stores
3. **Configure backend** with production settings
4. **Train staff** on security procedures
5. **Set up monitoring** and backup procedures

### **Production Build:**
```bash
npx eas-cli build --platform android --profile production
```

### **Distribution:**
- Upload to internal app store
- Distribute APK directly to devices
- Use mobile device management (MDM) for multiple devices

## 📞 Support

### **Technical Support:**
- **GitHub**: https://github.com/Arora018/claw-machine-store
- **Documentation**: See project README
- **Issues**: Create GitHub issues for bugs

### **Security Support:**
- **Guide**: See `SECURITY_GUIDE.md`
- **Best Practices**: Follow security checklist
- **Incident Response**: Follow security procedures

---

**🎉 Congratulations! You now have a universal, secure, multi-store POS system that works on both phones and tablets!** 