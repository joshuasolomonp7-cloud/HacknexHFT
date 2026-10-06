@echo off
title AutoSWE Agent Launcher
echo ====================================================
echo Launching AutoSWE Agent (Backend + Frontend)
echo ====================================================

start "AutoSWE Backend" cmd /k start_backend.bat
timeout /t 2 >nul
start "AutoSWE Frontend" cmd /k start_frontend.bat

echo Both servers launched!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
