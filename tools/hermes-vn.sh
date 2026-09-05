#!/bin/bash

# Đường dẫn chuẩn tới bản gốc
HERMES_BIN="/home/hermes/.local/bin/hermes"

# Lọc và dịch qua luồng (stream)
$HERMES_BIN "$@" | sed \
  -e 's/Analyzing/Đang phân tích/g' \
  -e 's/Brainstorming/Đang lên ý tưởng/g' \
  -e 's/Pondering/Đang suy ngẫm/g' \
  -e 's/Synthesizing/Đang tổng hợp/g' \
  -e 's/best-coding/Chế độ code/g'
