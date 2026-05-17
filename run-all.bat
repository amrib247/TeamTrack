@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    TeamTrack Development Environment
echo ========================================
echo.

if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: package.json not found in frontend directory!
    pause
    exit /b 1
)

echo Starting frontend development server...
echo.
echo Frontend: http://localhost:5173
echo.
echo Ensure frontend/.env has your Firebase configuration.
echo.

start "TeamTrack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Press any key to close this window...
pause >nul
