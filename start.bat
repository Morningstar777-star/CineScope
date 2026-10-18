@echo off
TITLE CineScope — Local AI Entertainment Intelligence

echo =======================================================================
echo          CINESCOPE — LOCAL AI ENTERTAINMENT INTELLIGENCE
echo =======================================================================
echo.
echo [1/3] Environment check...
set PYTHON_EXE=c:\Users\Yash\Desktop\Other Pojects\Exploration\.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
    echo [ERROR] Virtual environment python not found at %PYTHON_EXE%
    pause
    exit /b 1
)

echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000...
start "CineScope Backend (FastAPI)" cmd /k "cd backend && "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Launching React + Vite Frontend on http://localhost:5173...
start "CineScope Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo  CineScope is starting up!
echo  Frontend URL: http://localhost:5173
echo  Backend Docs: http://127.0.0.1:8000/docs
echo =======================================================================
echo.
pause
