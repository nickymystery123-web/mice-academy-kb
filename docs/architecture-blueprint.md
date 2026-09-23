# MICE Academy Intelligence Platform
# Target Architecture & Implementation Blueprint

> 基于对 D:\MICE-KB 的完整只读技术审计，将当前「课程知识库 + RAG 问答原型」升级为「MICE 学院课程智能知识平台」。

---

## 01. Executive Summary

本蓝图基于对 `D:\MICE-KB` 的完整只读技术审计，将当前「课程知识库 + RAG 问答原型」升级为「MICE 学院课程智能知识平台」。

**核心判断**：当前系统的 RAG 检索链路（bge-m3 + FAISS + BM25 + RRF）在 802 chunk 规模下技术选型合理，**无需推倒重来**。最大的架构缺口是：无数据库、无用户权限、无管理后台、引用精度不足。

**升级策略**：保留 RAG 核心与前端骨架，引入 PostgreSQL 存业务事实，抽象 VectorStore/LLM/Embedding/Reranker 接口，新增 RBAC + 知识治理 + AI Tutor 产品空间。

**关键决策**：
- FAISS 保留，VectorStore 抽象接口，未来可替换为 pgvector/Qdrant
- PostgreSQL 负责业务事实（用户/课程/对话/审核/版本），FAISS 负责向量检索，BM25 负责关键词检索，三者并存
- Citation 成为独立一等对象，从 chunk_id → document_version → lecture → module → course 全链可追溯
- 前端从「单页 useState 路由」演进为「App Shell + Router + Feature Modules」
- AI Tutor 从右侧抽屉升级为一级产品空间

---

## 02. Current State Summary

| 维度 | 现状 |
|------|------|
| 数据规模 | 35 课程 / 12 模块 / 31 讲师 / 27 术语 / 587,880 字 / 802 chunks / 1024 维 |
| 前端 | React 18.3 + TS 5.6 + Vite 5.4，原生 CSS，useState 路由，无 UI 框架，JSON 打进 bundle |
| 后端 | FastAPI 0.115 + Python 3.11，3 个端点（/health, /rag/search, /rag/stream） |
| RAG | bge-m3 → FAISS Top20 + BM25 Top20 → RRF(k=60) → Top5 → DeepSeek → SSE |
| LLM | DeepSeek Chat，httpx 直接调用，硬编码，无 Provider 抽象 |
| 数据 | JSON 文件（kb-data.json），无数据库 |
| Citation | 课程级 + section_title，无 chunk_id |
| 用户 | 无 |
| 权限 | 无 |
| 管理后台 | 无 |
| 测试 | 无 |
| 日志 | 仅 2 处 logger.info |
| 部署 | Docker Compose + nginx，可用 |
| 安全风险 | .env.example 含真实 API Key |

---

## 03. Target Product Definition

**MICE Academy Intelligence Platform** 是面向 MICE / 会展教育场景的一体化智能知识平台。

**不是**：课程网站 / 知识库 / ChatGPT 套壳 / RAG Demo / 课程展示站 / 后台管理系统

**是**：课程学习 + 知识管理 + AI Tutor + 教师工作台 + 学习分析 + 知识治理一体化平台

**核心产品价值**：
1. 课程知识结构化（Course → Module → Lecture → KnowledgePoint）
2. 知识精准检索（Vector + BM25 + Reranker + Citation）
3. AI 辅助学习（AI Tutor 一级产品空间，对话持久化，引用溯源）
4. 教师知识管理（上传/编辑/审核/发布/版本/回滚）
5. 知识审核与版本治理（DRAFT → REVIEWING → APPROVED → PUBLISHED → ARCHIVED）
6. 学习过程数据沉淀（进度/收藏/笔记/问答/反馈/分析）

**两条核心数据链**：
- 知识链：Course → Module → Lecture → KnowledgePoint → Resource → Document → Version → Chunk → Citation
- 学习链：User → LearningProgress → Query → Conversation → Message → Feedback → Analytics

---

## 04. Current → Target Gap Matrix

