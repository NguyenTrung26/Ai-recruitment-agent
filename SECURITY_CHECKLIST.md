# 🔒 SECURITY CHECKLIST - BẮT BUỘC THỰC HIỆN

## ✅ ĐÃ HOÀN THÀNH (tự động)

- [x] Tạo .gitignore
- [x] Tạo .env.example
- [x] Remove .env.docker, test-supabase.js khỏi git tracking
- [x] Tạo các hướng dẫn chi tiết

## 🔴 CẦN LÀM NGAY (15-20 phút)

### 1. Rotate Supabase Keys (5 phút) - ƯU TIÊN CAO

- [ ] Vào https://supabase.com/dashboard/project/axozefedjmitcbioidtj/settings/api
- [ ] Reset `anon` key
- [ ] Reset `service_role` key
- [ ] Copy 2 keys mới
- [ ] Paste vào `backend/.env` (dòng 3 và 4)
- [ ] Paste vào `.env.docker` (dòng 2 và 3)

### 2. Rotate Gemini API Key (3 phút) - ƯU TIÊN CAO

- [ ] Vào https://aistudio.google.com/app/apikey
- [ ] Disable key cũ: `AIzaSyBYcylHsb0BcZVOqp_9u0_WcTWryRlaOUk`
- [ ] Tạo key mới
- [ ] Paste vào `backend/.env` (dòng 8)
- [ ] Paste vào `.env.docker` (dòng 5)

### 3. Rotate Redis Password (2 phút) - ƯU TIÊN TRUNG BÌNH

- [ ] Vào https://console.upstash.com/
- [ ] Chọn database: notable-hawk-36451
- [ ] Reset password
- [ ] Copy connection string mới
- [ ] Paste vào `backend/.env` (dòng 9)
- [ ] Paste vào `.env.docker` (dòng 6)

### 4. Rebuild Backend (2 phút)

```powershell
cd D:\N8n\Ai-recruitment-agent

# Stop container cũ
docker ps
docker stop <container_id>
docker rm <container_id>

# Rebuild với keys mới
docker build -t ai-recruitment-backend:local .\backend

# Run với .env.docker đã update
docker run -d -p 8081:8080 --env-file .env.docker ai-recruitment-backend:local

# Test
Start-Sleep -Seconds 3
curl http://localhost:8081/api/candidates?limit=1
```

### 5. Clean Git History (5 phút) - TÙY CHỌN

**Chỉ làm nếu:**

- Repo là private HOẶC
- Bạn chưa push lên remote HOẶC
- Chỉ bạn sử dụng repo

**Lệnh:**

```powershell
# Commit .gitignore
git add .gitignore .env.example
git commit -m "security: Add .gitignore for sensitive files"

# Nếu cần xóa history (NGUY HIỂM - chỉ làm nếu chắc chắn!)
# Xem chi tiết trong clean-git-history.sh
```

### 6. Update N8N Workflows (5 phút)

- [ ] Xóa workflow files local: `rm wf/*.json`
- [ ] Vào n8n: http://localhost:5678
- [ ] Setup Credentials cho Supabase
- [ ] Re-export workflows (without credentials)
- [ ] Test workflows với keys mới

## 🟢 SAU KHI HOÀN THÀNH

### Verify tất cả hoạt động:

```powershell
# 1. Backend health
curl http://localhost:8081/health

# 2. Get candidates
curl http://localhost:8081/api/candidates?limit=1

# 3. Test approve
curl http://localhost:8081/api/decision/approve `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"candidateId":22,"interviewDate":"2025-12-25","interviewTime":"10:00"}'

# 4. Check n8n
# Vào http://localhost:5678 và test workflow
```

## 📝 GHI CHÚ

**Keys CŨ bị lộ (KHÔNG DÙNG NỮA):**

- Supabase anon: `eyJhbG...P_M` (iat:1763643311)
- Supabase service: `eyJhbG...I70` (iat:1763643311)
- Gemini: `AIzaSyBYcylHsb0BcZVOqp_9u0_WcTWryRlaOUk`
- Redis: `AY5jAAIncDFi...`

**Files đã remove khỏi git:**

- .env.docker
- test-supabase.js
- Ai-recruitment-agent (1).json

**Files cần XÓA thủ công:**

- wf/Advanced-Recruitment-Workflow.json
- wf/Ai-recruitment-agent.json

---

**Thời gian ước tính:** 15-20 phút
**Mức độ:** Dễ - Chỉ cần copy/paste keys mới
