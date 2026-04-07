@echo off
title BuildWise Web App
cd /d "c:\Users\gpvka\Desktop\Palanivel Personal\Datalytics\Construction Software\apps\web"
echo.
echo  BuildWise Web - Starting on port 5173...
echo.
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
npx vite
pause
