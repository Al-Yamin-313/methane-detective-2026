@echo off
title METHANE DETECTIVE - NASA Space Apps Challenge 2026
color 0B
echo =========================================================================
echo   METHANE DETECTIVE - UNMASKING EARTH'S INVISIBLE POLLUTERS
echo   NASA Space Apps Challenge 2026 : Earth System Trend Detective
echo   Team: RISING_CODERS_X
echo =========================================================================
echo.
echo [1/2] Verifying dependencies...
cd /d %~dp0
if not exist node_modules (
    echo Installing required packages...
    call npm install
)

echo.
echo [2/2] Launching Methane Detective Local Investigation Platform...
echo URL: http://localhost:5173
echo.
call npm run dev
pause
