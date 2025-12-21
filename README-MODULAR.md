# TechVision Landing Page - Modular Structure

## 📁 Cấu trúc thư mục mới

```
tech-company-landing/
├── index.html              # File gốc (giữ nguyên để backup)
├── index-modular.html      # File index mới với cấu trúc modular
├── style.css               # CSS chính
├── script.js               # JavaScript chính
│
├── sections/               # Các section HTML riêng biệt
│   ├── navbar.html         # Navigation bar
│   ├── hero.html           # Hero section
│   ├── about.html          # About section
│   ├── culture.html        # Culture section
│   ├── jobs.html           # Jobs section (dynamic loading)
│   ├── apply.html          # Application form
│   ├── footer.html         # Footer
│   └── widgets.html        # Chatbot & scroll-to-top
│
├── data/                   # Data files
│   └── jobs.js             # Job listings data
│
└── js/                     # JavaScript modules
    └── jobs-loader.js      # Dynamic job loading script
```

## 🎯 Lợi ích của cấu trúc mới

### ✅ **Dễ quản lý**
- Mỗi section trong file riêng, dễ tìm và chỉnh sửa
- Không phải scroll qua 600+ dòng code

### ✅ **Dễ bảo trì**
- Sửa navbar? Chỉ cần mở `sections/navbar.html`
- Thêm job mới? Chỉ cần edit `data/jobs.js`

### ✅ **Tái sử dụng**
- Có thể dùng lại sections cho trang khác
- Footer, navbar có thể share giữa nhiều trang

### ✅ **Làm việc nhóm tốt hơn**
- Nhiều người có thể làm việc trên các section khác nhau
- Ít conflict khi merge code

### ✅ **Dynamic Content**
- Jobs được load từ data file
- Dễ dàng thêm/sửa/xóa jobs mà không cần edit HTML

## 🚀 Cách sử dụng

### Để sử dụng phiên bản modular:
1. Mở `index-modular.html` thay vì `index.html`
2. Hoặc đổi tên `index-modular.html` thành `index.html`

### Để chỉnh sửa nội dung:
- **Navigation**: Edit `sections/navbar.html`
- **Hero**: Edit `sections/hero.html`
- **About**: Edit `sections/about.html`
- **Culture**: Edit `sections/culture.html`
- **Jobs**: Edit `data/jobs.js` (thêm/sửa job listings)
- **Form**: Edit `sections/apply.html`
- **Footer**: Edit `sections/footer.html`

### Để thêm job mới:
Mở `data/jobs.js` và thêm object mới vào array:
```javascript
{
  id: 7,
  title: "Tên vị trí",
  category: "engineering", // hoặc design, product, marketing
  type: "Full-time",
  location: "Địa điểm",
  salary: "Mức lương",
  description: "Mô tả công việc",
  tags: ["Tag1", "Tag2", "Tag3"]
}
```

## 📝 Ghi chú

- File `index.html` gốc vẫn được giữ nguyên để backup
- Tất cả CSS và JavaScript vẫn hoạt động bình thường
- Các hiệu ứng animation, gradient, neon vẫn giữ nguyên
- Màu xanh dương (blue theme) đã được áp dụng
