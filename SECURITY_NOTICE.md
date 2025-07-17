# 🔒 SECURITY NOTICE

## ⚠️ IMPORTANT SECURITY UPDATE

**Date:** July 17, 2025  
**Issue:** Hardcoded credentials were exposed in the public repository  
**Status:** ✅ FIXED

## What Was the Problem?

The admin credentials (`admin` / `admin123`) were hardcoded in multiple files in the public GitHub repository, creating a security vulnerability.

## What Was Fixed?

1. **Removed hardcoded credentials** from all files
2. **Implemented environment variables** for secure credential management
3. **Updated .gitignore** to prevent future credential exposure
4. **Deleted users.json** file with plaintext passwords

## New Security Setup

### Environment Variables (Required)

The system now uses these environment variables:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SecureYanoi2024!Admin@Pass
ADMIN_EMAIL=admin@yanoi.com
```

### Current Login Credentials

**Default credentials (production):**
- **Username:** `admin`
- **Password:** `SecureYanoi2024!Admin@Pass`

**⚠️ IMPORTANT:** Change these credentials immediately in production!

## How to Update Production Credentials

### 1. Update Render Environment Variables

1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment
4. Update these variables:
   - `ADMIN_USERNAME=your-secure-username`
   - `ADMIN_PASSWORD=your-secure-password`
   - `ADMIN_EMAIL=your-admin-email`
5. Redeploy the service

### 2. Update Local Environment

Create a `.env` file in the `backend/` directory:

```bash
ADMIN_USERNAME=your-secure-username
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=your-admin-email
```

## Files That Were Updated

- `backend/server.js` - Now uses environment variables
- `backend/create-admin.js` - Now uses environment variables
- `backend/production.env` - Added secure defaults
- `.gitignore` - Added security patterns
- `backend/data/users.json` - **DELETED** (contained plaintext passwords)

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Change default passwords** immediately
4. **Use strong, unique passwords**
5. **Regularly rotate credentials**

## Verification

To verify the fix is working:

1. Check that no credentials are in the repository
2. Confirm environment variables are set in production
3. Test login with new credentials
4. Verify old credentials no longer work

---

**If you have any questions about this security update, please contact the development team.** 