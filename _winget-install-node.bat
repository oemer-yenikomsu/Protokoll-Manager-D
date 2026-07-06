@echo off
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --disable-interactivity
exit /b %ERRORLEVEL%
