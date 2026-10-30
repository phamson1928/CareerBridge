@echo off
chcp 65001 >nul
title CareerBridge AI Worker Client

echo ======================================================================
echo    CAREERBRIDGE ON-PREMISE AI WORKER CLIENT
echo    Khoi chay ung dung va Giao dien Quan tri Noi bo (Local Web UI)
echo ======================================================================
echo.

cd /d "%~dp0"

if not exist node_modules (
    echo [INFO] Phat hien chua cai dat thu vien. Dang tu dong chay npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Cai dat that bai. Vui long kiem tra lai Node.js va npm!
        pause
        exit /b 1
    )
)

echo [INFO] Dang khoi dong Web Dashboard tai http://localhost:5050 ...
start http://localhost:5050

call npm run dev
if errorlevel 1 (
    echo.
    echo [ERROR] Worker da dung lai voi ma loi.
    pause
)
