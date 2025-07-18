# Yanoi POS - Security Guide

## 🔒 Security Features Implemented

### 1. **No Hardcoded Credentials**
- ✅ **Removed all hardcoded passwords** from the app
- ✅ **No default credentials** exposed in source code
- ✅ **Secure credential handling** with proper form validation

### 2. **Multi-Store Security**
- ✅ **Store-specific authentication** - each store has its own credentials
- ✅ **Isolated data** - products, sales, and users are separated by store
- ✅ **Secure store switching** with proper logout/login flow

### 3. **Token-Based Authentication**
- ✅ **JWT tokens** for secure API communication
- ✅ **Automatic token refresh** handling
- ✅ **Secure token storage** using device secure storage

### 4. **Data Protection**
- ✅ **Encrypted local database** storage
- ✅ **Secure API communication** over HTTPS
- ✅ **Password fields** are properly secured and cleared after use

## 🛡️ Security Best Practices

### **For Store Managers:**

1. **Strong Passwords**
   - Use passwords with at least 12 characters
   - Include uppercase, lowercase, numbers, and symbols
   - Example: `StorePass2024!@#`

2. **Regular Password Updates**
   - Change passwords every 90 days
   - Don't reuse previous passwords
   - Use different passwords for each store

3. **Device Security**
   - Use device lock screens (PIN, password, fingerprint)
   - Keep apps updated
   - Only install from official app stores

4. **Network Security**
   - Use secure Wi-Fi networks
   - Avoid public Wi-Fi for POS operations
   - Enable VPN if available

### **For Store Owners:**

1. **Backend Security**
   - Regularly update your admin password
   - Monitor user access logs
   - Use environment variables for sensitive data

2. **Store Management**
   - Create unique credentials for each store location
   - Regularly audit store access
   - Remove access for inactive stores

3. **Data Backup**
   - Regular database backups
   - Secure backup storage
   - Test backup restoration

## 🔐 Security Configuration

### **Store Setup Security:**

1. **Main Store Setup**
   ```
   Store Name: Yanoi Main Store
   Username: admin
   Password: [Your Secure Password]
   ```

2. **Branch Store Setup**
   ```
   Store Name: Yanoi Branch 1
   Username: branch1_admin
   Password: [Unique Secure Password]
   ```

3. **Custom Store Setup**
   ```
   Store Name: [Your Custom Name]
   Username: [Custom Username]
   Password: [Unique Secure Password]
   API URL: https://claw-machine-backend.onrender.com/api
   ```

### **Environment Variables (Backend):**
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword2024!
ADMIN_EMAIL=admin@yourstore.com
JWT_SECRET=your-super-secure-jwt-secret
MONGODB_URI=your-mongodb-connection-string
```

## 🚨 Security Warnings

### **⚠️ NEVER DO:**
- ❌ Don't hardcode passwords in the app
- ❌ Don't share credentials via insecure channels
- ❌ Don't use simple passwords like "123456"
- ❌ Don't use the same password for multiple stores
- ❌ Don't leave devices unlocked and unattended

### **✅ ALWAYS DO:**
- ✅ Use strong, unique passwords for each store
- ✅ Enable device lock screens
- ✅ Log out when not in use
- ✅ Keep the app updated
- ✅ Use secure networks

## 🔍 Security Monitoring

### **What to Monitor:**
- Failed login attempts
- Unusual data access patterns
- Network connection issues
- Unexpected store access

### **Regular Security Checks:**
1. **Monthly**: Review store access logs
2. **Quarterly**: Update passwords
3. **Semi-annually**: Security audit
4. **Annually**: Full security review

## 🆘 Security Incident Response

### **If Security is Compromised:**

1. **Immediate Actions:**
   - Change all passwords immediately
   - Logout all devices
   - Check recent sales data
   - Contact IT support

2. **Investigation:**
   - Review access logs
   - Check for unauthorized transactions
   - Verify data integrity
   - Document the incident

3. **Recovery:**
   - Restore from secure backup if needed
   - Update security procedures
   - Train staff on new procedures
   - Monitor for recurring issues

## 📞 Support Contacts

### **Security Issues:**
- **Email**: security@yanoi.com
- **Phone**: [Your Support Number]
- **Emergency**: [24/7 Support Number]

### **Technical Support:**
- **Email**: support@yanoi.com
- **Documentation**: [Your Documentation URL]
- **GitHub**: https://github.com/Arora018/claw-machine-store

## 📋 Security Checklist

### **Before Going Live:**
- [ ] All default passwords changed
- [ ] Environment variables configured
- [ ] HTTPS enabled for all connections
- [ ] Device lock screens enabled
- [ ] Staff trained on security procedures
- [ ] Backup procedures tested
- [ ] Access logs monitoring set up
- [ ] Incident response plan documented

### **Regular Maintenance:**
- [ ] Monthly password rotation
- [ ] Quarterly security updates
- [ ] Semi-annual staff training
- [ ] Annual security audit

---

**Remember: Security is everyone's responsibility. When in doubt, ask for help!** 