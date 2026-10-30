#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================================"
echo "   CAREERBRIDGE ON-PREMISE AI WORKER CLIENT"
echo "   Khởi chạy ứng dụng và Giao diện Quản trị Nội bộ (Local Web UI)"
echo "======================================================================"
echo ""

if [ ! -d "node_modules" ]; then
    echo "[INFO] Chưa cài đặt thư viện. Đang tự động chạy npm install..."
    npm install
fi

echo "[INFO] Đang khởi động Web Dashboard tại http://localhost:5050 ..."
if which xdg-open > /dev/null; then
    xdg-open http://localhost:5050 &
elif which open > /dev/null; then
    open http://localhost:5050 &
fi

npm run dev
