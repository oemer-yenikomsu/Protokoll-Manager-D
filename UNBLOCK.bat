@echo off
title Protokoll-Manager - Dateien entsperren
cd /d "%~dp0"

echo ========================================
echo  Windows-Sperre aufheben (Mark of the Web)
echo ========================================
echo Entsperrt alle Dateien im Projektordner.
echo Sinnvoll nach Download oder ZIP-Entpacken.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-ChildItem -LiteralPath '%~dp0' -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue"

echo.
echo Fertig. Jetzt INSTALL.bat oder START.bat erneut versuchen.
pause
