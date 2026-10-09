@echo off
title CodeNexus SWEAgent Launcher
echo ====================================================
echo Launching CodeNexus SWEAgent (Backend + Frontend)
echo ====================================================

start "CodeNexus Backend" cmd /k start_backend.bat
timeout /t 2 >nul
start "CodeNexus Frontend" cmd /k start_frontend.bat

echo.
echo Both servers launched on dedicated non-conflicting ports!
echo Backend API : http://localhost:8090
echo Frontend UI : http://localhost:5188
echo.
