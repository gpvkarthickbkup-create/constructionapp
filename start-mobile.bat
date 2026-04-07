@echo off
title Datalytics Mobile App
cd /d "c:\Users\gpvka\Desktop\Palanivel Personal\Datalytics\Construction Software\apps\mobile"

:: Kill any existing Metro on 8081
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8081" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo  ========================================
echo   Datalytics Construction - Mobile App
echo  ========================================
echo.
echo  Make sure API is running first!
echo  Login: Gpvk@datalytics.com / Datalytics@123
echo  ========================================
echo.

node_modules\.bin\expo.cmd start --go --clear
pause
