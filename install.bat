@echo off
echo Installing MERN Scraper Dependencies...
echo.

echo 1. Checking Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo 2. Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo 3. Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✅ All dependencies installed!
echo.
echo To start the application:
echo • Windows: Double-click run.bat
echo • Or run: run.bat
echo.
pause