@echo off
echo ========================================
echo Likwid Blog System Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed: 
node --version

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the blog system:
echo 1. Start the backend server: npm start
echo 2. Open blog-posts.html in your browser
echo 3. Or open blog-editor.html to create posts
echo.
echo Backend will run on: http://localhost:3001
echo Posts will be stored in: posts/ directory
echo.
pause
