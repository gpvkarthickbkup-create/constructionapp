@echo off
title Datalytics Mobile - Web Preview
cd /d "c:\Users\gpvka\Desktop\Palanivel Personal\Datalytics\Construction Software\apps\mobile"

for /f "tokens=5" %%a in ('netstat -aon ^| find ":8081" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo  ========================================
echo   Mobile App - Web Preview
echo  ========================================
echo.
echo  Opens in your browser at localhost:8081
echo.

node_modules\.bin\expo.cmd start --web --clear
pause
