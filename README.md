Dưới đây là bản README tổng thể cho dự án **AI Recruitment Agent** – được thiết kế để hướng dẫn nhóm bạn và người dùng khác hiểu rõ kiến trúc, cách triển khai, và cách sử dụng hệ thống.

---

# 🤖 AI Recruitment Agent

Tự động hóa quy trình tuyển dụng từ đăng tin, phân tích CV bằng AI, gửi email phản hồi, đến lên lịch phỏng vấn và onboarding.

---

## 📦 Cấu trúc dự án

```
ai-recruitment-agent/
├── backend/           # API xử lý dữ liệu ứng viên, lưu MongoDB, gọi AI
├── frontend/          # Giao diện form ứng tuyển (React/Next.js)
├── automation/        # Workflow n8n + tích hợp AI, email, Sheets
├── docs/              # Tài liệu kỹ thuật, kiến trúc, API, user flow
└── README.md          # Tổng quan dự án
```

---

## 🎯 Mục tiêu chính

- ✅ Đăng tin tuyển dụng tự động
- 📥 Nhận và phân tích CV bằng AI
- 🧠 Trích xuất kỹ năng, kinh nghiệm, vị trí từ CV
- 📊 Phân loại ứng viên theo level và role
- 📧 Gửi email xác nhận, cảnh báo, offer
- 📅 Lên lịch phỏng vấn qua Google Calendar
- 📝 Ghi dữ liệu vào Google Sheets hoặc MongoDB
- 🚀 Onboarding tự động sau khi nhận offer

---

## 👥 Thành viên & phân công

| Thành viên | Vai trò | Nhánh Git |
|------------|--------|------------|
| Nguyễn A   | Backend Developer | `feature/backend-api` |
| Nguyễn B   | Frontend Developer | `feature/frontend-form` |
| Nguyễn C   | Automation & AI Integration | `feature/n8n-workflow` |

---

## 🧱 Công nghệ sử dụng

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React hoặc Next.js
- **AI**: OpenAI GPT-4 API
- **Automation**: n8n workflow
- **Email**: Gmail API / Nodemailer
- **Calendar**: Google Calendar API
- **Storage**: MongoDB / Google Sheets

---

## 🚀 Hướng dẫn chạy dự án

### 1. Clone repo
```bash
git clone https://github.com/your-org/ai-recruitment-agent.git
cd ai-recruitment-agent
```

### 2. Cài đặt backend
```bash
cd backend
npm install
cp .env.example .env   # điền thông tin API, MongoDB, Gmail
npm run dev
```

### 3. Cài đặt frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Import workflow vào n8n
- Mở n8n
- Import file `automation/workflows/ai-recruitment-workflow.json`
- Cấu hình Gmail, Google Sheets, Webhook

---

## 📌 Tài liệu tham khảo

- `docs/architecture.md`: Kiến trúc hệ thống
- `docs/api-spec.md`: Đặc tả API backend
- `docs/user-flow.md`: Luồng người dùng từ ứng tuyển đến onboarding

---

## 🧪 Kiểm thử

- Gửi đơn ứng tuyển qua frontend
- Kiểm tra dữ liệu lưu vào MongoDB
- Kiểm tra email gửi đi
- Kiểm tra phân tích AI
- Kiểm tra ghi vào Google Sheets
- Kiểm tra lịch phỏng vấn tạo đúng

---

## 📬 Liên hệ nhóm phát triển

- Nguyễn A – Backend: nguyena@example.com
- Nguyễn B – Frontend: nguyenb@example.com
- Nguyễn C – Automation: nguyenc@example.com

