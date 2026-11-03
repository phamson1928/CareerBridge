@echo off
chcp 65001 >nul
title CareerBridge AI Worker Client

echo ======================================================================
echo    CAREERBRIDGE ON-PREMISE AI WORKER CLIENT
echo    Khoi chay ung dung va Giao dien Quan tri Noi bo (Local Web UI)
echo ======================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo ======================================================================
    echo [ERROR] May tinh cua ban chua cai dat Node.js!
    echo Vui long tai va cai dat Node.js tai: https://nodejs.org (Ban LTS)
    echo Sau khi cai xong, hay nhap dup lai file start.bat nay.
    echo ======================================================================
    pause
    exit /b 1
)

if not exist .env (
    if exist .env.example (
        echo [INFO] Khoi tao file .env tu mau .env.example...
        copy .env.example .env >nul
    )
)

if not exist node_modules (
    echo [INFO] Phat hien chua cai dat thu vien. Dang tu dong chay npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Cai dat that bai. Vui long kiem tra lai Node.js va npm!
        pause
        exit /b 1
    )
)

echo [INFO] Dang khoi dong Web Dashboard va AI Worker...
call npm run dev
if errorlevel 1 (
    echo.
    echo [ERROR] Worker da dung lai voi ma loi.
    pause
)
