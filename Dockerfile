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