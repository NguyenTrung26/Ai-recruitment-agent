# ============================================
# HƯỚNG DẪN CẬP NHẬT N8N WORKFLOWS
# ============================================

## Vấn đề:
Các file workflow JSON chứa hardcoded credentials:
- wf/Advanced-Recruitment-Workflow.json
- wf/Ai-recruitment-agent.json
- Ai-recruitment-agent (1).json

## Giải pháp:

### Option 1: Sử dụng N8N Credentials (Khuyến nghị)
1. Mở n8n: http://localhost:5678
2. Vào "Credentials" → Create new
3. Tạo credentials cho:
   - Supabase (HTTP Request với Bearer token)
   - Custom API (cho backend)
4. Trong workflow, chọn credentials thay vì hardcode

### Option 2: Environment Variables
1. Export workflow từ n8n UI (không bao gồm credentials)
2. Lưu vào wf/ folder
3. Import lại và link credentials

### Action Items:
1. XÓA các file workflow JSON local:
   rm wf/*.json
   rm "Ai-recruitment-agent (1).json"

2. Re-export từ n8n UI sau khi:
   - Đã rotate keys mới
   - Đã setup credentials trong n8n
   - Export WITHOUT credentials

3. Thêm vào .gitignore:
   # N8N workflows with credentials
   wf/*.json
   !wf/README.md

4. Tạo wf/README.md với hướng dẫn import
