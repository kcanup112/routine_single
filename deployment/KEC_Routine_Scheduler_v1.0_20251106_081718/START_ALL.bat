@echo off
echo ========================================
echo KEC Routine Scheduler - Full Stack
echo ========================================
echo.
echo Starting backend and frontend servers...
echo.

start "" "%~dp0START_BACKEND.bat"
timeout /t 3 /nobreak > nul
start "" "%~dp0START_FRONTEND.bat"

echo.
echo Both servers are starting...
echo.
echo Access the application at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   Student View: http://localhost:3001 (after deployment)
echo.
echo Press any key to exit...
pause > nul
