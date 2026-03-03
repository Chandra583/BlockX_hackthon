# Vercel Deployment Guide for Trivexachain Backend

## ✅ Backend is Ready for Vercel Serverless Deployment

This Express + MongoDB backend has been converted to work as a serverless API on Vercel.

---

## 📋 Pre-Deployment Checklist

- [x] Removed unnecessary files (logs/, dist/, test files, docs/)
- [x] Installed `serverless-http` package
- [x] Updated `/api/index.ts` to use serverless wrapper
- [x] Created `.env.example` with all required variables
- [x] Configured `vercel.json` for serverless routing
- [x] Added `.gitignore` for backend
- [x] Cleaned backend structure

---

## 🚀 Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

**Required Variables:**

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=<your-jwt-secret-key>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
NODE_ENV=production
```

**Optional but Recommended:**

```env
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
AWS_ACCESS_KEY_ID=<if-using-s3>
AWS_SECRET_ACCESS_KEY=<if-using-s3>
AWS_S3_BUCKET=<if-using-s3>
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SMTP_HOST=<if-using-email>
SMTP_USER=<if-using-email>
SMTP_PASS=<if-using-email>
SESSION_SECRET=<your-session-secret>
```

### 4. Deploy to Vercel

From the project root:

```bash
cd backend
vercel --prod
```

Or link to existing project:

```bash
vercel link
vercel --prod
```

---

## 🧪 Testing Your Deployment

### Test Endpoints

Once deployed, your API will be available at:

```
https://your-app.vercel.app/api/vehicles
https://your-app.vercel.app/api/telemetry/latest-obd/:id
https://your-app.vercel.app/api/auth/login
```

### Test with curl:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Login
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'

# Get vehicles (with auth token)
curl https://your-app.vercel.app/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 Current Backend Structure

```
backend/
├── api/
│   └── index.ts          # Serverless entry point
├── src/
│   ├── app.ts            # Express app configuration
│   ├── server.ts         # Local development server
│   ├── config/           # Database, env config
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   └── utils/            # Helper functions
├── scripts/              # Migration & seed scripts
├── .env                  # Local environment (not committed)
├── .env.example          # Template for environment variables
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
└── vercel.json           # Vercel deployment config
```

---

## 🔧 Local Development

To run locally before deploying:

```bash
cd backend
npm install
npm run dev
```

Test with Vercel dev environment:

```bash
cd backend
vercel dev
```

---

## 🌐 CORS Configuration

The backend is configured to accept requests from your frontend. Make sure to set:

```env
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

In `src/app.ts`, CORS is already configured to use these environment variables.

---

## 📊 Monitoring & Logs

### View logs in Vercel Dashboard:

1. Go to your project in Vercel
2. Click on "Functions" tab
3. Select your function to view logs

### View logs via CLI:

```bash
vercel logs <deployment-url>
```

---

## ⚡ Performance Optimization

### Cold Start Optimization:

The current setup includes:
- Database connection pooling (MongoDB)
- Connection reuse across serverless invocations
- Minimal dependencies loaded per request

### Function Configuration:

Edit `vercel.json` to adjust function settings:

```json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

---

## 🔐 Security Best Practices

- [x] `.env` file is in `.gitignore`
- [x] JWT secrets are environment variables
- [x] MongoDB connection string uses env variables
- [x] CORS is configured for specific frontend origin
- [x] Rate limiting is enabled (via middleware)
- [x] Helmet.js security headers applied

---

## 🚨 Troubleshooting

### Issue: 500 Internal Server Error

**Solution:** Check Vercel function logs for details:

```bash
vercel logs --follow
```

### Issue: Database Connection Timeout

**Solution:** Verify MongoDB Atlas allows connections from `0.0.0.0/0` or add Vercel IPs

### Issue: Environment Variables Not Working

**Solution:** Ensure variables are set in Vercel dashboard AND redeploy:

```bash
vercel --prod --force
```

### Issue: Routes Not Found

**Solution:** Verify `vercel.json` routing configuration is correct

---

## 📝 Migration Notes

### What Was Removed:

- `dist/` - Build artifacts (not needed for serverless)
- `logs/` - Log files (use Vercel logs instead)
- Test data files - `test-*.js`, `mock-device-server.js`
- Documentation - Moved to project root or removed

### What Was Changed:

- `/api/index.ts` - Now uses `serverless-http` wrapper
- `package.json` - Added `serverless-http` dependency
- `.env.example` - Updated with all required variables

### What Was Added:

- `.gitignore` - Backend-specific ignore rules
- This deployment guide

---

## 🎯 Next Steps

1. Deploy to Vercel: `vercel --prod`
2. Set environment variables in Vercel dashboard
3. Test all endpoints with your frontend
4. Monitor function performance and logs
5. Configure custom domain (optional)

---

## 📞 Support

For issues related to:
- **Vercel Deployment:** Check [Vercel Documentation](https://vercel.com/docs)
- **MongoDB Atlas:** Check [MongoDB Docs](https://docs.mongodb.com/)
- **Backend Code:** Review source code in `/src` directory

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Set all environment variables in Vercel
- [ ] Test all API endpoints
- [ ] Verify MongoDB connection works
- [ ] Test authentication flow
- [ ] Verify CORS with frontend
- [ ] Check function logs for errors
- [ ] Test file upload functionality (if used)
- [ ] Verify blockchain integration (if used)
- [ ] Set up monitoring/alerting
- [ ] Configure custom domain (optional)

---

**Ready to deploy!** 🚀

```bash
cd backend
vercel --prod
```