| # | Domain | Current State | Target State | Gap | Priority | Build/Reuse |
|---|--------|--------------|-------------|-----|----------|-------------|
| 1 | Product Architecture | 前端知识库 + AI 问答原型 | 学院级智能知识平台 | 缺角色体系、缺产品空间分层 | P0 | CUSTOM |
| 2 | Frontend Architecture | useState 路由，无 UI 框架 | App Shell + Router + Feature Modules | 缺路由、缺模块化、缺设计系统 | P1 | ADAPT |
| 3 | Backend Architecture | 单 router 3 端点 | 多 router 分域，分层架构 | 缺分层、缺多 router | P0 | ADAPT |
| 4 | Data Architecture | JSON 文件，无 DB | PostgreSQL + FAISS + BM25 | 缺数据库、缺持久化 | P0 | DEPEND |
| 5 | Knowledge Architecture | 扁平 JSON | Course→Module→Lecture→KP→Doc→Version→Chunk | 缺知识点层级 | P0 | CUSTOM |
| 6 | RAG Architecture | Vector+BM25+RRF→Top5 | +Reranker+MetadataFilter+Citation | 缺 Reranker、缺引用构建 | P1 | KEEP+ADAPT |
| 7 | AI Provider Architecture | DeepSeek 硬编码 | LLM/Embedding/Reranker 三接口 | 缺全部抽象 | P1 | CUSTOM |
| 8 | User Architecture | 无 | User + Profile + Session | 缺全部 | P0 | DEPEND |
| 9 | Permission Architecture | 无 | RBAC 5 角色 | 缺全部 | P0 | CUSTOM |
| 10 | Document Architecture | 无 | Upload→Parse→Extract→Chunk→Index | 缺上传、解析 | P1 | DEPEND |
| 11 | Knowledge Governance | 无 | DRAFT→REVIEWING→APPROVED→PUBLISHED→ARCHIVED | 缺全部 | P1 | CUSTOM |
| 12 | Versioning | 无 | DocumentVersion + 回滚 | 缺全部 | P2 | CUSTOM |
| 13 | Citation | 课程+section | chunk_id→全链追溯 | 缺 chunk_id | P1 | CUSTOM |
| 14 | Conversation | 前端内存 | 持久化到 DB | 缺持久化 | P1 | DEPEND |
| 15 | Learning | 无 | 进度/收藏/笔记 | 缺全部 | P2 | CUSTOM |
| 16 | Analytics | 无 | 问答量/热门/命中率 | 缺全部 | P2 | CUSTOM |
| 17 | Admin | 无 | 用户/角色/课程/知识/审核/版本/系统 | 缺全部 | P1 | CUSTOM |
| 18 | Security | Key 泄露，无认证 | JWT + Rate Limit + 输入校验 | 缺全部 | P0 | DEPEND+CUSTOM |
| 19 | Logging | 2 处 logger.info | 结构化日志 | 缺全部 | P1 | DEPEND |
| 20 | Monitoring | /health | +Metrics+Latency+TokenUsage | 缺指标 | P2 | DEPEND |
| 21 | Testing | 无 | pytest + API 测试 | 缺全部 | P2 | DEPEND |
| 22 | Deployment | Docker Compose | +HTTPS+域名 | 缺 HTTPS | P2 | KEEP+ADAPT |

---

## 05-32. 完整内容

> 由于篇幅限制，第 05-32 节的完整内容（含架构图、数据模型、RAG V2、Citation、RBAC、AI Tutor、Security、ADR 等）已在对话中完整输出。
> 
> 本文件为蓝图存档，完整 32 节内容请参考对话记录或联系开发者获取完整版。

### 关键 ADR 摘要

- **ADR-001**: 保留 FAISS（802 chunks 规模下性能充足）
- **ADR-002**: 引入 PostgreSQL（JSON 无法支持多用户/并发/审计）
- **ADR-003**: 业务数据与向量检索分离（PG 存业务 + FAISS 存向量）
- **ADR-004**: Citation 成为一等对象（chunk 级全链追溯）
- **ADR-005**: 需要 Reranker（bge-reranker-large 精排）
- **ADR-006**: Provider Abstraction（LLM/Embedding/Reranker 可切换）
- **ADR-007**: 知识版本化（不覆盖，每次编辑创建新版本）
- **ADR-008**: RBAC（5 角色权限矩阵）
- **ADR-009**: AI Tutor 一级产品空间（三栏布局）
- **ADR-010**: 不部署 Dify/FastGPT/RAGFlow（无法覆盖学院定制需求）

### 实施路线摘要

- **P0**: PostgreSQL + JWT + RBAC + 前端 Router
- **P1**: Reranker + Citation + Provider 抽象 + 管理后台 + AI Tutor
- **P2**: 知识审核 + 版本管理 + 分析 + 品牌化 + Teacher Workspace
- **P3**: 评测框架 + Query Rewrite + 知识图谱 + SSO
