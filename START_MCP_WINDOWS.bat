@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (
  echo [ERROR] Node.js 20.17 or newer is required.
  pause
  exit /b 1
)
if not exist node_modules call npm install || exit /b 1
call npm run build || exit /b 1
node dist\index.js
