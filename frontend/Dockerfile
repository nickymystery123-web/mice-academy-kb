# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
COPY data ../data
RUN npm run build

# 运行阶段：nginx 托管静态文件 + 代理 /api 到 FastGPT
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
# 安装 gettext 提供 envsubst
RUN apk add --no-cache gettext
EXPOSE 80
# 设置默认值后用 envsubst 渲染 nginx 配置
# 本地 Docker: PORT=80, FASTGPT_UPSTREAM=http://fastgpt:3000
# Railway:     PORT 由平台注入, FASTGPT_UPSTREAM 设为 FastGPT 服务地址
CMD ["/bin/sh", "-c", "export PORT=${PORT:-80}; export FASTGPT_UPSTREAM=${FASTGPT_UPSTREAM:-http://fastgpt:3000}; envsubst '$$PORT $$FASTGPT_UPSTREAM' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]