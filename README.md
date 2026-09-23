# MICE 会展专业知识库

> 35 讲会展专业课程纪要的结构化知识库，支持全文检索、术语速查、AI 智能问答（RAG）。

## ✨ 功能特性

- **结构化课程浏览**：12 大模块 / 35 讲课程 / 31 位讲师，层级化导航
- **全文检索**：按关键词、术语、讲师快速定位课程内容
- **术语速查**：会展专业术语词典，一键查看定义与出处
- **AI 智能问答**：基于 35 讲课程内容的 RAG 问答，流式回答 + 来源引用
  - 混合检索：向量语义检索（bge-m3）+ 关键词检索（BM25）+ RRF 重排
  - 大模型生成：DeepSeek API 流式输出
  - 来源卡片：点击直接跳转到对应课程章节

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + CSS |
| 后端 | FastAPI + Python 3.11 |
| 向量模型 | BAAI/bge-m3（本地，1024 维，中文 SOTA） |
| 向量检索 | FAISS |
| 关键词检索 | BM25（rank-bm25） |
| 大模型 | DeepSeek Chat API（流式 SSE） |
| 部署 | Docker Compose（前端 nginx + 后端 uvicorn） |

## 📁 目录结构

```
MICE-KB/
├── data/                      # 共享课程数据（35 讲结构化 JSON）
│   └── kb-data.json
├── frontend/                  # 前端 React 应用
│   ├── src/
│   │   ├── components/
│   │   │   └── AIChat.tsx     # AI 问答抽屉组件
│   │   ├── ai-chat.css        # AI 问答样式
│   │   ├── App.tsx            # 主应用（集成 AI 入口）
│   │   └── ...
│   ├── vite.config.ts         # Vite 配置（/api 代理到后端）
│   ├── Dockerfile             # 多阶段构建：node build → nginx
│   └── nginx.conf             # nginx 静态托管 + /api 反向代理
├── backend/                   # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # FastAPI 入口
│   │   ├── api/rag.py         # RAG 接口（/search, /stream）
│   │   ├── core/              # 配置 / 向量模型 / FAISS / BM25
│   │   ├── services/          # RAG 检索服务 + LLM 生成服务
│   │   └── ingestion/         # 分块 + 建库脚本
│   ├── index/                 # 向量索引 + BM25 分词语料（自动生成）
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example           # 后端环境变量模板
├── docker-compose.yml         # 一键启动前后端
├── .env.example               # 根环境变量模板
└── README.md
```

## 🚀 快速开始（Docker，推荐）

### 1. 配置 API Key

复制环境变量模板并填入你的 DeepSeek API Key：

```bash
cp .env.example .env
# 编辑 .env，填入：
# DEEPSEEK_API_KEY=sk-your-key-here
```

> 💡 如果不填 API Key，AI 问答会自动降级为「检索结果摘要」模式，仍可查看相关课程片段。

### 2. 一键启动

```bash
docker-compose up -d --build
```

> ⚠️ 首次构建会下载 bge-m3 模型（约 2.2GB）并构建向量索引，耗时较长（10-20 分钟），请耐心等待。

### 3. 访问应用

- 知识库前端：http://localhost:8080
- 后端健康检查：http://localhost:8000/health
- 后端检索 API：http://localhost:8000/api/rag/search?q=跨国活动管理

### 4. 停止服务

```bash
docker-compose down
```

## 💻 本地开发模式

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env              # 填入 DEEPSEEK_API_KEY

# 构建向量索引（首次运行，会下载 bge-m3 模型）
python -m app.ingestion.build_index

# 启动后端
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev                       # 启动开发服务器 http://localhost:5173
```

Vite 已配置 `/api` 代理到 `http://127.0.0.1:8000`，前后端联调无需额外配置。

## 🔧 配置说明

### 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DEEPSEEK_API_KEY` | 否 | - | DeepSeek API 密钥，不填则降级为检索模式 |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com/v1` | API 网关地址 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | 模型名称 |
| `VECTOR_TOP_K` | 否 | `20` | 向量检索召回数量 |
| `BM25_TOP_K` | 否 | `20` | BM25 检索召回数量 |
| `FINAL_TOP_K` | 否 | `5` | 重排后返回的最终结果数 |
| `RRF_K` | 否 | `60` | RRF 融合参数 |

## 📡 API 文档

### `GET /health`
健康检查。

### `POST /api/rag/search`
混合检索课程片段。

**请求体：**
```json
{"query": "跨国活动管理", "top_k": 5}
```

**响应示例：**
```json
{
  "query": "跨国活动管理",
  "results": [
    {
      "course_id": "03",
      "course_title": "跨国公司活动管理 四大底层逻辑",
      "module": "模块二",
      "section_title": "二、核心内容梳理",
      "score": 0.85,
      "text": "..."
    }
  ]
}
```

### `POST /api/rag/stream`
流式问答（SSE）。

**请求体：**
```json
{
  "query": "跨国活动管理的核心逻辑是什么？",
  "history": [{"role": "user", "content": "..."}]
}
```

**SSE 事件流：**
```
data: {"type":"sources","sources":[{"course_id":"03","course_title":"...","section_title":"..."}]}

data: {"type":"content","text":"跨国活动管理的核心逻辑包括..."}

data: [DONE]
```

## 🧠 RAG 架构

```
用户问题
   │
   ▼
┌─────────────────────────────────────┐
│         混合检索 (Hybrid Search)      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ 向量检索 FAISS │  │  BM25 关键词  │ │
│  │  (bge-m3)    │  │   检索        │ │
│  └──────┬───────┘  └──────┬───────┘ │
│         └────────┬────────┘         │
│                  ▼                  │
│          RRF 融合重排 (k=60)         │
└──────────────────┬──────────────────┘
                   ▼
         Top-5 相关课程片段
                   │
                   ▼
┌─────────────────────────────────────┐
│       LLM 生成 (DeepSeek Chat)       │
│  系统提示词 + 上下文 + 历史 → 回答    │
│         (SSE 流式输出)               │
└─────────────────────────────────────┘
```

## ❓ 常见问题

**Q: 首次启动很慢？**
A: 首次会下载 bge-m3 模型（2.2GB）并构建索引，后续启动秒级。

**Q: AI 回答显示「未配置 API Key」？**
A: 在 `.env` 中填入 `DEEPSEEK_API_KEY` 后重启服务即可。不填也能用，仅显示检索到的课程片段摘要。

**Q: 如何更新课程数据？**
A: 替换 `data/kb-data.json` 后重新运行 `python -m app.ingestion.build_index` 重建索引。

**Q: 前端页面访问不到后端？**
A: 确认后端运行在 8000 端口。Docker 模式下 nginx 自动代理 `/api`；本地开发模式下 Vite 代理已配置。

## 📝 许可证

项目内部使用，仅限学院教学。
