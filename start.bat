@echo off
title BuildWise Launcher
echo.
echo  ========================================
echo   BuildWise - Construction Cost Tracker
echo  ========================================
echo.
echo  [1/2] Starting API Server...
start "" "%~dp0start-api.bat"
echo  Waiting for API...
ping 127.0.0.1 -n 5 >nul
echo  [2/2] Starting Web App...
start "" "%~dp0start-web.bat"
echo  Waiting for Web...
ping 127.0.0.1 -n 6 >nul
echo.
echo  ========================================
echo   BuildWise is running!
echo  ========================================
echo.
echo   API:  http://localhost:4000
echo   Web:  http://localhost:5173
echo.
echo   Login: demo@buildwise.in / Demo@123
echo  ========================================
echo.
start "" http://localhost:5173
echo  Press any key to close this window.
echo  (Keep the other 2 windows open!)
pause >nul
