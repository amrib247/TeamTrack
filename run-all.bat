@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    TeamTrack Development Environment
echo ========================================
echo.

:: Check if backend directory exists
if not exist "backend" (
    echo ERROR: Backend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

:: Check if frontend directory exists
if not exist "frontend" (
    echo ERROR: Frontend directory not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

:: Check if gradlew exists in backend
if not exist "backend\gradlew.bat" (
    echo ERROR: Gradle wrapper not found in backend directory!
    echo Please ensure you have the Gradle wrapper files.
    pause
    exit /b 1
)

:: Check if package.json exists in frontend
if not exist "frontend\package.json" (
    echo ERROR: package.json not found in frontend directory!
    echo Please ensure you have the frontend dependencies installed.
    pause
    exit /b 1
)

echo Starting development servers...
echo.

:: Start backend in a new window
echo [1/2] Starting Spring Boot backend...
start "TeamTrack Backend" cmd /k "cd /d %~dp0backend && echo Starting backend server... && gradlew.bat bootRun"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
echo [2/2] Starting React frontend...
start "TeamTrack Frontend" cmd /k "cd /d %~dp0frontend && echo Starting frontend server... && npm run dev"

echo.
echo ========================================
echo    Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173 (or check the frontend window)
echo.
echo Press any key to close this window...
echo (The server windows will remain open)
pause >nul
