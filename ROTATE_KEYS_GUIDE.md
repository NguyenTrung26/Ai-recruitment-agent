# ============================================
# HƯỚNG DẪN CẬP NHẬT KEYS SAU KHI ROTATE
# ============================================

# BƯỚC 1: Sau khi rotate Supabase keys, copy keys mới vào đây:

# File: backend/.env
SUPABASE_URL="https://axozefedjmitcbioidtj.supabase.co"
SUPABASE_KEY="PASTE_NEW_ANON_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="PASTE_NEW_SERVICE_ROLE_KEY_HERE"
SUPABASE_BUCKET="cvs"
GEMINI_API_KEY="PASTE_NEW_GEMINI_KEY_HERE"
REDIS_URL="redis://default:NEW_REDIS_PASSWORD@notable-hawk-36451.upstash.io:6379"
N8N_WEBHOOK_URL="http://localhost:5678/home/workflows"
API_KEY="db7db81b3c2416904fb25d5329d6165e96e1771eeb6d28d9633ca5823c7c39b5"
PORT=8080

# BƯỚC 2: Copy tương tự vào file .env.docker

# BƯỚC 3: Rebuild và restart container:
# docker build -t ai-recruitment-backend:local .\backend
# docker stop <container_id>
# docker rm <container_id>
# docker run -d -p 8081:8080 --env-file .env.docker ai-recruitment-backend:local

# BƯỚC 4: Test kết nối:
# curl http://localhost:8081/api/candidates?limit=1
