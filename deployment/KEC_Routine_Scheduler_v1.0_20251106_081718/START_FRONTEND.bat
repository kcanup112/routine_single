@echo off
echo =========================================
echo KEC Routine Scheduler - Frontend Server
echo =========================================
echo.
echo Starting frontend server...
echo Application will be available at: http://localhost:3000
echo.

cd Frontend
echo Starting simple HTTP server...
python -m http.server 3000

pause
