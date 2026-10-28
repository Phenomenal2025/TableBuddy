@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
node server.mjs --open
if errorlevel 1 pause
