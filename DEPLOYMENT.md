# Dayflow HRMS - Deployment Guide

## Backend Deployment (Render)

### Method 1: Using Render Dashboard (Recommended)

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **Connect GitHub**: Link your GitHub repository
3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the `backend` folder as root directory
   - Configure settings:
     - **Name**: `dayflow-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free` (or paid for better performance)

4. **Environment Variables**: Add these in Render dashboard:
   ```
   NODE_ENV=production
   MONGO_URL=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
   CORS_ORIGINS=https://your-frontend-domain.vercel.app
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   PORT=10000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

5. **Deploy**: Click "Create Web Service"

### Method 2: Using render.yaml (Infrastructure as Code)

1. Use the provided `backend/render.yaml` file
2. Push to GitHub and Render will auto-detect the configuration

### Build Commands for Backend:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x (latest LTS)

---

## Frontend Deployment (Vercel)

### Method 1: Using Vercel Dashboard (Recommended)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up
2. **Import Project**:
   - Click "New Project"
   - Import from GitHub
   - Select your repository
   - Set **Root Directory** to `frontend`

3. **Build Settings**:
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

4. **Environment Variables**: Add in Vercel dashboard:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables" tab
   - Add the following variable:
   ```
   Name: REACT_APP_BACKEND_URL
   Value: https://payroll-nog2.onrender.com
   ```
   - Make sure to set it for all environments (Production, Preview, Development)

5. **Deploy**: Click "Deploy"

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: dayflow-frontend
# - In which directory is your code located? ./
```

### Build Commands for Frontend:
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Node Version**: 18.x

---

## Post-Deployment Steps

### 1. Update Environment Variables

**Backend (Render)**:
- Update `CORS_ORIGINS` and `FRONTEND_URL` with your actual Vercel domain
- Ensure all email credentials are correct

**Frontend (Vercel)**:
- Update `REACT_APP_BACKEND_URL` with your actual Render domain

### 2. Database Setup

1. **MongoDB Atlas** (Recommended):
   - Create cluster at [mongodb.com](https://cloud.mongodb.com)
   - Get connection string
   - Update `MONGO_URL` in Render

2. **Render PostgreSQL** (Alternative):
   - Create PostgreSQL database in Render
   - Update connection string

### 3. Email Configuration

1. **Gmail Setup**:
   - Enable 2-Factor Authentication
   - Generate App Password: Google Account → Security → 2-Step Verification → App passwords
   - Use the 16-character app password in `SMTP_PASS`

### 4. Domain Configuration

1. **Custom Domains** (Optional):
   - Add custom domain in Vercel for frontend
   - Add custom domain in Render for backend
   - Update CORS settings accordingly

### 5. SSL/HTTPS

Both Render and Vercel provide automatic SSL certificates. No additional configuration needed.

---

## Monitoring and Maintenance

### Health Checks

- **Backend**: Render automatically monitors `/api` endpoint
- **Frontend**: Vercel provides automatic monitoring

### Logs

- **Render**: View logs in Render dashboard
- **Vercel**: View function logs in Vercel dashboard

### Scaling

- **Render**: Upgrade to paid plan for better performance
- **Vercel**: Automatic scaling included

---

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CORS_ORIGINS` includes your Vercel domain
   - Check both HTTP and HTTPS versions

2. **Environment Variables**:
   - Verify all required variables are set
   - Redeploy after changing environment variables

3. **Build Failures**:
   - Check build logs in respective dashboards
   - Ensure all dependencies are in package.json

4. **Database Connection**:
   - Verify MongoDB connection string
   - Check IP whitelist in MongoDB Atlas

### Support

- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

---

## Security Checklist

- [ ] Strong JWT secrets generated
- [ ] MongoDB IP whitelist configured
- [ ] Gmail app password (not regular password)
- [ ] HTTPS enforced (automatic)
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input sanitization active