@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\start.mjs --open
) else (
  node scripts\start.mjs --open
)
if errorlevel 1 pause
