@echo off
title BuildWise API Server
cd /d "c:\Users\gpvka\Desktop\Palanivel Personal\Datalytics\Construction Software\apps\api"
echo.
echo  BuildWise API - Starting on port 4000...
echo.
npx tsx src/server.ts
pause
