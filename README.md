# RySocial Frontend 🚀

Giao diện mạng xã hội RySocial (React 19 + TypeScript + Tailwind CSS + Vite).

---

## ⚡ Bắt đầu nhanh (Quick Start)

### Cách 1: Chạy bằng Docker (Khuyên dùng)
```bash
docker compose up -d
```
Ứng dụng sẽ chạy tại: **http://localhost:5173**

---

### Cách 2: Chạy trực tiếp trên máy (Local)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Sao chép file cấu hình mẫu:
   ```bash
   cp .env.example .env
   ```

3. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt: **http://localhost:5173**

---

## 📌 Các đường dẫn chính

- **Đăng nhập:** `http://localhost:5173/signin`
- **Đăng ký:** `http://localhost:5173/signup`
- **Bảng tin (Home Feed):** `http://localhost:5173/feed`
- **Trang cá nhân:** `http://localhost:5173/profile`

---

## 🛠️ Các lệnh hữu ích

```bash
npm run dev      # Chạy môi trường dev (HMR)
npm run lint     # Kiểm tra lỗi cú pháp code
npm run build    # Đóng gói sản phẩm (Production build)
```

