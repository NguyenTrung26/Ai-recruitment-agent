# 1. Xuất workflow từ n8n (Export → JSON) và lưu vào automation/workflows/
#    Ví dụ: automation/workflows/ai-recruitment-workflow.json

# 2. Di chuyển vào thư mục dự án
cd /c/code/Ai-recruitment-agent

# 3. Đảm bảo đang ở nhánh feature/n8n-workflow
git checkout feature/n8n-workflow

# 4. Thêm file workflow mới
git add automation/workflows/*.json

# 5. Commit với thông điệp ngày tháng
git commit -m "Cập nhật workflow n8n ngày $(date +'%d/%m/%Y')"

# 6. Push lên GitHub
git push origin feature/n8n-workflow
