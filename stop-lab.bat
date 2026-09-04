@echo off
title Lab Hayah - Stop
taskkill /FI "WINDOWTITLE eq HayahLabServer*" /F >nul 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo Server stopped.
ping -n 3 127.0.0.1 >nul
