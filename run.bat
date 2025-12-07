@echo off
echo ========================================
echo    MERN Scraper - Auto Port Finder
echo ========================================
echo.

cd /d "%~dp0"
echo 📍 Working directory: %cd%
echo.

REM Function to find free port
:find_free_port
set port=%1
set max_port=%2

:check_port
netstat -ano | findstr ":%port%" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port %port% is busy...
    set /a port+=1
    if %port% gtr %max_port% (
        echo ❌ ERROR: No free ports between %1 and %max_port%!
        pause
        exit /b 1
    )
    goto check_port
)
exit /b 0

REM Find free port for backend (5000-5010)
set BACKEND_START=5000
set BACKEND_END=5010
call :find_free_port %BACKEND_START% %BACKEND_END%
set BACKEND_PORT=%port%

REM Find free port for frontend (3000-3010)
set FRONTEND_START=3000
set FRONTEND_END=3010
set port=%FRONTEND_START%
call :find_free_port %FRONTEND_START% %FRONTEND_END%
set FRONTEND_PORT=%port%

echo ✅ Found free ports:
echo Backend: %BACKEND_PORT% (was trying %BACKEND_START%)
echo Frontend: %FRONTEND_PORT% (was trying %FRONTEND_START%)
echo.

REM Create port config file for other scripts
echo BACKEND_PORT=%BACKEND_PORT% > ports.cfg
echo FRONTEND_PORT=%FRONTEND_PORT% >> ports.cfg

echo 📦 Checking/installing dependencies...
echo.

REM Backend dependencies
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ Backend installation failed!
        cd ..
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already exist
)
cd ..

REM Frontend dependencies
cd frontend
if exist "package.json" (
    if not exist "node_modules" (
        echo Installing frontend dependencies...
        npm install --silent
        if %errorlevel% neq 0 (
            echo ❌ Frontend installation failed!
            cd ..
            pause
            exit /b 1
        )
        echo ✅ Frontend dependencies installed
    ) else (
        echo ✅ Frontend dependencies already exist
    )
) else (
    echo ⚠️  No frontend package.json found (API-only mode)
)
cd ..

echo.
echo 🚀 Starting servers with dynamic ports...
echo.

REM Start backend with dynamic port
echo Starting backend on port %BACKEND_PORT%...
cd backend
start "MERN Backend Server" cmd /k "cd /d "%~dp0backend" && set PORT=%BACKEND_PORT% && echo [Backend] Port: %BACKEND_PORT% && npm start"
cd ..
timeout /t 8 >nul

REM Test backend
echo Testing backend...
where curl >nul 2>nul && (
    curl -s -o nul -w "%%{http_code}" http://localhost:%BACKEND_PORT%/healthz | find "200" >nul && (
        echo ✅ Backend is running
    ) || echo ⚠️  Backend might be starting slowly...
) || (
    echo ⚠️  curl not available, skipping backend test
)

REM Start frontend with dynamic port
echo Starting frontend on port %FRONTEND_PORT%...
cd frontend
if exist "package.json" (
    start "MERN Frontend Server" cmd /k "cd /d "%~dp0frontend" && set PORT=%FRONTEND_PORT% && echo [Frontend] Port: %FRONTEND_PORT% && npm start"
    timeout /t 5 >nul
    echo ✅ Frontend starting
) else (
    echo ℹ️  No frontend found (API-only mode)
)
cd ..

echo.
echo ========================================
echo          🎉 APPLICATION READY!
echo ========================================
echo.
echo 🌐 FRONTEND: http://localhost:%FRONTEND_PORT%
echo ⚙️  BACKEND API: http://localhost:%BACKEND_PORT%
echo 📊 HEALTH CHECK: http://localhost:%BACKEND_PORT%/healthz
echo.
echo 📋 IMPORTANT NOTES:
echo • If ports 3000/5000 were busy, different ports were used
echo • Save these URLs - you'll need them!
echo • Services run in separate windows
echo • Close those windows to stop
echo.
echo 📍 Ports saved to: ports.cfg
echo.
pause