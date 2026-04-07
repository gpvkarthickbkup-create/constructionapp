@echo off
echo.
echo  ========================================
echo   BuildWise - Fix Network Access
echo  ========================================
echo.
echo  This will allow your phone to connect
echo  to the API server on this PC.
echo.
echo  RIGHT-CLICK this file and "Run as Administrator"
echo.

:: Temporarily allow port 4000 on all profiles
netsh advfirewall firewall delete rule name="BuildWise API" >nul 2>&1
netsh advfirewall firewall add rule name="BuildWise API" dir=in action=allow protocol=TCP localport=4000 profile=any
echo  [OK] Port 4000 opened (all profiles)

netsh advfirewall firewall delete rule name="BuildWise API Out" >nul 2>&1
netsh advfirewall firewall add rule name="BuildWise API Out" dir=out action=allow protocol=TCP localport=4000 profile=any
echo  [OK] Port 4000 outbound opened

:: Also try setting network to private
powershell -Command "Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private" >nul 2>&1
echo  [OK] Network set to Private (if possible)

echo.
echo  ========================================
echo   Done! Now restart start-api.bat
echo   Then try http://192.168.1.4:4000/api/health
echo   in your phone browser.
echo  ========================================
echo.
pause
