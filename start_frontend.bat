@echo off
title CodeNexus SWEAgent - Frontend UI
echo ====================================================
echo Starting CodeNexus Frontend Dashboard (Vite + React)
echo Dedicated Port: http://localhost:5188
echo ====================================================

set "PATH=C:\Program Files\nodejs;%PATH%"
cd frontend

if not exist node_modules (
    echo Installing node dependencies (first time setup)...
    call npm install
)

echo.
echo Starting Vite Dev Server on http://localhost:5188 ...
call npm run dev
pause
