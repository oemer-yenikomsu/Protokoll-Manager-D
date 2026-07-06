@echo off
title Protokoll-Manager - Deinstallation
cd /d "%~dp0"

echo Entfernt die durch INSTALL.bat und BUILD-FRONTEND.bat angelegten Artefakte.
echo Die Datenbank backend\protokoll.db bleibt erhalten.
echo.
echo Bitte START.bat / laufenden Server beenden, falls aktiv.
echo.
set /p CONFIRM=Fortfahren? (J/N): 
if /i not "%CONFIRM%"=="J" (
    echo Abgebrochen.
    pause
    exit /b 0
)

echo.
echo [1/3] Python-Umgebung backend\venv ...
if exist "backend\venv" (
    rmdir /s /q "backend\venv"
    if exist "backend\venv" (
        echo Fehler: venv konnte nicht geloescht werden ^(evtl. noch in Verwendung^).
        pause
        exit /b 1
    )
    echo venv entfernt.
) else (
    echo venv nicht vorhanden - uebersprungen.
)

echo.
echo [2/3] Python-Cache backend\__pycache__ ...
if exist "backend\__pycache__" (
    rmdir /s /q "backend\__pycache__"
    echo __pycache__ entfernt.
) else (
    echo __pycache__ nicht vorhanden - uebersprungen.
)

echo.
echo [3/3] Frontend-Build frontend\node_modules und frontend\dist ...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules"
    echo node_modules entfernt.
) else (
    echo node_modules nicht vorhanden - uebersprungen.
)
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist"
    echo dist entfernt.
) else (
    echo dist nicht vorhanden - uebersprungen.
)

echo.
if exist "backend\protokoll.db" (
    echo Datenbank backend\protokoll.db wurde beibehalten.
) else (
    echo Hinweis: backend\protokoll.db existiert nicht.
)
echo.
echo Deinstallation abgeschlossen.
echo Neu installieren: INSTALL.bat, optional BUILD-FRONTEND.bat
pause
