@echo off
echo Stopping all KEC Routine Scheduler processes...

taskkill /FI "WINDOWTITLE eq KEC Backend Server*" /F 2>nul
taskkill /IM KEC_Routine_Backend.exe /F 2>nul
taskkill /IM python.exe /FI "WINDOWTITLE eq *http.server*" /F 2>nul

echo All servers stopped.
pause
