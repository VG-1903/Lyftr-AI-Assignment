@echo off
setlocal enabledelayedexpansion

title MERN Stack Auto-Setup
color 0A

echo ╔═══════════════════════════════════════════╗
echo ║    MERN Stack Application Auto-Setup      ║
echo ╚═══════════════════════════════════════════╝
echo.

REM Function to install missing dependencies
:installDeps
echo Installing dependencies...
echo.

REM Install backend dependencies
if not exist "backend\node_modules" (
    echo [Backend] Installing packages...
    cd backend
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Backend installation failed!
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

REM Install frontend dependencies
if not exist "frontend\node_modules" (
    echo [Frontend] Installing packages...
    cd frontend
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Frontend installation failed!
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)
goto :eof

REM Main script
echo [1/5] Checking system requirements...

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Installing Node.js is required.
    echo Download from: https://nodejs.org/
    echo.
    echo Run this script again after installation.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "nodever=%%i"
echo ✅ Node.js !nodever! detected

REM Check npm
for /f "tokens=*" %%i in ('npm --version') do set "npmver=%%i"
echo ✅ npm !npmver! detected

echo.
echo [2/5] Setting up environment files...

REM Create .env files if missing
if not exist "backend\.env" (
    echo Creating backend .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/mern-scraper
        echo JWT_SECRET=change_this_to_a_random_secret_key
        echo CORS_ORIGIN=http://localhost:3000
    ) > backend\.env
    echo ✅ Created backend/.env
)

if not exist "frontend\.env" (
    echo Creating frontend .env file...
    (
        echo REACT_APP_API_URL=http://localhost:5000
        echo REACT_APP_NAME=MERN Scraper
    ) > frontend\.env
    echo ✅ Created frontend/.env
)

echo.
echo [3/5] Installing dependencies...
call :installDeps

echo.
echo [4/5] Checking ports...

REM Kill processes on ports 3000 and 5000
echo Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /F /PID %%a >nul 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [5/5] Starting application...

REM Start backend
echo Starting backend server (Port: 5000)...
start "MERN Backend" /D "backend" cmd /k "npm start"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend server (Port: 3000)...
start "MERN Frontend" /D "frontend" cmd /k "npm start"

echo.
echo ╔═══════════════════════════════════════════╗
echo ║        Application Started!               ║
echo ╚═══════════════════════════════════════════╝
echo.
echo 🌐 Frontend: http://localhost:3000
echo ⚙️  Backend:  http://localhost:5000
echo.
echo 📋 Next steps:
echo   1. Open browser to http://localhost:3000
echo   2. Check both command windows for logs
echo   3. Close windows to stop servers
echo.
echo Press any key to open in browser...
pause >nul

start http://localhost:3000
echo Browser opened!

echo.
echo Press any key to exit setup...
pause >nul