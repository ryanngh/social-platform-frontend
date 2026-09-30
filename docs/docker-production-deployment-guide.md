# Hướng Dẫn Chi Tiết: Đóng Gói & Chạy Docker Dạng Production Để Deploy Thực Tế (Real Deployment)

Tài liệu này hướng dẫn đầy đủ kiến trúc, cách cấu hình và quy trình triển khai ứng dụng Frontend (React + Vite + TypeScript) bằng Docker ở chế độ **Production** trên môi trường thực tế (VPS, Server, Cloud).

---

## 1. Sự Khác Biệt Cốt Lõi: Docker Development vs Docker Production

| Tiêu chí | Môi trường Development (Hiện tại) | Môi trường Production (Thực tế) |
| :--- | :--- | :--- |
| **Lệnh thực thi** | `npm run dev` (Vite dev server) | `nginx -g 'daemon off;'` (hoặc Caddy) phục vụ static files |
| **Môi trường chạy** | Cần Node.js runtime đầy đủ | Chỉ cần Web Server tĩnh siêu nhẹ (Nginx Alpine) |
| **Kích thước Image** | ~800MB - 1.2GB (chứa toàn bộ `node_modules`, devDependencies) | **~25MB - 40MB** |
| **Mount volume** | Mount code từ máy host (`.:/app`) để hỗ trợ Hot Reload (HMR) | **Không mount code**. Code đã được đóng gói bất biến (Immutable Image) |
| **Bảo mật** | Lộ toàn bộ source code gốc, devDependencies bên trong container | An toàn tối đa, chỉ chứa file HTML/JS/CSS đã được minify & mã hóa |
| **Hiệu năng & RAM** | Chiếm 200MB - 500MB RAM do Vite và watcher | Chỉ tốn **5MB - 15MB RAM**, chịu tải hàng nghìn kết nối đồng thời |

---

## 2. Kiến Trúc "Multi-Stage Build" (Chuẩn Quốc Tế Cho Production)

Để tạo ra một Docker image vừa nhẹ vừa tối ưu cho Production, chúng ta sử dụng kỹ thuật **Multi-stage Build** gồm 2 giai đoạn:

```
┌─────────────────────────────────────────────────────────┐
│ Giai đoạn 1: Builder Stage (Node:alpine)                │
│  - Cài đặt thư viện: `npm ci`                           │
│  - Chạy `npm run build` để sinh ra thư mục `dist/`      │
└────────────────────────────┬────────────────────────────┘
                             │ (Chỉ mang thư mục `dist/` sang)
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Giai đoạn 2: Runner Stage (Nginx:alpine)                │
│  - Không cần cài Node.js, không cần `node_modules`      │
│  - Chứa Nginx và file tĩnh trong `dist/`                 │
│  - Dung lượng siêu nhẹ (~25MB), sẵn sàng phục vụ web     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Các File Cần Thiết Cho Production

Khi chuẩn bị cho production, cấu trúc thư mục thường được bổ sung các file sau (không can thiệp vào mã nguồn logic của app):

```
social-platform-frontend/
├── Dockerfile              # Dockerfile chính cho Production (Multi-stage)
├── Dockerfile.dev          # Giữ lại để code ở máy local
├── nginx.conf              # File cấu hình Nginx dành riêng cho SPA (Single Page App)
├── docker-compose.prod.yml # File chạy production trên VPS
└── ...
```

---

## 4. Chi Tiết Các Cấu Hình Mẫu

### 4.1. File `nginx.conf` (Tối ưu cho React Router SPA)
Khác với website tĩnh thông thường, ứng dụng React Router sử dụng cơ chế client-side routing (`/:username`, `/feed`, `/posts/:id`). Nếu không cấu hình `try_files`, khi người dùng truy cập trực tiếp link hoặc nhấn F5 tải lại trang, Nginx sẽ báo lỗi **404 Not Found**.

*Nội dung mẫu của file `nginx.conf`:*

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Bật nén Gzip tăng tốc độ tải trang
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-dpr no-transform;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # Xử lý Single Page Application (SPA): Mọi đường dẫn không tìm thấy file tĩnh đều chuyển về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache vĩnh viễn (1 năm) cho các file asset có hash (JS, CSS, ảnh build)
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|woff2|woff)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Không cache index.html để khi deploy phiên bản mới, người dùng nhận được code mới ngay lập tức
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Bảo mật cơ bản
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

### 4.2. File `Dockerfile` (Production Multi-Stage)

*Nội dung mẫu của file `Dockerfile`:*

```dockerfile
# ==========================================
# STAGE 1: Build ứng dụng với Node.js
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Khai báo các biến môi trường khi build (Vite nhúng biến tại thời điểm build)
ARG VITE_BACKEND_URL
ARG VITE_MINIO_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_MINIO_URL=$VITE_MINIO_URL

# Copy file định nghĩa package để tận dụng Docker layer cache
COPY package*.json ./

