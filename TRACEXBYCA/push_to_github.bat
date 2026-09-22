@echo off
title Push TRACEX to GitHub
echo ========================================================
echo Pushing TRACEX to https://github.com/Nitya9496/TRACEX ...
echo ========================================================
cd /d "%~dp0"
"C:\Program Files\Git\cmd\git.exe" push -f -u origin main
echo.
echo ========================================================
echo Push complete! Check https://github.com/Nitya9496/TRACEX
echo ========================================================
pause

