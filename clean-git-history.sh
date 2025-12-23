# ============================================
# SCRIPT DỌN DẸP GIT - CHẠY TỪNG LỆNH
# ============================================

# 1. Commit changes hiện tại
git add .gitignore .env.example
git commit -m "security: Add .gitignore and remove sensitive files"

# 2. Xóa files nhạy cảm khỏi tất cả history (NGUY HIỂM!)
# CHỈ CHẠY nếu:
# - Bạn chưa push lên remote, HOẶC
# - Repo là private và chỉ bạn sử dụng

# Xóa khỏi history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.docker test-supabase.js 'Ai-recruitment-agent (1).json' wf/*.json" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (CHỈ nếu đã push lên remote)
# CẢNH BÁO: Lệnh này XÓA history trên remote!
# git push origin --force --all

# ============================================
# GIẢI PHÁP AN TOÀN HƠN (Khuyến nghị)
# ============================================

# Nếu repo đã public với keys:
# 1. Rotate TẤT CẢ keys (như hướng dẫn trên)
# 2. Làm repo PRIVATE trên GitHub
# 3. Hoặc XÓA repo cũ, tạo repo mới clean

# Kiểm tra sau khi clean:
git log --all --pretty=format: --name-only --diff-filter=A | sort -u | grep -E '\.env|test-supabase'
