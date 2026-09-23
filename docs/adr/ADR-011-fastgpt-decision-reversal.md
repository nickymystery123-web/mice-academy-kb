# ADR-011: 决策反转 — 采用 FastGPT 作为知识库与 AI 问答引擎

| 字段 | 值 |
|------|-----|
| 状态 | Accepted |
| 日期 | 2026-09-23 |
| 决策者 | 架构组 |
| 关联 | ADR-010（原决策：不部署 Dify/FastGPT/RAGFlow） |

## 背景

ADR-010 原决策为「不部署 Dify/FastGPT/RAGFlow」，理由是「无法覆盖学院定制需求」。
原计划自研 RAG 链路（bge-m3 + FAISS + BM25 + RRF + DeepSeek）以获得最大控制力。

在 V1 实施过程中发现以下问题：

1. **自研 RAG 引用精度不足**：FAISS + BM25 + RRF 在 588k 字 / 35 课程规模下，检索召回率尚可，但引用构建（citation）需要自行实现 chunk 溯源、去重、排序，工程量大且易出错。
2. **知识治理能力缺失**：自研方案缺少知识库可视化管理、分块策略调优、训练状态监控等运营能力。
3. **向量模型部署成本**：bge-m3 本地推理需 GPU 或较大内存，且 embedding 端点需自行维护。
4. **对话编排能力弱**：系统提示词、历史管理、流式输出、工具调用等需逐行实现。

## 决策

**反转 ADR-010，采用 FastGPT v4.8.5 作为知识库管理与 AI 问答引擎。**

### 选型理由

- **知识库管理成熟**：FastGPT 提供分块、训练、检索全链路可视化，运营成本低。
- **引用溯源内置**：datasetSearchNode 输出 quoteList，天然支持引用卡片。
- **向量模型灵活**：可对接本地 bge-m3 embedding 端点，避免依赖外部向量服务。
- **OpenAI 兼容 API**：`/api/v1/chat/completions` 支持 SSE 流式 + detail 模式返回 flowResponses（含引用）。
- **工作流编排**：通过 datasetSearchNode + chatNode 串联，检索与生成解耦。

### 实施要点

| 组件 | 配置 |
|------|------|
| FastGPT 版本 | v4.8.5（Docker Compose 部署） |
| 向量模型 | bge-m3（自建端点 `http://backend:8000/api/v1/embeddings`） |
| 对话模型 | DeepSeek Chat（deepseek-chat） |
| 知识库 | 35 课程各为独立 collection，chunk size=800，按 `\n## ` 分割 |
| 应用工作流 | workflowStart → datasetSearchNode → chatNode |
| API Key | 应用级 3 段式 key（`sk-<secret>-<appId>`） |

### 架构变化

```
原方案: 前端 → /api/rag/stream → 自研 RAG (FAISS+BM25+RRF) → DeepSeek
现方案: 前端 → /api/v1/chat/completions → FastGPT (datasetSearch + chat) → DeepSeek
                                    ↑
                          bge-m3 embedding (backend:8000)
```

- 后端 `/api/v1/embeddings` 端点保留，供 FastGPT 向量检索调用。
- 后端 RAG 端点（`/rag/search`, `/rag/stream`）标记为 deprecated，V1 不再使用。
- 前端 nginx 新增 `/api/v1/chat/completions` → `fastgpt:3000` 反代。

## 影响

### 正面

- 知识库检索与引用开箱即用，V1 交付速度显著提升。
- 引用卡片可直接跳转对应课程，用户体验好。
- 后续知识更新通过 FastGPT 后台即可完成，无需重新构建 FAISS 索引。

### 需注意

- FastGPT 为外部组件，需纳入备份与监控体系（MongoDB + PostgreSQL）。
- 前端通过应用级 API Key 调用，Key 以 `VITE_FASTGPT_API_KEY` 环境变量注入；生产环境应考虑网关层鉴权。
- 自研 RAG 代码暂不删除，保留作为 fallback 或后续定制检索的参考。

## 后续行动

- [ ] 为 FastGPT MongoDB/PostgreSQL 配置定期备份
- [ ] 评估是否需要将 API Key 鉴权前移至后端网关
- [ ] 监控知识库检索准确率，必要时调整 chunk size 与 similarity 阈值
