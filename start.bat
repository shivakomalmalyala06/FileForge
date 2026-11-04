@echo off
title FileForge - Starter
echo ========================================================
echo   Launching FileForge: Dynamic File Organizer
echo ========================================================
echo.

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "FileForge Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting Vite React Frontend on http://localhost:5173 ...
start "FileForge Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   FileForge is running!
echo   - Web App: http://localhost:5173
echo   - API Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
