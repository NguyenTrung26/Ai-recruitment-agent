# AI Recruitment Agent - Backend API

## 🚀 Complete Backend Setup

Đây là backend API hoàn chỉnh cho hệ thống tuyển dụng AI, tích hợp với N8N workflows.

## 📋 API Endpoints

### **Candidates**

- `POST /api/candidates/intake` (secured by `x-api-key`) - Nhận metadata, trả signed URL để upload CV
- `POST /api/candidates/:id/ingest` (secured by `x-api-key`) - Xác nhận upload xong và enqueue AI screening
- `GET /api/candidates` - Lấy danh sách ứng viên (filter: status, job_id)
- `GET /api/candidates/:id` - Chi tiết ứng viên
- `PATCH /api/candidates/:id/status` - Cập nhật trạng thái

### **Jobs**

- `POST /api/jobs` - Tạo job posting mới
- `GET /api/jobs` - Danh sách jobs (filter: status, department, employment_type)
- `GET /api/jobs/:id` - Chi tiết job
- `PATCH /api/jobs/:id` - Cập nhật job
- `DELETE /api/jobs/:id` - Xóa job

### **AI Analysis**

- `POST /api/ai/analyze` - Trigger AI analysis thủ công cho candidate
- `GET /api/ai/compare/:candidateId` - So sánh ứng viên với tất cả jobs đang mở

### **Statistics**

- `GET /api/statistics` - Dashboard statistics tổng quan
- `GET /api/statistics/job/:jobId` - Statistics theo từng job

## 🛠️ Setup Instructions

### 1. Install Dependencies

\`\`\`bash
cd backend
npm install
\`\`\`

### 2. Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Điền thông tin:

- `SUPABASE_URL` & `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (khuyến nghị nếu khác với SUPABASE_KEY)
- `SUPABASE_BUCKET` (mặc định `cvs`)
- `GEMINI_API_KEY`
- `REDIS_URL`
- `API_KEY` (backend auth cho n8n gọi intake/ingest)
- `N8N_CALLBACK_URL` (tùy chọn: backend POST kết quả)

### 3. Run Server

\`\`\`bash
npm run dev
\`\`\`

Server chạy tại: `http://localhost:8080`

## 🗄️ Database Schema (Supabase)

### Table: `candidates`

\`\`\`sql
CREATE TABLE candidates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
full_name TEXT NOT NULL,
email TEXT NOT NULL,
phone TEXT,
job_id UUID REFERENCES jobs(id),
cv_url TEXT NOT NULL,
status TEXT DEFAULT 'received',
ai_score INTEGER,
ai_analysis JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Table: `jobs`

\`\`\`sql
CREATE TABLE jobs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
title TEXT NOT NULL,
department TEXT NOT NULL,
location TEXT NOT NULL,
employment_type TEXT NOT NULL,
description TEXT NOT NULL,
requirements TEXT NOT NULL,
salary_range TEXT,
experience_level TEXT NOT NULL,
skills_required TEXT[] NOT NULL,
status TEXT DEFAULT 'open',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

## 🔗 Tích hợp với N8N

Backend này được thiết kế để làm việc song song với N8N workflows:

1. **Backend API** xử lý:

   - Nhận CV uploads
   - Quản lý jobs & candidates
   - Dashboard statistics
   - Manual AI re-analysis

2. **N8N Workflows** xử lý:
   - Automated AI screening
   - Email notifications
   - Background processing

## 🧪 Testing APIs

### Create a Job

\`\`\`bash
curl -X POST http://localhost:8080/api/jobs \
 -H "Content-Type: application/json" \
 -d '{
"title": "Backend Developer",
"department": "Engineering",
"location": "Remote",
"employment_type": "full-time",
"description": "We are looking for...",
"requirements": "3+ years Node.js...",
"experience_level": "mid",
"skills_required": ["Node.js", "PostgreSQL", "Docker"]
}'
\`\`\`

### Intake + Upload + Enqueue (3 bước)

1) Intake metadata -> lấy signed URL

```bash
curl -X POST http://localhost:8080/api/candidates/intake \
 -H "x-api-key: <API_KEY>" \
 -H "Content-Type: application/json" \
 -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "0123456789",
    "job_id": "<job-uuid>",
    "file_name": "cv.pdf"
 }'
```

2) Upload CV (PUT binary lên `uploadUrl` từ bước 1)

```bash
curl -X PUT "<uploadUrl>" \
   -H "Content-Type: application/pdf" \
   --data-binary @./cv.pdf
```

3) Xác nhận & enqueue AI

```bash
curl -X POST http://localhost:8080/api/candidates/<candidateId>/ingest \
 -H "x-api-key: <API_KEY>" \
 -H "Content-Type: application/json" \
 -d '{"path": "<storagePath from step 1>"}'
```

### Get Statistics

\`\`\`bash
curl http://localhost:8080/api/statistics
\`\`\`

## 🎯 Key Features

✅ Complete CRUD for Jobs & Candidates
✅ AI-powered CV screening với Gemini
✅ Multi-job comparison cho candidates
✅ Real-time statistics dashboard
✅ Manual re-analysis capability
✅ Error handling & validation
✅ CORS support
✅ Request logging

## 📦 Project Structure

\`\`\`
backend/
├── src/
│ ├── controllers/ # API logic
│ │ ├── candidate.controller.ts
│ │ ├── job.controller.ts
│ │ ├── ai.controller.ts
│ │ └── statistics.controller.ts
│ ├── routes/ # API routes
│ ├── services/ # External services (Gemini, N8N, Supabase)
│ ├── schemas/ # Zod validation schemas
│ ├── middleware/ # Error handling, logging
│ ├── config.ts # Environment config
│ └── server.ts # Main entry point
├── package.json
└── tsconfig.json
\`\`\`

## 🚦 Next Steps

1. **Chạy migrations** tạo tables trong Supabase
2. **Test các endpoints** với Postman/curl
3. **Kết nối N8N** với backend webhooks
4. **Deploy backend** lên production (Railway, Render, etc.)
