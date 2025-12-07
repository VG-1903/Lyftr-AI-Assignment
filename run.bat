@echo off
echo MERN Scraper Application
echo.

REM Kill processes on busy ports first
echo Cleaning ports...
call kill-ports.bat

echo Starting backend...
cd backend
start cmd /k "npm start"

timeout /t 3 /nobreak > nul

echo Starting frontend...
cd ../frontend
start cmd /k "npm start"

echo.
echo ✅ Application started!
echo.
echo Open browser to:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo.
echo Close the windows to stop.
pause