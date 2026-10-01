# RySocial Frontend

Giao diện Single Page Application (SPA) cho mạng xã hội RySocial, xây dựng trên nền tảng React 19, TypeScript, Tailwind CSS và Vite.

---

## Cấu trúc thư mục

```text
social-platform-frontend/
├── src/
│   ├── components/          # UI components tái sử dụng
│   ├── pages/               # Trang giao diện chính (Feed, Profile, Auth, Chat...)
│   ├── services/            # API client (Axios, Media upload, WebSocket)
│   ├── hooks/               # Custom React hooks
│   └── context/             # Global state contexts (Auth, Theme, Socket)
├── public/                  # Tài nguyên tĩnh
├── Caddyfile                # Cấu hình Caddy Reverse Proxy & SSL tự động
├── Dockerfile               # Build React SPA production trên Nginx
├── Dockerfile.caddy         # Build Caddy kèm module log định dạng chuẩn
├── Dockerfile.dev           # Dockerfile phục vụ môi trường phát triển (Vite HMR)
├── docker-compose.yml       # Compose cho môi trường Development
├── docker-compose.prod.yml  # Compose cho môi trường Production (Nginx + Caddy)
├── nginx.conf               # Cấu hình Nginx phục vụ SPA tĩnh và Real IP
└── README.md
```

---

## Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

| Biến môi trường | Ý nghĩa | Mặc định |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL gọi API Backend | Rỗng (sử dụng cùng domain với Frontend) |
| `VITE_MINIO_URL` | Đường dẫn kho ảnh / media | `/social-media/` |
| `VITE_WS_URL` | Đường dẫn kết nối WebSocket | `wss://rysocial.app/ws` |
| `VITE_GIPHY_API_KEY` | API Key tích hợp tìm kiếm GIF | |

---

## Hướng dẫn triển khai

### 1. Môi trường Production (Nginx + Caddy Gateway)

Trong môi trường Production, Frontend được đóng gói thành các file tĩnh phục vụ bởi Nginx, và Caddy đóng vai trò Reverse Proxy cổng 80/443 kết nối với mạng Docker chung `social-network`.

```bash
# 1. Đảm bảo mạng Docker chung đã tồn tại
docker network create social-network 2>/dev/null || true

# 2. Build và khởi động Frontend & Caddy
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Môi trường Development

#### Cách A: Chạy bằng Docker
```bash
docker compose up -d
```
Ứng dụng chạy tại: `http://localhost:5173` (Hỗ trợ Hot Module Replacement).

#### Cách B: Chạy trực tiếp bằng Node.js / NPM
```bash
# Cài đặt dependencies
npm install

# Khởi chạy Vite dev server
npm run dev
```

---

## Lệnh quản lý & Giám sát

```bash
# Xem log truy cập cổng vào (Caddy Reverse Proxy)
docker compose -f docker-compose.prod.yml logs -f caddy

# Xem log phục vụ file tĩnh của Nginx Frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Kiểm tra cú pháp và build kiểm thử
npm run lint
npm run build
```
