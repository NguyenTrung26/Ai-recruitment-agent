# Tích Hợp Lịch Tuyển Dụng - Tóm Tắt

## 🎯 Mục Tiêu

Tích hợp phần quản lý lịch đăng tuyển dụng từ n8n vào giao diện admin (Next.js) để có UX tốt hơn, xóa dependency n8n webhooks trực tiếp, và cho phép quản lý CRUD đầy đủ.

---

## ✅ Những Gì Đã Thực Hiện

### 1. **Frontend (fe/admin-ats)**

#### Cải Tiến Danh Sách Lịch Tuyển (`/admin/schedules`)

- **File:** `app/admin/schedules/page.tsx`
- ✅ Cập nhật giao diện hiển thị danh sách schedules
  - Thay đổi cột: hiển thị `job_title`, `job_desc`, `scheduled_time`, `status`, `apply_link`
  - Thêm nút **✏️ Sửa** và **❌ Xóa** cho mỗi lịch
  - Modal xác nhận trước khi xóa
- ✅ Tích hợp hàm `deleteSchedule()` để xóa lịch

#### Form Tạo Lịch Tuyển (`/admin/schedules/new`)

- **File:** `app/admin/schedules/new/page.tsx`
- ✅ Cải tiến UI/UX
  - Bổ sung trường `status: "todo"` khi tạo mới
  - Xử lý timezone Vietnam (UTC+7) chính xác

#### Page Sửa Lịch Tuyển (`/admin/schedules/[id]`)

- **File:** `app/admin/schedules/[id]/page.tsx` (TẠO MỚI)
- ✅ Cho phép sửa toàn bộ thông tin:
  - `job_title`, `job_desc`, `apply_link`, `scheduled_time`, `status`
  - Hỗ trợ thay đổi trạng thái (todo → done → cancel)
  - Tải dữ liệu từ backend và điền vào form
  - Gửi PUT request cập nhật

### 2. **Backend (Node.js Express)**

#### API Route `/api/schedules/[id]` (GET, PUT, DELETE)

- **File:** `backend/src/routes/schedule.routes.ts`

**GET /api/schedules/:id** (NEW)

```typescript
- Lấy chi tiết 1 schedule theo ID
- Response: { id, job_title, job_desc, scheduled_time, status, apply_link, posted_time }
```

**PUT /api/schedules/:id** (UPDATED)

```typescript
- Cập nhật toàn bộ hoặc một phần trường
- Hỗ trợ: job_title, job_desc, apply_link, scheduled_time, status
- Chỉ cập nhật các trường được gửi trong request body
```

**DELETE /api/schedules/:id**

```typescript
- Xóa schedule (đã có, không thay đổi)
```

### 3. **API Proxy Routes (Next.js)**

#### Route `/api/schedules/[id]` (GET)

- **File:** `fe/admin-ats/app/api/schedules/[id]/route.ts`
- ✅ Thêm endpoint GET để lấy chi tiết schedule
- Proxy request tới backend: `GET {BACKEND_URL}/api/schedules/:id`

---

## 📊 Luồng Tạo & Quản Lý Lịch Tuyển

### 1. **Tạo Lịch Tuyển**

```
[Admin Web] → Form tạo → POST /api/schedules
           → Backend: Supabase INSERT → Supabase `scheduled_jobs` table
           → n8n: Trigger (mỗi phút) → Check schedule với status="todo" & scheduled_time <= now
           → n8n: Gemini tạo nội dung Facebook → POST Facebook API
           → n8n: Cập nhật status = "done" + posted_time
```

### 2. **Sửa Lịch Tuyển** (Chưa đăng)

```
[Admin Web] → Chọn lịch → PUT /api/schedules/:id
           → Backend: Supabase UPDATE → Cập nhật Supabase
           → n8n: Trigger tiếp tục check lịch mới
```

### 3. **Xóa Lịch Tuyển** (Chưa đăng)

```
[Admin Web] → Chọn xóa → DELETE /api/schedules/:id
           → Backend: Supabase DELETE → Xóa khỏi Supabase
```

### 4. **Tự Động Đăng (n8n Workflow "My workflow 6")**

```
n8n Schedule Trigger (mỗi phút)
   ↓
Query Supabase: status="todo" AND scheduled_time <= now
   ↓
Gemini: Tạo Facebook post content
   ↓
HTTP Request: POST Facebook Feed API
   ↓
Supabase: UPDATE status="done", posted_time=now
   ↓
(Có thể extend: Email notification, Slack alert)
```

