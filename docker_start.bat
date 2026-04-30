@echo off
echo docker starting ....................
REM Wait for 20 seconds
timeout /t 20 /nobreak >nul
echo
REM Change to your directory
cd /d "C:\Users\lenovo\Documents\routine2.0\routine_single"

REM Run docker compose
docker compose up --no-build