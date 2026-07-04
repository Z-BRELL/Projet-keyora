# 🔑 ADMIN & MODERATOR - QUICK REFERENCE

## LOGIN CREDENTIALS

### ADMIN
```
Email:    admin@keyora.com
Password: Admin123!
```

### MODERATOR  
```
Email:    moderateur@keyora.com
Password: Modo123!
```

---

## DASHBOARDS

| Role | URL | Features |
|------|-----|----------|
| **ADMIN** | `http://localhost:3000/dashboard/admin-super` | Moderation + Users + Blog |
| **MODERATOR** | `http://localhost:3000/dashboard/moderation` | Listing Moderation Only |

---

## ADMIN FEATURES ✅

1. **📋 Listing Moderation Tab**
   - View pending listings
   - Approve button (publish)
   - Reject button (with reason)

2. **👥 User Management Tab**
   - View all sellers
   - View all buyers
   - See activity stats

3. **✍️ Blog Management Tab**
   - View blog posts
   - Edit posts
   - Delete posts

---

## MODERATOR FEATURES ✅

1. **Moderation Queue**
   - View pending listings
   - Approve/reject listings
   - Provide rejection reasons

**Cannot access:**
- User management
- Blog management
- Admin dashboard

---

## COMPLETE FLOW

### Create & Moderate Listing

1. **Register SELLER**
   - Go to: `/auth/register`
   - Role: Seller

2. **Create Listing (as SELLER)**
   - Click "Publier une annonce"
   - Fill details
   - Upload photos
   - Submit for moderation

3. **Moderate (as MODERATOR or ADMIN)**
   - Login as: `moderateur@keyora.com` or `admin@keyora.com`
   - Go to moderation dashboard
   - See pending listing
   - Approve → Published
   - Or reject → Reason saved

4. **Seller Receives Notification**
   - Email with approval or rejection reason
   - If approved: listing visible to buyers
   - If rejected: can edit and resubmit

---

## FEATURES IMPLEMENTED ✅

| Feature | ADMIN | MODERATOR | Status |
|---------|-------|-----------|--------|
| Login | ✅ | ✅ | WORKING |
| Moderation | ✅ | ✅ | WORKING |
| User Management | ✅ | ❌ | WORKING |
| Blog Management | ✅ | ❌ | WORKING |
| Role Protection | ✅ | ✅ | WORKING |
| Rejection Reasons | ✅ | ✅ | WORKING |

---

## 🚀 START TESTING NOW

1. Go to: `http://localhost:3000`
2. Login as: `admin@keyora.com` / `Admin123!`
3. Click "Admin Dashboard"
4. Explore 3 tabs

**Or test Moderator:**
1. Logout
2. Login as: `moderateur@keyora.com` / `Modo123!`
3. See only moderation queue

Both roles are **FULLY OPERATIONAL** ✅
