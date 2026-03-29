@echo off
echo ========================================
echo KEC Routine Scheduler - Backend Server
echo ========================================
echo.
echo Starting backend server...
echo API will be available at: http://localhost:8000
echo.

cd Backend
start "KEC Backend Server" KEC_Routine_Backend.exe

echo.
echo Backend server started in a new window.
echo Press any key to close this window...
pause > nul
