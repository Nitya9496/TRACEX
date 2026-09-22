@echo off
title SIH-DarkWeb-MVP Smoke Tests
echo Running backend smoke tests and workflow integration tests...

if exist "%~dp0backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

cd /d "%~dp0"
"%PYTHON_EXE%" backend\smoke_test.py
pause

