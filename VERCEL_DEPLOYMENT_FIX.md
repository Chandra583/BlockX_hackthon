# URGENT: Vercel Deployment Fix - Routes Not Found

## 🚨 Critical Issue
All API routes are returning **NOT_FOUND** error. This is because Vercel Root Directory is not configured.

## ✅ Solution: Configure Vercel Root Directory

### Step 1: Set Root Directory in Vercel Dashboard

1. **Go to Vercel Project Settings:**
   ```
   https://vercel.com/chandrashekhargowdas-projects/veridrive-x-hackthon/settings/general
   ```

2. **Scroll to "Root Directory" section**

3. **Click "Edit" button**

4. **Enter:** `backend`

5. **Click "Save"**

6. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - OR push a new commit to trigger deployment

### Why This Is Critical

Without setting Root Directory to `backend`:
- ❌ Vercel looks for `api/index.ts` at repo root (doesn't exist)
- ❌ It tries to use other files as entry points
- ❌ All routes return NOT_FOUND

With Root Directory set to `backend`:
- ✅ Vercel finds `backend/api/index.ts` correctly
- ✅ All routes work as expected
- ✅ Database connections initialize properly

---

## 🧪 Test After Configuration

### 1. Wait for deployment (~2 minutes)

### 2. Test Root Endpoint
```bash
curl https://veridrive-x-hackthon.vercel.app/
```
**Expected:** Welcome JSON message

### 3. Test Health Check
```bash
curl https://veridrive-x-hackthon.vercel.app/api/health
```
**Expected:** `{"status":"ok","db":"connected",...}`

### 4. Test Info Endpoint
```bash
curl https://veridrive-x-hackthon.vercel.app/api/info
```
**Expected:** Full API information JSON

### 5. Test Registration
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "owner"
  }'
```
**Expected:** Registration success with token

### 6. Test Login
```bash
curl -X POST https://veridrive-x-hackthon.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** Login success with JWT token

---

## 📸 Visual Guide

### Finding Root Directory Setting:

1. **Vercel Dashboard** → Your Project → **Settings**
2. Scroll to **General** section
3. Look for **Root Directory**
4. Default is empty (repository root)
5. Change to: `backend`
6. Click **Save**

### What You Should See:

**Before (❌ Wrong):**
```
Root Directory: [empty]
```

**After (✅ Correct):**
```
Root Directory: backend
```

---

## 🔍 Verify Configuration

After setting Root Directory and redeploying, check the build logs:

**Good Signs:**
- ✅ `Building api/index.ts`
- ✅ `Installing dependencies from package.json`
- ✅ `Compiling TypeScript files`
- ✅ `Build completed successfully`

**Bad Signs:**
- ❌ `No Output Directory found`
- ❌ `Cannot find module`
- ❌ Build looking for files in wrong location

---

## 🚀 Alternative: Environment Variable Method (If UI doesn't work)

If you can't find the Root Directory setting in UI:

### Using Vercel CLI:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set root directory
vercel --cwd backend
```

### Or use `vercel.json` at repo root:

Create `/vercel.json`:
```json
{
  "buildCommand": "cd backend && npm install",
  "outputDirectory": "backend",
  "installCommand": "cd backend && npm install"
}
```

But **UI configuration is preferred and more reliable.**

---

## 📞 If Still Not Working

1. **Clear Vercel Build Cache:**
   - Settings → General → Build & Development Settings
   - Click "Clear Build Cache"
   - Redeploy

2. **Check Environment Variables:**
   - Settings → Environment Variables
   - Ensure `MONGODB_URI` is set
   - Ensure `JWT_SECRET` is set

3. **Check Deployment Logs:**
   - Go to Deployments
   - Click on latest deployment
   - Check "Building" and "Functions" logs for errors

4. **Verify `package.json` exists:**
   - Should be at `backend/package.json`
   - Should have all dependencies listed

---

## ✅ Success Checklist

After configuration, verify these all work:

- [ ] `GET /` returns welcome JSON
- [ ] `GET /api/health` returns health status
- [ ] `GET /api/info` returns API information
- [ ] `POST /api/auth/register` creates user
- [ ] `POST /api/auth/login` returns JWT token
- [ ] `GET /api/vehicles` (with auth) returns vehicles or empty array

---

## 📧 Support

If the issue persists after setting Root Directory:
1. Screenshot the Root Directory setting showing "backend"
2. Share the deployment logs
3. Share the error response from curl/Postman

---

**⚠️ CRITICAL:** The Root Directory MUST be set to `backend` for the deployment to work. This is the #1 most common issue with monorepo deployments on Vercel.

