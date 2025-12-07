@echo off
echo 🛠️  Port Cleaner Tool
echo This frees common dev ports
echo.

echo Killing processes on ports 3000-3010...
for /L %%i in (3000,1,3010) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%i"') do (
        echo Killing PID %%a on port %%i...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo Killing processes on ports 5000-5010...
for /L %%i in (5000,1,5010) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%i"') do (
        echo Killing PID %%a on port %%i...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo.
echo ✅ Ports 3000-3010 and 5000-5010 are now free!
pause