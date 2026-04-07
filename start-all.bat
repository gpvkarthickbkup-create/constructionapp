@echo off
title BuildWise - Start All Services
echo.
echo  ========================================
echo   BuildWise - Starting All Services
echo  ========================================
echo.

echo  [1/3] Starting API Server...
start "" "%~dp0start-api.bat"
ping 127.0.0.1 -n 5 >nul

echo  [2/3] Starting Web App...
start "" "%~dp0start-web.bat"
ping 127.0.0.1 -n 5 >nul

echo  [3/3] Starting Mobile App...
start "" "%~dp0start-mobile.bat"
ping 127.0.0.1 -n 6 >nul

echo.
echo  ========================================
echo   All Services Running!
echo  ========================================
echo.
echo   API:    http://localhost:4000
echo   Web:    http://localhost:5173
echo   Mobile: Scan QR in mobile terminal
echo.
echo   Login:  Gpvk@datalytics.com
echo   Pass:   Datalytics@123
echo  ========================================
echo.

start "" http://localhost:5173
echo  Press any key to close this window.
echo  (Keep the other 3 windows open!)
pause >nul
