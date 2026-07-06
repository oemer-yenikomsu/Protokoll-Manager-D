@echo off
REM Python/Node per winget installieren, falls nicht vorhanden.
REM Aufruf: _install-prereqs.bat python | node | all | refresh | find-python | find-npm
if /i "%~1"=="python" goto :python
if /i "%~1"=="node" goto :node
if /i "%~1"=="refresh" goto :refresh_path
if /i "%~1"=="find-python" goto :find_python
if /i "%~1"=="find-npm" goto :find_npm
if /i "%~1"=="all" (
    call "%~f0" python
    if errorlevel 1 exit /b 1
    call "%~f0" node
    exit /b %ERRORLEVEL%
)
echo Verwendung: _install-prereqs.bat python^|node^|all^|refresh^|find-python^|find-npm
exit /b 1

:python
call :disable_store_aliases
call :refresh_path
call :find_python
if not errorlevel 1 exit /b 0
echo.
echo [Setup] Python nicht gefunden - Installation per winget ...
call :winget_check || exit /b 1
echo      Paket: Python 3.11 ^(ggf. UAC-Abfrage bestaetigen^)
winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements --disable-interactivity
call :disable_store_aliases
call :refresh_path
call :wait_for_python 90
if not errorlevel 1 exit /b 0
echo.
echo Python konnte nicht eingerichtet werden.
exit /b 1

:node
call :disable_store_aliases
call :refresh_path
call :find_npm
if not errorlevel 1 exit /b 0
echo.
echo [Setup] Node.js/npm nicht gefunden - Installation per winget ...
call :winget_check || exit /b 1
echo      Paket: Node.js LTS ^(ggf. UAC bestaetigen^)
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --disable-interactivity
call :refresh_path
call :wait_for_npm 90
call :find_npm
if not errorlevel 1 exit /b 0
echo.
echo [Setup] Erneuter Versuch mit Administratorrechten ...
call :winget_node_elevated
call :refresh_path
call :wait_for_npm 120
call :find_npm
if not errorlevel 1 exit /b 0
echo.
echo Node.js/npm konnte nicht eingerichtet werden.
exit /b 1

:find_python
set "PYTHON_EXE="
call :refresh_path

for /f "delims=" %%D in ('dir /b /ad /o-n "%LocalAppData%\Programs\Python\Python3*" 2^>nul') do (
    call :try_python_exe "%LocalAppData%\Programs\Python\%%D\python.exe"
    if defined PYTHON_EXE exit /b 0
)
for /f "delims=" %%D in ('dir /b /ad /o-n "%ProgramFiles%\Python3*" 2^>nul') do (
    call :try_python_exe "%ProgramFiles%\%%D\python.exe"
    if defined PYTHON_EXE exit /b 0
)
for %%P in (
    "%ProgramFiles%\Python311\python.exe"
    "%ProgramFiles%\Python312\python.exe"
) do (
    call :try_python_exe "%%~P"
    if defined PYTHON_EXE exit /b 0
)

if exist "%SystemRoot%\py.exe" (
    for /f "delims=" %%E in ('"%SystemRoot%\py.exe" -3.11 -c "import sys; print(sys.executable)" 2^>nul') do (
        call :try_python_exe "%%E"
        if defined PYTHON_EXE exit /b 0
    )
)

for /f "delims=" %%P in ('where python 2^>nul') do (
    echo %%P | findstr /i "\\Microsoft\\WindowsApps\\" >nul
    if errorlevel 1 (
        call :try_python_exe "%%P"
        if defined PYTHON_EXE exit /b 0
    )
)

exit /b 1

:find_npm
set "NPM_CMD="
call :refresh_path

if exist "%ProgramFiles%\nodejs\npm.cmd" (
    call :try_npm_cmd "%ProgramFiles%\nodejs\npm.cmd"
    if defined NPM_CMD exit /b 0
)
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    call :try_npm_cmd "%ProgramFiles(x86)%\nodejs\npm.cmd"
    if defined NPM_CMD exit /b 0
)

