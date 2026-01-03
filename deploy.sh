#!/bin/bash

echo "🚀 Dayflow HRMS Deployment Helper"
echo "================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git branch -M main"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

echo "✅ Git repository found"

# Check if package.json exists in both directories
if [ ! -f "backend/package.json" ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

echo "✅ Package files found"

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

cd ..

echo "✅ Dependencies installed successfully"

# Test builds
echo "🔨 Testing backend..."
cd backend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build test failed"
    exit 1
fi

echo "🔨 Testing frontend build..."
cd ../frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "✅ Build tests passed"

# Commit deployment files
git add .
git commit -m "Add deployment configuration files"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Render:"
echo "   - Go to render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repo"
echo "   - Set root directory to 'backend'"
echo "   - Use build command: npm install"
echo "   - Use start command: npm start"
echo ""
echo "3. Deploy frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Import project from GitHub"
echo "   - Set root directory to 'frontend'"
echo "   - Framework: Create React App"
echo ""
echo "4. Update environment variables in both platforms"
echo "5. See DEPLOYMENT.md for detailed instructions"