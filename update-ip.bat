@echo off
title Update Mobile IP
echo.
echo  ========================================
echo   Update Mobile App IP Address
echo  ========================================
echo.

:: Get current IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do set IP=%%a
set IP=%IP: =%

echo  Your current IP: %IP%
echo.

:: Update api.ts
powershell -Command "(Get-Content 'apps\mobile\src\api.ts') -replace 'http://192\.\d+\.\d+\.\d+:4000', 'http://%IP%:4000' | Set-Content 'apps\mobile\src\api.ts'"
echo  [OK] Updated api.ts

:: Update App.tsx
powershell -Command "(Get-Content 'apps\mobile\src\App.tsx') -replace 'http://192\.\d+\.\d+\.\d+:4000', 'http://%IP%:4000' | Set-Content 'apps\mobile\src\App.tsx'"
echo  [OK] Updated App.tsx

echo.
echo  ========================================
echo   Done! Now restart start-mobile.bat
echo  ========================================
echo.
pause
