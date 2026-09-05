# OMNIROUTE-SETUP.md — Cấu Hình OmniRoute Xoay Tài Khoản Free

_OmniRoute gateway: 127.0.0.1:20128_
_Mục đích: route LLM calls qua các tài khoản free để không bị rate limit_

---

## OmniRoute là gì?

OmniRoute (`127.0.0.1:20128`) là **LLM gateway local** chạy trên VPS.
- Hermes gửi inference request → OmniRoute → chọn provider/account rảnh → trả kết quả
- Hỗ trợ xoay vòng nhiều tài khoản free (OpenAI, Anthropic, Gemini, v.v.)
- Không cần trả tiền khi dùng đúng free tier

---

## KIỂM TRA TRẠNG THÁI

Từ Hermes terminal:
```
omniroute_status()
```

Từ VPS terminal:
```bash
curl -s http://127.0.0.1:20128/health 2>/dev/null || echo "OmniRoute not running"
curl -s http://127.0.0.1:20128/v1/models 2>/dev/null | python3 -m json.tool | head -30
```

---

## THÊM TÀI KHOẢN FREE VÀO OMNIROUTE

### Cách 1: Qua config file

Tìm config file của OmniRoute:
```bash
find /home/hermes -name "config.*" 2>/dev/null | head -10
find ~/.config -name "omniroute*" 2>/dev/null | head -10
hermes config show 2>/dev/null | grep -A5 omniroute
```

Thêm provider vào config (định dạng tùy theo version):
```yaml
# Ví dụ config format (kiểm tra docs thực tế của hermes version của bạn)
omniroute:
  providers:
    - name: openai-account-1
      api_key: sk-xxx
      model: gpt-4o-mini
      weight: 1
    - name: openai-account-2
      api_key: sk-yyy
      model: gpt-4o-mini
      weight: 1
    - name: gemini-account-1
      api_key: AIzaXXX
      model: gemini-1.5-flash
      weight: 2
```

### Cách 2: Qua lệnh hermes

```bash
# Kiểm tra lệnh có sẵn
hermes provider --help 2>/dev/null
hermes gateway --help 2>/dev/null
hermes config --help 2>/dev/null
```

### Cách 3: Qua environment variables

```bash
# Thêm vào /etc/environment hoặc ~/.bashrc
export OMNIROUTE_PROVIDERS='[
  {"name":"gpt4omini-1","api_key":"sk-xxx","model":"gpt-4o-mini"},
  {"name":"gpt4omini-2","api_key":"sk-yyy","model":"gpt-4o-mini"},
  {"name":"gemini-1","api_key":"AIzaXXX","model":"gemini-1.5-flash"}
]'
```

---

## CHIẾN LƯỢC XOAY TÀI KHOẢN FREE TỐT NHẤT

### Các nguồn free tier có thể dùng

| Provider | Free tier | Rate limit | Model |
|---|---|---|---|
| Google Gemini | 60 req/min | 1M token/day | gemini-1.5-flash |
| Groq | 30 req/min | 6000 token/req | llama-3.1-8b |
| Together.ai | Hạn chế | - | nhiều model |
| OpenRouter | Free credits | - | nhiều model |
| Mistral AI | Free tier | - | mistral-7b |

### Cấu hình tối ưu cho coding tasks

```
Priority order (từ tốt nhất cho coding):
1. gemini-1.5-pro (nếu có quota)
2. gemini-1.5-flash (free, nhanh)
3. groq/llama-3.1-70b (free, code tốt)
4. groq/llama-3.1-8b (fallback)
```

---

## QUY TRÌNH HERMES + OMNIROUTE + OPENVIKING

```
Bạn paste task vào Hermes
    |
    v
Hermes gọi openviking_query("tc-gaming [topic]")
    -> Lấy context từ OpenViking memory
    |
    v
Hermes phân tích task + context
    -> Gửi inference request tới OmniRoute :20128
    |
    v
OmniRoute chọn account rảnh (round-robin / least-busy)
    -> Gửi tới provider (Gemini/Groq/etc.)
    -> Trả kết quả về Hermes
    |
    v
Hermes thực thi (đọc/sửa file trong /var/app/game)
    |
    v
Hermes gọi openviking_write để lưu progress
    |
    v
Hermes báo cáo kết quả
```

---

## MONITORING OMNIROUTE

```bash
# Kiểm tra log
journalctl -u hermes-gateway -f 2>/dev/null
# hoặc
tail -f ~/.local/share/hermes/logs/gateway.log 2>/dev/null

# Kiểm tra usage mỗi provider
curl -s http://127.0.0.1:20128/v1/usage 2>/dev/null
```

---

## TROUBLESHOOTING

| Vấn đề | Nguyên nhân | Fix |
|---|---|---|
| `omniroute_status()` không phản hồi | Gateway chưa chạy | `hermes gateway restart` |
| Tất cả providers đều fail | Rate limit hoặc key hết | Thêm account mới |
| Hermes chậm | Model bị throttle | Kiểm tra `omniroute_status()`, đổi model |
| `MEMORY_NOT_FOUND` từ OpenViking | Chưa bootstrap | Chạy `openviking_bootstrap.py` |

---

## LỆNH KHỞI ĐỘNG CHUẨN (Dán vào Hermes mỗi phiên)

```
[INIT]
omniroute_status()
openviking_query query="tc-gaming state" mode="list" top_k=3
Báo cáo: providers hoạt động + task pending tiếp theo.
```
