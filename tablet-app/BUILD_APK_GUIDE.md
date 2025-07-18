# Yanoi POS - APK Build Guide

## Prerequisites
1. Make sure you have an Expo account (create one at https://expo.dev if you don't have one)
2. Your backend API is running at: `https://claw-machine-backend.onrender.com`

## Step-by-Step Build Process

### 1. Open Terminal and Navigate to Project
```bash
cd /Users/pranav.arora/claw-machine-store/tablet-app
```

### 2. Set npm to bypass SSL issues (if needed)
```bash
npm config set strict-ssl false
```

### 3. Login to Expo
```bash
npx eas-cli login
```
- Enter your Expo username and password when prompted

### 4. Configure EAS Build (if first time)
```bash
npx eas-cli build:configure
```

### 5. Build APK
```bash
npx eas-cli build --platform android --profile preview
```

### 6. Alternative: Production Build
```bash
npx eas-cli build --platform android --profile production
```

## What happens during build:
- The app will be built in the cloud
- You'll get a link to download the APK
- Build usually takes 5-10 minutes

## Your App Configuration:
- **App Name**: Yanoi POS
- **Package**: com.yanoi.pos
- **Backend API**: https://claw-machine-backend.onrender.com
- **Admin Credentials**: admin / Yanoi@2025

## Alternative: Expo Web Build
If CLI doesn't work, you can also:
1. Upload your project to GitHub (already done)
2. Connect your GitHub to Expo at https://expo.dev
3. Build through the web interface

## Troubleshooting:
- If you get SSL errors, use: `npm config set strict-ssl false`
- If login fails, try: `npx eas-cli logout` then `npx eas-cli login`
- If build fails, check the logs in the provided URL

## Testing the APK:
1. Download the APK from the build link
2. Install it on your Android tablet
3. Connect to the same network as your backend
4. Login with: admin / Yanoi@2025 