for /f "delims=" %%F in ('dir /s /b "%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS*\npm.cmd" 2^>nul') do (
    call :try_npm_cmd "%%F"
    if defined NPM_CMD exit /b 0
)

for /f "delims=" %%P in ('where npm.cmd 2^>nul') do (
    echo %%P | findstr /i "\\Microsoft\\WindowsApps\\" >nul
    if errorlevel 1 (
        call :try_npm_cmd "%%P"
        if defined NPM_CMD exit /b 0
    )
)

exit /b 1

:try_python_exe
set "CAND=%~1"
if not exist "%CAND%" exit /b 1
"%CAND%" -c "import sys" >nul 2>&1
if errorlevel 1 exit /b 1
set "PYTHON_EXE=%CAND%"
for %%D in ("%CAND%") do set "PATH=%%~dpD;%%~dpDScripts;%PATH%"
exit /b 0

:try_npm_cmd
set "CAND=%~1"
if not exist "%CAND%" exit /b 1
call "%CAND%" -v >nul 2>&1
if errorlevel 1 exit /b 1
set "NPM_CMD=%CAND%"
for %%D in ("%CAND%") do set "PATH=%%~dpD;%PATH%"
exit /b 0

:wait_for_python
set /a _WAIT_MAX=%~1
if not defined _WAIT_MAX set /a _WAIT_MAX=90
set /a _WAIT=0
:wait_python_loop
call :find_python
if not errorlevel 1 exit /b 0
if %_WAIT% geq %_WAIT_MAX% exit /b 1
timeout /t 2 /nobreak >nul
set /a _WAIT+=2
goto :wait_python_loop

:wait_for_npm
set /a _WAIT_MAX=%~1
if not defined _WAIT_MAX set /a _WAIT_MAX=90
set /a _WAIT=0
:wait_npm_loop
call :find_npm
if not errorlevel 1 exit /b 0
call :refresh_path
if %_WAIT% geq %_WAIT_MAX% exit /b 1
timeout /t 2 /nobreak >nul
set /a _WAIT+=2
goto :wait_npm_loop

:winget_node_elevated
net session >nul 2>&1
if not errorlevel 1 (
    call "%~dp0_winget-install-node.bat"
    exit /b %ERRORLEVEL%
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~dp0_winget-install-node.bat' -WorkingDirectory '%~dp0' -Verb RunAs -Wait"
exit /b 0

:winget_check
where winget >nul 2>&1
if errorlevel 1 (
    echo winget nicht verfuegbar.
    exit /b 1
)
exit /b 0

:disable_store_aliases
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe" (
    del /f /q "%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe" >nul 2>&1
)
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\python3.exe" (
    del /f /q "%LOCALAPPDATA%\Microsoft\WindowsApps\python3.exe" >nul 2>&1
)
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\node.exe" (
    del /f /q "%LOCALAPPDATA%\Microsoft\WindowsApps\node.exe" >nul 2>&1
)
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\npm.cmd" (
    del /f /q "%LOCALAPPDATA%\Microsoft\WindowsApps\npm.cmd" >nul 2>&1
)
exit /b 0

:refresh_path
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Links" (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"
)
for /f "delims=" %%D in ('dir /b /ad /o-n "%LocalAppData%\Programs\Python\Python3*" 2^>nul') do (
    if exist "%LocalAppData%\Programs\Python\%%D\python.exe" (
        set "PATH=%LocalAppData%\Programs\Python\%%D;%LocalAppData%\Programs\Python\%%D\Scripts;%PATH%"
    )
)
for /f "delims=" %%D in ('dir /b /ad /o-n "%ProgramFiles%\Python3*" 2^>nul') do (
    if exist "%ProgramFiles%\%%D\python.exe" (
        set "PATH=%ProgramFiles%\%%D;%ProgramFiles%\%%D\Scripts;%PATH%"
    )
)
if exist "%ProgramFiles%\Python311\python.exe" (
    set "PATH=%ProgramFiles%\Python311;%ProgramFiles%\Python311\Scripts;%PATH%"
)
if exist "%ProgramFiles%\nodejs" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
if exist "%ProgramFiles(x86)%\nodejs" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)
exit /b 0
