@echo off
TITLE Capstone Dashboard Launcher

echo =========================================
echo   Starting HRMS Application
echo =========================================

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo =========================================
echo   Starting Backend and Frontend...
echo   Browser will open in 10 seconds!
echo =========================================

npx concurrently "cd backend && npm run dev" "cd frontend && npm run dev" "timeout /t 10 >nul && start http://localhost:3000"

pause