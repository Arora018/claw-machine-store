# 📱 Yanoi POS APK Build Guide

## 🚀 **QUICK START - 3 Easy Ways to Build APK**

### **Option 1: GitHub Actions (Recommended)**
✅ **No local setup required**  
✅ **Cloud-based building**  
✅ **No SSL certificate issues**  

**Steps:**
1. Go to: https://github.com/Arora018/claw-machine-store/actions
2. Click "Build APK" workflow
3. Click "Run workflow"
4. Select "preview" or "production"
5. Click "Run workflow"
6. Wait for build completion (~5-10 minutes)
7. Download APK from artifacts

**Required Setup (One-time):**
- Create Expo account: https://expo.dev/signup
- Get token: https://expo.dev/accounts/settings/access-tokens
- Add token to GitHub Secrets: `EXPO_TOKEN`

### **Option 2: Expo Web Interface**
✅ **Simple web-based building**  
✅ **No command line needed**  

**Steps:**
1. Go to: https://expo.dev/signup (create account)
2. Create new project: "yanoi-pos"
3. Upload your code or connect GitHub
4. Click "Build" → "Android" → "APK"
5. Download APK when ready

### **Option 3: Online APK Builder**
✅ **No Expo account needed**  
✅ **Direct upload**  

**Steps:**
1. Go to: https://appetize.io/ or https://snack.expo.dev/
2. Upload your tablet-app folder
3. Build APK directly

## 📋 **App Configuration**

Your app is already configured with:
- **App Name**: Yanoi POS
- **Package**: com.yanoi.pos
- **Version**: 1.0.0
- **Backend**: https://claw-machine-backend.onrender.com/api
- **Icon**: ✅ Ready
- **Splash Screen**: ✅ Ready

## 🔧 **If You Want to Build Locally**

### **Requirements:**
- Node.js 18+
- Android Studio (for Android builds)
- Expo CLI
- Java Development Kit (JDK)

### **Commands:**
```bash
# Install dependencies
cd tablet-app
npm install

# Build APK (requires Expo account)
npx eas build --platform android --profile preview

# Alternative: Legacy build (if available)
npx expo build:android
```

## 📱 **Testing Your APK**

1. **Download APK** from any method above
2. **Install on Android device**:
   - Enable "Unknown sources" in Settings
   - Install APK file
   - Open "Yanoi POS" app

3. **Test login**:
   - Username: `admin`
   - Password: `Yanoi@2025`

## 🔒 **Security Notes**

- APK is signed with development certificate
- For production, use production build profile
- Store credentials are secure (environment variables)
- All API calls use HTTPS

## 📞 **Support**

If you encounter issues:
1. Check GitHub Actions logs
2. Verify internet connection
3. Ensure all dependencies are installed
4. Contact support with error details

## 📈 **Next Steps**

After building APK:
1. Test on multiple devices
2. Collect user feedback
3. Monitor performance
4. Plan updates

---

**🎯 Recommended: Use GitHub Actions for fastest, most reliable builds!** 