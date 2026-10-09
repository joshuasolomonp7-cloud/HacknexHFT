@echo off
title AutoSWE Agent - Frontend UI
echo ====================================================
echo Starting AutoSWE Agent Frontend Dashboard (Vite + React)
echo ====================================================

set "PATH=C:\Program Files\nodejs;%PATH%"
cd frontend

if not exist node_modules (
    echo Installing node dependencies (first time setup)...
    call npm install
)

echo.
echo Starting Vite Dev Server on http://localhost:5173 ...
call npm run dev
pause
