@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-aether.ps1"

echo.
echo If this window shows an error, copy it and send it to the developer.
pause
