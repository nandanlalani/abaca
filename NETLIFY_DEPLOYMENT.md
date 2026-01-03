# 🚀 Netlify Deployment Guide for Dayflow HRMS Frontend

## 📋 Build Commands for Netlify:

```bash
Build Command: npm install --legacy-peer-deps && npm run build
Publish Directory: build
Base Directory: frontend (if deploying from root, otherwise leave empty)
Node Version: 18.x
```

## 🔧 Environment Variables for Netlify:

Add these in your Netlify dashboard under Site Settings → Environment Variables:

```
REACT_APP_BACKEND_URL=https://payroll-nog2.onrender.com
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

## 📁 Files Created for Netlify:

- `frontend/netlify.toml` - Main Netlify configuration
- `frontend/_redirects` - Client-side routing redirects
- `frontend/.env.local` - Local development variables
- `frontend/.env.production` - Production variables

## 🚀 Deployment Steps:

### Method 1: Netlify Dashboard (Recommended)

1. **Go to Netlify**: Visit [netlify.com](https://netlify.com) and sign up/login

2. **New Site from Git**:
   - Click "New site from Git"
   - Choose GitHub (or your git provider)
   - Select your repository

3. **Build Settings**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```

4. **Advanced Settings**:
   - Click "Show advanced"
   - Add environment variables:
     ```
     REACT_APP_BACKEND_URL = https://payroll-nog2.onrender.com
     GENERATE_SOURCEMAP = false
     DISABLE_ESLINT_PLUGIN = true
     NODE_VERSION = 18
     ```

5. **Deploy**: Click "Deploy site"

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend directory
cd frontend

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Build and deploy
npm run build
netlify deploy --prod --dir=build
```

### Method 3: Drag and Drop

```bash
# Build the project locally
cd frontend
npm install
npm run build

# Drag and drop the 'build' folder to Netlify dashboard
```

## 🔧 Post-Deployment Configuration:

### 1. Update Backend CORS Settings

Once you get your Netlify URL (e.g., `https://amazing-app-123456.netlify.app`), update your Render backend environment variables:

```
CORS_ORIGINS=https://your-netlify-url.netlify.app
FRONTEND_URL=https://your-netlify-url.netlify.app
```

### 2. Custom Domain (Optional)

1. In Netlify dashboard: Site Settings → Domain Management
2. Add custom domain
3. Update DNS records as instructed
4. SSL certificate will be auto-generated

### 3. Environment Variables

Make sure these are set in Netlify:
- `REACT_APP_BACKEND_URL=https://payroll-nog2.onrender.com`

## 🐛 Troubleshooting:

### Build Fails:
- Check Node version is set to 18
- Ensure all dependencies are in package.json
- Check build logs for specific errors

### 404 Errors on Refresh:
- Ensure `_redirects` file is in the build output
- Check netlify.toml redirect rules

### API Calls Fail:
- Verify `REACT_APP_BACKEND_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

### Environment Variables Not Working:
- Must start with `REACT_APP_` for React
- Redeploy after adding variables
- Check they're set for production environment

## 📊 Netlify Features You Get:

- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Branch previews
- ✅ Form handling
- ✅ Serverless functions (if needed)
- ✅ Analytics
- ✅ A/B testing

## 🔒 Security Headers:

The `netlify.toml` file includes security headers:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## 📈 Performance Optimization:

- Static assets cached for 1 year
- Gzip compression enabled automatically
- Image optimization available
- Prerendering for better SEO

---

## 🎉 That's it!

Your React frontend will be deployed on Netlify with:
- Fast global CDN
- Automatic HTTPS
- Continuous deployment
- Perfect for React SPAs

Your backend API at `https://payroll-nog2.onrender.com` is already working! 🚀