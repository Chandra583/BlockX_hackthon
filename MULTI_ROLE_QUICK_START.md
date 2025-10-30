# Multi-Role System - Quick Start Guide

## ✅ Implementation Complete

All tasks have been completed successfully. The multi-role system is fully functional.

---

## 🚀 Quick Test (5 minutes)

### Step 1: Update Test User
```bash
cd backend
node scripts/update-user-roles.js
```
This updates user `buyer@veridrive.com` to have roles `["buyer", "owner"]`.

### Step 2: Start Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 3: Test in Browser
1. **Login**: Navigate to `http://localhost:5173/login`
   - Email: `buyer@veridrive.com`
   - Password: Your password
   
2. **Check Role Selector**: Look in the header (top-right, before notifications)
   - You should see a role selector dropdown with Owner/Buyer options

3. **Switch Roles**:
   - Click the role selector
   - Select "Owner"
   - Watch the URL change to `/owner/dashboard`
   - Sidebar updates to show owner-specific items

4. **Verify Headers** (DevTools → Network):
   - Make any API call
   - Check request headers
   - Should see: `X-Active-Role: owner`

5. **Switch to Buyer**:
   - Click role selector again
   - Select "Buyer"
   - Routes to `/buyer/dashboard`
   - Headers now show: `X-Active-Role: buyer`

---

## ✅ What Was Implemented

### Frontend
✅ Added `selectedRole` to Redux auth state  
✅ Created `RoleSelector` component in header  
✅ Added `X-Active-Role` header to all API requests  
✅ Updated Sidebar to render based on `selectedRole`  
✅ Updated ProtectedRoute for role-based access  
✅ Fixed login routing for multi-role users  

### Backend
✅ Added `X-Active-Role` header validation in auth middleware  
✅ Normalized `roles` array (backward compatible)  
✅ Set `req.activeRole` for controllers  
✅ Updated vehicle routes to use `req.activeRole`  
✅ Added proper 403 error for unauthorized roles  

### Tests
✅ Created unit tests for X-Active-Role validation  
✅ All 4 tests passing ✓  

---

## 📊 Test Results

```
 PASS  src/__tests__/auth-middleware-active-role.test.ts
  Auth Middleware - X-Active-Role Validation
    ✓ should set activeRole from X-Active-Role header when user has that role
    ✓ should reject when X-Active-Role is not in users roles array
    ✓ should default to first role when no X-Active-Role header is provided
    ✓ should normalize single role to roles array for backward compatibility

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        2.049 s
```

---

## 🔍 Key Features

1. **Role Switching**: Users can switch between their assigned roles via header dropdown
2. **Smart Routing**: Auto-routes to correct dashboard based on selected role
3. **API Security**: Backend validates X-Active-Role header against user's roles
4. **Backward Compatible**: Single-role users work exactly as before
5. **Persistent**: Selected role saved to localStorage
6. **Visual Feedback**: Toast notifications on role switch

---

## 📝 Files Changed

**Frontend (9 files)**
- `src/store/slices/authSlice.ts`
- `src/services/api.ts`
- `src/components/layout/RoleSelector.tsx` (NEW)
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/services/auth.ts`

**Backend (3 files)**
- `src/middleware/auth.middleware.ts`
- `src/types/express.d.ts`
- `src/routes/vehicle/vehicle.routes.ts`

**Tests (1 file)**
- `src/__tests__/auth-middleware-active-role.test.ts` (NEW)

---

## 🐛 Troubleshooting

### Role selector not showing?
→ User needs multiple roles in `roles` array

### Getting 403 errors?
→ Check if selected role is in user's `roles` array  
→ Check backend logs for "Active role not permitted" message

### Dashboard showing wrong data?
→ Verify `X-Active-Role` header in Network tab  
→ Check localStorage: `localStorage.getItem('selectedRole')`

### Sidebar not updating?
→ Ensure `selectedRole` is set in Redux state  
→ Check that Sidebar uses `selectedRole` from `useAppSelector`

---

## 📚 Full Documentation

See `MULTI_ROLE_IMPLEMENTATION_SUMMARY.md` for:
- Detailed implementation notes
- Complete QA checklist (10 scenarios)
- API examples with curl commands
- Architecture decisions
- Acceptance criteria

---

## ✨ Success Criteria Met

✅ X-Active-Role header flows end-to-end  
✅ Owner dashboard shows owner-specific data  
✅ Unauthorized role returns 403  
✅ Shared pages (marketplace) accessible  
✅ All tests passing  
✅ Backward compatible  

---

## 🎉 Ready for Production

The implementation is complete and tested. You can now:
1. Commit changes to git
2. Create pull request with branch `fix/multi-role-routing`
3. Deploy to staging for QA team testing
4. Deploy to production after QA approval

---

## Support

- Implementation Summary: `MULTI_ROLE_IMPLEMENTATION_SUMMARY.md`
- Quick Start: `MULTI_ROLE_QUICK_START.md` (this file)
- Tests: `backend/src/__tests__/auth-middleware-active-role.test.ts`

