@echo off
echo.
echo  ========================================
echo   BuildWise - Firewall Setup
echo  ========================================
echo.
echo  This will allow your phone to connect.
echo  You may see a Windows admin prompt.
echo.

:: Allow API port
netsh advfirewall firewall add rule name="BuildWise API" dir=in action=allow protocol=TCP localport=4000
echo  [OK] Port 4000 (API) opened

:: Allow Expo Metro port
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=19000
echo  [OK] Port 19000 (Expo) opened

:: Allow Expo Dev port
netsh advfirewall firewall add rule name="Expo Dev" dir=in action=allow protocol=TCP localport=8081
echo  [OK] Port 8081 (Expo Dev) opened

echo.
echo  ========================================
echo   Firewall rules added!
echo   Now restart start-mobile.bat
echo  ========================================
echo.
pause
