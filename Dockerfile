# Frontend Dockerfile (Railway 部署用，位于仓库根目录)
# 构建上下文 = 仓库根目录，可同时访问 frontend/ 和 data/

# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend
COPY data ./data

RUN cd frontend && npm run build

# 运行阶段：nginx 托管静态文件 + 代理 /api 到 FastGPT
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
# 安装 gettext 提供 envsubst
RUN apk add --no-cache gettext
EXPOSE 80
# 设置默认值后用 envsubst 渲染 nginx 配置
# 本地: PORT=80, FASTGPT_UPSTREAM=http://fastgpt:3000
# Railway: PORT 由平台注入, FASTGPT_UPSTREAM 设为 FastGPT 服务地址
CMD ["/bin/sh", "-c", "export PORT=${PORT:-80}; export FASTGPT_UPSTREAM=${FASTGPT_UPSTREAM:-http://fastgpt:3000}; envsubst '$$PORT $$FASTGPT_UPSTREAM' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]