---

## 🔧 Thay Đổi Chi Tiết

### Frontend Changes

| File                          | Thay Đổi                                              |
| ----------------------------- | ----------------------------------------------------- |
| `schedules/page.tsx`          | Cập nhật interface, thêm delete, sửa lại column names |
| `schedules/new/page.tsx`      | Thêm `status: "todo"` vào payload                     |
| `schedules/[id]/page.tsx`     | **TẠO MỚI** - Form sửa lịch tuyển                     |
| `api/schedules/[id]/route.ts` | Thêm GET endpoint để proxy backend                    |

### Backend Changes

| File                        | Thay Đổi                                 |
| --------------------------- | ---------------------------------------- |
| `routes/schedule.routes.ts` | ✅ Thêm GET /:id (lấy chi tiết)          |
|                             | ✅ Update PUT /:id hỗ trợ toàn bộ trường |
|                             | ✅ DELETE /:id (giữ nguyên)              |

---

## 🚀 Cách Chạy

### 1. Khởi Động Backend

```bash
cd backend
npm install
npm run dev        # chạy server.ts
```

### 2. Khởi Động Frontend

```bash
cd fe/admin-ats
npm install
npm run dev
# Truy cập: http://localhost:3000/admin/schedules
```

### 3. Bật n8n Workflow

- Vào n8n UI
- Bật workflow "My workflow 6" (Schedule trigger mỗi phút)
- Nó sẽ tự động đăng bài vào Facebook khi thời gian đến

---

## 📋 API Endpoints

### Backend Routes

```
GET    /api/schedules          - Danh sách tất cả lịch
POST   /api/schedules          - Tạo lịch mới
GET    /api/schedules/:id      - Lấy chi tiết 1 lịch (NEW)
PUT    /api/schedules/:id      - Cập nhật lịch (UPDATED)
DELETE /api/schedules/:id      - Xóa lịch
```

### Frontend Proxy Routes (Next.js)

```
GET    /api/schedules          → Backend GET /api/schedules
POST   /api/schedules          → Backend POST /api/schedules
GET    /api/schedules/:id      → Backend GET /api/schedules/:id (NEW)
PUT    /api/schedules/:id      → Backend PUT /api/schedules/:id
DELETE /api/schedules/:id      → Backend DELETE /api/schedules/:id
```

---

## 🔒 Bảo Mật & Chuẩn Bị Cho Production

### Hiện Tại (Development)

- ✅ API không yêu cầu auth (mở công khai)
- ✅ n8n webhooks không bảo vệ (mở công khai)
- ⚠️ Facebook token hardcode trong n8n

### Cần Thêm (Production)

1. **API Authentication**
   - Thêm Bearer token hoặc API Key header
   - Middleware kiểm tra token trước khi xử lý
2. **Rate Limiting**
   - Bảo vệ chống spam/abuse
   - Middleware express-rate-limit
3. **n8n Webhook Auth**
   - Thêm webhook secret/token validation
   - Xác thực request từ client trước khi xử lý
4. **Secrets Management**

   - Facebook token: lưu trong .env, không hardcode
   - Gemini API key: từ environment variables
   - Supabase keys: service role từ secrets

5. **Error Handling**
   - Thêm error workflow trong n8n (catch failed executions)
   - Log failed schedules để debug
   - Notify admin khi có lỗi (Slack/Email)

---

## ✨ Tiếp Theo (Optional)

- [ ] Thêm filter/search lịch tuyển
- [ ] Bulk action (xóa nhiều cùng lúc)
- [ ] Export schedule list to CSV
- [ ] Schedule preview: xem nội dung Facebook trước khi đăng
- [ ] Lịch sử đăng: show posted_time, cảnh báo lỗi
- [ ] Email notification: gửi email khi lịch được đăng
- [ ] Slack integration: thông báo tới Slack channel

---

## 📝 Ghi Chú

- Timezone: Mọi datetime được xử lý theo UTC+7 (Vietnam)
- Supabase table: `scheduled_jobs` (job_title, job_desc, apply_link, scheduled_time, status, posted_time, created_at)
- n8n trigger: Mỗi phút kiểm tra 1 lần, có thể điều chỉnh interval
- Facebook posting: Cần valid access token và page ID trong n8n