# Cài đặt dependency sạch và chính xác theo package-lock.json
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Biên dịch ra thư mục dist
RUN npm run build

# ==========================================
# STAGE 2: Chạy ứng dụng tĩnh bằng Nginx
# ==========================================
FROM nginx:1.27-alpine

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy file cấu hình Nginx tối ưu cho SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy thư mục dist từ builder stage vào thư mục phục vụ web của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

### 4.3. File `docker-compose.prod.yml` (Cho VPS / Server)

*Nội dung mẫu của `docker-compose.prod.yml`:*

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_BACKEND_URL=https://api.yourdomain.com
        - VITE_MINIO_URL=https://storage.yourdomain.com/social-media/
    container_name: social-platform-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
    # Không dùng volume mount code trong production
    environment:
      - NODE_ENV=production
```

---

## 5. Lưu Ý "Sống Còn" Về Biến Môi Trường Trong Vite

Trong các ứng dụng React xây dựng bằng Vite, các biến `VITE_*` (ví dụ `VITE_BACKEND_URL`) là **Build-time Variables**, **KHÔNG PHẢI Runtime Variables**.

* **Điều này có nghĩa là**: Khi câu lệnh `npm run build` được thực thi, Vite sẽ tìm và thay thế chuỗi `import.meta.env.VITE_BACKEND_URL` thành URL thực tế (ví dụ: `https://api.yourdomain.com`) thẳng vào trong các file JavaScript đã biên dịch.
* **Sai lầm phổ biến**: Đặt `environment:` trong `docker-compose.yml` lúc container đang chạy sẽ **không có tác dụng** đối với file tĩnh đã build.
* **Giải pháp chuẩn**: Truyền biến thông qua `build.args` trong `docker-compose.prod.yml` hoặc flag `--build-arg` khi chạy `docker build`.

---

## 6. Quy Trình Triển Khai Thực Tế (Step-by-Step Deployment Guide)

### Cách A: Build và chạy trực tiếp trên Server/VPS

1. **Clone repository lên máy chủ**:
   ```bash
   git clone <repo-url>
   cd social-platform-frontend
   ```
2. **Khởi chạy container production**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. **Kiểm tra trạng thái**:
   ```bash
   docker ps
   docker logs social-platform-frontend-prod
   ```

---

### Cách B: Chuẩn DevOps (Build Image trước -> Đẩy lên Registry -> Server chỉ việc kéo về chạy)

Đây là quy trình mà các công ty lớn áp dụng, giúp server không phải gánh tải nặng lúc build code:

1. **Build image trên máy local hoặc CI/CD pipeline (GitHub Actions)**:
   ```bash
   docker build \
     --build-arg VITE_BACKEND_URL="https://api.yourdomain.com" \
     --build-arg VITE_MINIO_URL="https://storage.yourdomain.com/social-media/" \
     -t username/social-frontend:v1.0.0 .
   ```
2. **Đẩy image lên Docker Hub / GitHub Container Registry (GHCR)**:
   ```bash
   docker push username/social-frontend:v1.0.0
   ```
3. **Trên VPS, chỉ cần kéo image về và chạy**:
   ```bash
   docker run -d \
     --name social-frontend \
     -p 80:80 \
     --restart unless-stopped \
     username/social-frontend:v1.0.0
   ```

---

## 7. Cấu Hình HTTPS / SSL (Let's Encrypt) Cho Tên Miền Thực Tế

Trong môi trường thực tế, trình duyệt bắt buộc ứng dụng phải chạy qua HTTPS để đảm bảo bảo mật cho cookies, token và tính năng camera/micro:

* **Phương án khuyên dùng**: Đặt một **Reverse Proxy** (như Nginx Proxy Manager, Caddy, Traefik, hoặc Cloudflare) đứng trước container frontend:
  * Proxy sẽ nhận kết nối HTTPS (cổng 443) từ người dùng.
  * Tự động gia hạn chứng chỉ SSL miễn phí từ Let's Encrypt.
  * Chuyển tiếp (forward) lưu lượng nội bộ về cổng 80 của container frontend.

---

## 8. Checklist Kiểm Tra Trước Khi Go-Live (Production Readiness Checklist)

- [ ] Image được build qua Multi-stage build (dung lượng < 50MB, không chứa mã nguồn dev).
- [ ] File `nginx.conf` đã có cấu hình `try_files $uri $uri/ /index.html;` để tránh lỗi 404 khi F5.
- [ ] Các biến môi trường `VITE_BACKEND_URL` trỏ về đúng domain API thực tế (không dùng `localhost` hay `host.docker.internal`).
- [ ] Container có thiết lập chính sách khởi động lại tự động: `restart: unless-stopped`.
- [ ] Đã cấu hình nén Gzip hoặc Brotli trên web server.
- [ ] Đã gắn tên miền (Domain) và kích hoạt chứng chỉ SSL (HTTPS).
