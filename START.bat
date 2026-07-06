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

REM --- SECRET_KEY (Demo/Portfolio) ---------------------------------------------
REM Signiert Flask-Session-Cookies - NICHT Benutzername/Passwort.
REM Anmeldung: demo / Demo2026! (laut EINRICHTUNG.md)
REM Wert aendern: alle muessen sich neu anmelden, niemand ist gesperrt.
REM Bereits gesetzte Windows-Umgebungsvariable SECRET_KEY hat Vorrang.
if not defined SECRET_KEY set SECRET_KEY=BE-Demo-k9Xm2pQ7vR4wN8sT1uY6zA3bC5dE0fG_portfolio-only

REM Optional: Inaktivitaets-Timeout (Standard 30 Minuten):
REM set SESSION_IDLE_MINUTES=30

python run_production.py
pause
