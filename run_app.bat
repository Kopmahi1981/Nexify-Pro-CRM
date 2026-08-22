@echo off
TITLE Nexify Pro CRM - Full Stack Launcher

echo ===================================================
echo       STARTING NEXIFY PRO CRM + AI LEAD HUNTER
echo ===================================================

:: 1. Launch FastAPI Backend
echo [1/2] Starting Python FastAPI Backend on port 8000...
start "Nexify Pro Backend (FastAPI)" cmd /k "cd Backend && uvicorn server:app --reload --port 8000"

:: 2. Launch React Frontend
echo [2/2] Starting React Vite Frontend on port 5173...
start "Nexify Pro Frontend (Vite)" cmd /k "cd Frontend && npm run dev"

echo ===================================================
echo  All services are booting!
echo  Backend Docs:  http://localhost:8000/docs
echo  CRM Dashboard: http://localhost:5173
echo ===================================================
pause