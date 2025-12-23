# 🚀 AI Recruitment Agent - Backend + n8n Architecture

## 📋 Tổng Quan

Hệ thống tuyển dụng tự động sử dụng AI để phân tích CV, chấm điểm đa tiêu chí, và orchestration workflow qua n8n.

### 🏗️ Kiến Trúc

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │◀────────│     n8n     │
│   (React)   │         │  (Node/TS)  │         │ (Workflow)  │
└─────────────┘         └─────────────┘         └─────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌────────┐ ┌─────────┐
              │ Supabase │ │ Redis  │ │ Gemini  │
              │   (DB)   │ │(Queue) │ │  (AI)   │
              └──────────┘ └────────┘ └─────────┘
```

### 🔄 Luồng Hoạt Động

1. **n8n nhận webhook** → Upload CV → Gọi Backend `/api/candidates/intake`
2. **Backend** → Tạo candidate record → Trả signed upload URL
3. **n8n** → Upload file lên Supabase → Gọi `/api/candidates/:id/enqueue`
4. **Backend** → Enqueue job vào BullMQ
5. **Worker** → Download CV → Parse (PDF/DOCX) → Extract entities
6. **Worker** → Gọi Gemini AI → Chấm điểm đa tiêu chí
7. **Worker** → Update DB → Gửi callback về n8n
8. **n8n** → Nhận kết quả → Branching workflow:
   - ✅ **Pass**: Gửi email mời phỏng vấn + Tạo calendar event
   - ⚠️ **Borderline**: Gửi Slack/Teams cho HR manual review
   - ❌ **Reject**: Gửi email feedback + kỹ năng thiếu

---

## 🛠️ Tính Năng Chính

### Backend (Node.js/TypeScript)

- ✅ **CV Parsing**: PDF + DOCX support (pdf-parse, mammoth)
- ✅ **Entity Extraction**: Email, phone, skills, experience, education
- ✅ **AI Scoring**: Gemini Pro với prompt động từ JD
  - Điểm kỹ thuật (tech)
  - Điểm kinh nghiệm (experience)
  - Điểm ngoại ngữ (language)
  - Điểm văn hóa (culture fit)
- ✅ **Rule Engine**: Phân luồng tự động (pass/borderline/reject)
- ✅ **Queue System**: BullMQ với retry exponential backoff
- ✅ **Security**: API key auth, rate limiting, webhook signature
- ✅ **Logging**: Pino structured logging với request tracking
- ✅ **Notifications**: Email (HTML), Slack, Teams
- ✅ **Status History**: Audit trail cho mỗi candidate

### n8n Workflows

- 📥 **Intake Workflow**: Webhook → Validate → Upload → Enqueue
- 📊 **Processing Workflow**: Poll/callback → Get result → Branch
- 📧 **Email Workflow**: Template engine → Send via SMTP/API
- 📅 **Calendar Workflow**: Google Calendar / MS Teams integration
- 💬 **Notification Workflow**: Slack cards / Teams adaptive cards
- 🔄 **Manual Review**: Slack approval buttons → Update status

---

## 📦 Cài Đặt

### 1. Prerequisites

```bash
# Cần cài đặt:
- Node.js >= 18
- Redis (hoặc Redis Cloud)
- Supabase account
- Google Gemini API key
- n8n instance (self-hosted hoặc cloud)
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy .env
cp .env.example .env
# Điền các biến môi trường (xem .env.example)

# Run database migration
# Truy cập Supabase SQL Editor và chạy:
# - database_schema.sql (schema ban đầu)
# - database_migration.sql (thêm columns mới)

# Start Redis
redis-server

# Development
npm run dev

# Production
npm run build
npm start
```

### 3. n8n Setup

Xem file `N8N_WORKFLOWS_REFERENCE.md` để import workflows.

---

## 🔧 API Endpoints

### Candidates

- `POST /api/candidates/intake` - Tạo candidate và trả signed upload URL
- `POST /api/candidates/:id/enqueue` - Enqueue analysis job
- `GET /api/candidates` - List candidates với filters
- `GET /api/candidates/:id` - Chi tiết candidate
- `PATCH /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Xóa candidate

### Jobs

- `POST /api/jobs` - Tạo job mới
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Chi tiết job
- `PATCH /api/jobs/:id` - Update job

### Webhooks

- `POST /api/webhooks/n8n` - Webhook từ n8n (manual review, events)

### AI

