@echo off
setlocal EnableDelayedExpansion
title Protokoll-Manager - Installation
cd /d "%~dp0"

echo ========================================
echo  Protokoll-Manager - Erstinstallation
echo ========================================
echo Python und Node.js werden bei Bedarf per winget installiert.
echo Ggf. UAC bestaetigen.
echo.

echo [1/4] Python pruefen / installieren ...
call "%~dp0_install-prereqs.bat" python
if errorlevel 1 (
    pause
    exit /b 1
)

call "%~dp0_install-prereqs.bat" find-python
if errorlevel 1 (
    echo Kein Python gefunden.
    pause
    exit /b 1
)
echo      Verwende: !PYTHON_EXE!

echo.
echo [2/4] Python-Umgebung im Ordner backend ...
cd backend
if not exist venv (
    "!PYTHON_EXE!" -m venv venv
    if errorlevel 1 (
        echo venv konnte nicht erstellt werden.
        cd ..
        pause
        exit /b 1
    )
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    cd ..
    pause
    exit /b 1
)

echo.
echo [3/4] Datenbank initialisieren (nur bei leerer DB) ...
if not exist protokoll.db (
    python seed.py
) else (
    echo protokoll.db existiert bereits - seed uebersprungen.
)

cd ..

echo.
echo [4/4] Node.js pruefen / installieren und Frontend bauen ...
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
echo      Verwende: !NPM_CMD!

cd frontend
call "!NPM_CMD!" install
if errorlevel 1 (
    cd ..
    pause
    exit /b 1
)
call "!NPM_CMD!" run build
if errorlevel 1 (
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Installation abgeschlossen.
echo Produktion starten: START.bat
echo ========================================
pause
exit /b 0
