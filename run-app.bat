@echo off
echo ========================================
echo Starting AgriSarthi Servers
echo ========================================
echo.
echo Starting Backend Server on port 3007...
start "AgriSarthi-Backend" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 2 /nobreak > nul
echo Starting Frontend on port 3008...
start "AgriSarthi-Frontend" cmd /k "cd /d %~dp0 && npx vite --port 3008"
echo.
echo ========================================
echo Servers are starting!
echo Backend: http://localhost:3007
echo Frontend: http://localhost:3008
echo ========================================
echo Press any key to exit this window (servers will keep running)
pause > nul