- `POST /api/ai/analyze` - Phân tích CV thủ công
- `POST /api/ai/compare` - So sánh CV với nhiều JD

---

## 🗄️ Database Schema

### Candidates Table (Mở rộng)

```sql
- id, full_name, email, phone_number
- job_id (FK to jobs)
- cv_url, cv_text, cv_entities (JSONB)
- status, status_history (JSONB[])
- ai_score, scores (JSONB), ai_analysis (JSONB)
- notes, created_at, updated_at
```

### Status Flow

```
pending → processing → screening-passed → interview-scheduled → hired
                    ↓
              borderline → (manual review)
                    ↓
              rejected
```

### Scores Structure

```json
{
  "overall": 85,
  "tech": 90,
  "experience": 80,
  "language": 75,
  "culture_fit": 85
}
```

---

## 🧪 Testing

```bash
# Test intake flow
curl -X POST http://localhost:8080/api/candidates/intake \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyen Van A",
    "email": "a@example.com",
    "phone": "0123456789",
    "job_id": "uuid-here",
    "file_name": "cv.pdf"
  }'

# Upload file to signed URL (from response)
curl -X PUT "signed-url-here" \
  --upload-file cv.pdf \
  -H "Content-Type: application/pdf"

# Enqueue analysis
curl -X POST http://localhost:8080/api/candidates/{id}/enqueue \
  -H "Content-Type: application/json" \
  -d '{"path": "path/to/cv.pdf"}'

# Check result
curl http://localhost:8080/api/candidates/{id}
```

---

## 🔒 Security

1. **API Key**: Thêm `X-API-Key` header hoặc `?apiKey=xxx`
2. **Rate Limiting**: 100 requests/minute per IP
3. **Webhook Signature**: HMAC SHA256 verification
4. **File Validation**: Chỉ cho phép PDF/DOCX, max 10MB
5. **Signed URLs**: Hết hạn sau 10 phút

---

## 📊 Monitoring & Logging

### Logs

- **Pino structured logging**: JSON format, levels: trace/debug/info/warn/error
- **Request tracking**: Mỗi request có `requestId` unique
- **Queue events**: Job completed/failed/stalled

### Metrics

- Job processing time
- Success/failure rate
- API response times
- Queue length

### BullMQ Dashboard

```bash
# Xem queue qua Redis CLI
redis-cli
> KEYS bull:candidate-analysis:*

# Hoặc dùng BullMQ Board (optional)
npm install -g bull-board
```

---

## 🚀 Deployment

### Backend (Node.js)

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name ai-recruitment

# Monitor
pm2 logs ai-recruitment
pm2 monit
```

### Redis

- **Local**: `redis-server`
- **Cloud**: Upstash, Redis Cloud, AWS ElastiCache

### Supabase

- Tạo project tại [supabase.com](https://supabase.com)
- Chạy migrations trong SQL Editor
- Tạo bucket `cvs` trong Storage

### n8n

- **Self-hosted**: Docker Compose (xem `docker-compose.yml` trong n8n docs)
- **Cloud**: [n8n.cloud](https://n8n.cloud)

---

## 🎯 Tối Ưu Hóa

### Performance

1. **Caching**: Redis cache cho job results
2. **Batch Processing**: Xử lý nhiều CV cùng lúc
3. **CDN**: Serve CV files qua CDN (Cloudflare)

### Cost

1. **Gemini API**: Dùng Gemini Flash cho parsing, Pro cho scoring
2. **Redis**: Chọn instance nhỏ (256MB đủ cho development)
3. **Supabase**: Free tier support 500MB storage

### Scalability

1. **Horizontal Scaling**: Chạy nhiều workers
2. **Queue Priority**: Priority cao cho VIP candidates
3. **Load Balancer**: Nginx cho multiple backend instances

---

## 📝 TODO / Future Enhancements

- [ ] OpenTelemetry tracing (distributed tracing)
- [ ] ClamAV virus scanning
- [ ] Video interview support
- [ ] Candidate portal (self-service)
- [ ] Multi-language support
- [ ] Advanced NER with Hugging Face models
- [ ] GraphQL API
- [ ] WebSocket real-time updates

---

## 🤝 Contributing

Vui lòng tạo Pull Request hoặc Issue trên GitHub.

---

## 📄 License

MIT License

---

## 📞 Support

- Email: support@recruitment.com
- Docs: [Link to full documentation]
- Slack: [Workspace link]

---

**Made with ❤️ for AI-powered recruitment**
