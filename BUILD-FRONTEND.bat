@echo off
setlocal EnableDelayedExpansion
title Protokoll-Manager - Frontend bauen
cd /d "%~dp0"

call "%~dp0_install-prereqs.bat" node
if errorlevel 1 (
    pause
    exit /b 1
)

call "%~dp0_install-prereqs.bat" find-npm
if errorlevel 1 (
    echo npm nicht gefunden.
    pause
    exit /b 1
)
echo Verwende: !NPM_CMD!

cd frontend
call "!NPM_CMD!" install
if errorlevel 1 exit /b 1
call "!NPM_CMD!" run build
if errorlevel 1 exit /b 1

echo.
echo Build fertig: frontend\dist
echo Produktion starten mit START.bat im Projektordner.
pause
