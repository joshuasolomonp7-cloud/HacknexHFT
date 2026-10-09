@echo off
title CodeNexus AI Dev Server Launcher
echo ========================================================
echo   Starting CodeNexus AI Autonomous SWE System
echo ========================================================

cd /d "%~dp0backend"
echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "CodeNexus Backend" /min "C:\Users\sanjeevan V\AppData\Local\Programs\Python\Python313\python.exe" main.py

cd /d "%~dp0frontend"
echo [2/3] Starting Vite Frontend on http://localhost:5173 ...
start "CodeNexus Frontend" /min cmd /c "npm run dev"

ping 127.0.0.1 -n 4 >nul
echo [3/3] Launching Developer Dashboard in browser ...
start http://localhost:5173

echo ========================================================
echo   Servers are active!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo ========================================================
