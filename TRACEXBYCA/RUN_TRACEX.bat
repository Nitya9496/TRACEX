@echo off
title TRACEX - Threat Intelligence Platform
color 0A
cls
echo ======================================================================
echo                     TRACEX - Cyber Threat Intelligence
echo                           Made by Cyber Aurors
echo ======================================================================
echo.
echo [1/2] Checking TRACEX Server...

netstat -ano | findstr :8000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo       Server is ALREADY RUNNING on http://localhost:8000!
) else (
    echo       Starting Server...
    cd /d "%~dp0backend"
    if exist "%~dp0backend\.venv\Scripts\python.exe" (
        start /min "TRACEX Engine" "%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    ) else if exist "D:\SIH-DarkWeb-MVP\backend\.venv\Scripts\python.exe" (
        start /min "TRACEX Engine" "D:\SIH-DarkWeb-MVP\backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    ) else (
        start /min "TRACEX Engine" python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    )
    timeout /t 2 >nul
)

echo.
echo [2/2] Opening TRACEX in your web browser...
start http://localhost:8000

echo.
echo ======================================================================
echo   SUCCESS! TRACEX is running at: http://localhost:8000
echo.
echo   To STOP the app, you can press any key here.
echo ======================================================================
echo.
pause

