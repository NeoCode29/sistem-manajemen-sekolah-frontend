# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set API URL kosong agar browser memakai relative URL (/api/v1) yang di-proxy oleh Nginx
ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 2: Nginx server stage
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
