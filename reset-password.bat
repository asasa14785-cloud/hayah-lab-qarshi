@echo off
title Reset admin password
cd /d "%~dp0"
set /p NEWPASS=Enter new admin password (min 6 chars):
node reset-password.js %NEWPASS%
pause
