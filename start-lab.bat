@echo off
title Lab Hayah - Start
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js is not installed. Install it from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing libraries for the first time...
  call npm install --no-audit --no-fund
)

if not exist "index.html" (
  echo [Error] index.html not found. Run this file from the project folder.
  pause
  exit /b 1
)

curl -s -o nul http://localhost:3000/api/public/settings
if errorlevel 1 (
  echo Starting server...
  start "HayahLabServer" /min cmd /c node server.js
) else (
  echo Server is already running.
)

set READY=0
for /L %%i in (1,1,40) do (
  curl -s -o nul http://localhost:3000/api/public/settings
  if not errorlevel 1 ( set READY=1 & goto GOOPEN )
  ping -n 2 127.0.0.1 >nul
)

:GOOPEN
if "%READY%"=="1" (
  echo Server is ready. Opening browser...
) else (
  echo Warning: server is slow. Opening browser anyway.
)
start "" "http://localhost:3000"
echo.
echo Website: http://localhost:3000
echo Admin panel: http://localhost:3000/life-qarshia-9137
echo To stop: run stop-lab.bat
echo You can close this window - server runs minimized.
ping -n 6 127.0.0.1 >nul
