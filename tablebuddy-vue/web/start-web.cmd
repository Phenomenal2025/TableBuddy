@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
node scripts\start.mjs --open
if errorlevel 1 pause
