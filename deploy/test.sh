#!/bin/bash
echo "--- Bắt đầu kiểm tra hệ thống ---"

# 1. Kiểm tra PM2
echo "-> Kiểm tra PM2 status:"
pm2 status

# 2. Kiểm tra các cổng API/Frontend/Admin
echo "-> Kiểm tra các cổng dịch vụ (netstat):"
netstat -tulpn | grep -E '8701|8781|8780' || echo "Cổng không mở!"

# 3. Kiểm tra kết nối MongoDB (sử dụng nc)
echo "-> Kiểm tra kết nối MongoDB (127.0.0.1:27017):"
nc -z 127.0.0.1 27017 && echo "MongoDB OK" || echo "MongoDB offline!"

echo "--- Kiểm tra hoàn tất ---"
