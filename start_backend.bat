@echo off
title AutoSWE Agent - Backend Server
echo ====================================================
echo Starting AutoSWE Agent Backend Server (FastAPI)
echo ====================================================

cd backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo Installing/Verifying Python dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server on http://localhost:8090 ...
python main.py
pause
