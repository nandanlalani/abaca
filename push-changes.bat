@echo off
echo ========================================
echo   Dayflow HRMS - Push to GitHub
echo ========================================
echo.

echo Setting up git configuration...
git config user.name "neellalani474-cmyk"
git config user.email "neel.lalani474@gmail.com"

echo.
echo Current git status:
git status

echo.
echo Attempting to push to GitHub...
echo Note: You may need to enter your GitHub username and password/token
echo.

git push -u origin master

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Changes pushed to GitHub
    echo ========================================
    echo.
    echo Your Dayflow HRMS improvements are now live at:
    echo https://github.com/neellalani474-cmyk/day-flow
    echo.
) else (
    echo.
    echo ========================================
    echo   AUTHENTICATION NEEDED
    echo ========================================
    echo.
    echo If you got a 403 error, you need to:
    echo 1. Go to GitHub.com ^> Settings ^> Developer settings ^> Personal access tokens
    echo 2. Generate a new token with 'repo' permissions
    echo 3. Use the token as your password when prompted
    echo.
    echo Or manually upload files to GitHub using the web interface.
    echo See push-to-github.md for detailed instructions.
)

pause