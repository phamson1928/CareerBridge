#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================================"
echo "   CAREERBRIDGE ON-PREMISE AI WORKER CLIENT"
echo "   Hệ thống quét và đánh giá CV nội bộ tự động (Console Daemon)"
echo "======================================================================"
echo ""

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "[INFO] Khởi tạo file .env từ mẫu .env.example..."
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Chưa cài đặt thư viện. Đang tự động chạy npm install..."
    npm install
fi

echo "[INFO] Đang khởi động AI Worker Client..."
npm run dev
