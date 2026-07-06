@echo off
title Protokoll-Manager (Produktion)
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo Python-Umgebung fehlt. Bitte zuerst INSTALL.bat ausfuehren.
    pause
    exit /b 1
)

if not exist "..\frontend\dist\index.html" (
    echo Frontend nicht gebaut. Bitte BUILD-FRONTEND.bat ausfuehren.
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

REM SECRET_KEY muss vor dem Start gesetzt werden (signiert Session-Cookies).
REM Beispiel: set SECRET_KEY=ihr-eigener-zufaelliger-schluessel
if not defined SECRET_KEY (
    echo FEHLER: SECRET_KEY ist nicht gesetzt.
    echo Bitte in dieser Konsole setzen, z. B.:
    echo   set SECRET_KEY=ihr-eigener-zufaelliger-schluessel
    echo Danach START.bat erneut ausfuehren.
    pause
    exit /b 1
)

REM Optional: Inaktivitaets-Timeout (Standard 30 Minuten):
REM set SESSION_IDLE_MINUTES=30

python run_production.py
pause
