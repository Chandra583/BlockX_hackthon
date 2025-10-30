# Vercel Deployment Setup Instructions

## Critical Configuration Required

Your Vercel project **MUST** have the Root Directory set to `backend` for the deployment to work correctly.

### Steps to Configure Vercel:

1. **Go to your Vercel Project Settings:**
   - Visit: https://vercel.com/chandrashekhargowdas-projects/veridrive-x-hackthon/settings
   - Or: Dashboard → Your Project → Settings

2. **Update Root Directory:**
   - Navigate to: **Settings** → **General** → **Root Directory**
   - Click **Edit**
   - Set Root Directory to: `backend`
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click the **•••** menu on the latest deployment
   - Select **Redeploy**
   - Or just push a new commit to trigger auto-deployment

### Why This Is Required

- The serverless function entry point is `backend/api/index.ts`
- Dependencies are installed from `backend/package.json`
- Without setting Root Directory to `backend`, Vercel looks for files in the wrong location
- This causes the "No Output Directory" error

### What Should Happen After Configuration

Once Root Directory is set to `backend`:
- Vercel will automatically detect `api/index.ts` as a serverless function
- TypeScript will be compiled automatically
- The function will be accessible at: https://veridrive-x-hackthon.vercel.app/api/health

### Environment Variables

Make sure these are set in Vercel Project Settings → Environment Variables:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Your JWT secret key
- `JWT_REFRESH_SECRET` - Your JWT refresh secret
- `NODE_ENV` - Set to `production`
- `FRONTEND_URL` - Your frontend URL
- `CORS_ORIGIN` - Your CORS origin

### Testing After Deployment

```bash
# Health check (should return JSON with status: ok)
curl https://veridrive-x-hackthon.vercel.app/api/health

# API info
curl https://veridrive-x-hackthon.vercel.app/api/info
```

### Troubleshooting

If deployment still fails after setting Root Directory:
1. Check build logs for TypeScript errors
2. Verify all environment variables are set
3. Clear Vercel build cache: Settings → General → Clear Cache
4. Redeploy with cache cleared

---

**IMPORTANT:** The root `vercel.json` has been removed. The configuration is now in `backend/vercel.json` and Vercel's Root Directory setting handles the path resolution.

