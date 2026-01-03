@echo off
echo 🚀 Dayflow HRMS Deployment Helper
echo =================================

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    echo    git branch -M main
    echo    git remote add origin ^<your-repo-url^>
    echo    git push -u origin main
    exit /b 1
)

echo ✅ Git repository found

REM Check if package.json exists in both directories
if not exist "backend\package.json" (
    echo ❌ Backend package.json not found
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Frontend package.json not found
    exit /b 1
)

echo ✅ Package files found

REM Install dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    exit /b 1
)

echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    exit /b 1
)

cd ..

echo ✅ Dependencies installed successfully

REM Test builds
echo 🔨 Testing frontend build...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)

cd ..

echo ✅ Build tests passed

REM Commit deployment files
git add .
git commit -m "Add deployment configuration files"

echo.
echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Push to GitHub: git push origin main
echo 2. Deploy backend to Render:
echo    - Go to render.com
echo    - Create new Web Service
echo    - Connect your GitHub repo
echo    - Set root directory to 'backend'
echo    - Use build command: npm install
echo    - Use start command: npm start
echo.
echo 3. Deploy frontend to Vercel:
echo    - Go to vercel.com
echo    - Import project from GitHub
echo    - Set root directory to 'frontend'
echo    - Framework: Create React App
echo.
echo 4. Update environment variables in both platforms
echo 5. See DEPLOYMENT.md for detailed instructions