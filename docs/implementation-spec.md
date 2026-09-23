# MICE Academy Intelligence Platform
# V1.0 Implementation Specification

> 本文档基于已确认的 Target Architecture Blueprint，细化为开发人员可直接施工的规范。
> 本阶段仅做 Specification，不含实际代码。

---

## 目录

- [01. Database Schema](#01-database-schema)
- [02. ER Diagram](#02-er-diagram)
- [03. RBAC](#03-rbac)
- [04. Knowledge Governance](#04-knowledge-governance)
- [05. Citation Architecture](#05-citation-architecture)
- [06. API Contract](#06-api-contract)
- [07. RAG API](#07-rag-api)
- [08. Frontend Information Architecture](#08-frontend-information-architecture)
- [09. Page Specification](#09-page-specification)
- [10. AI Tutor](#10-ai-tutor)
- [11. Provider Architecture](#11-provider-architecture)
- [12. VectorStore Architecture](#12-vectorstore-architecture)
- [13. Frontend Design System](#13-frontend-design-system)
- [14. Security](#14-security)
- [15. Observability](#15-observability)
- [16. Evaluation](#16-evaluation)
- [17. Migration Strategy](#17-migration-strategy)
- [18. File Structure](#18-file-structure)
- [19. Implementation Dependency Graph](#19-implementation-dependency-graph)
- [20. Final Implementation Specification](#20-final-implementation-specification)

---

## 01. Database Schema

### 1.1 User Domain

#### Table: `users`
**Purpose**: 平台用户主表

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| email | VARCHAR(255) | | | ❌ | | ✅ | ✅ |
| password_hash | VARCHAR(255) | | | ❌ | | | |
| name | VARCHAR(100) | | | ❌ | | | |
| avatar_url | TEXT | | | ✅ | NULL | | |
| department | VARCHAR(100) | | | ✅ | NULL | | |
| title | VARCHAR(100) | | | ✅ | NULL | | |
| status | VARCHAR(20) | | | ❌ | 'active' | | ✅ |
| last_login_at | TIMESTAMPTZ | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| created_by | INT | | FK→users.id | ✅ | NULL | | |
| updated_by | INT | | FK→users.id | ✅ | NULL | | |

**Indexes**: `idx_users_email` (UNIQUE), `idx_users_status`, `idx_users_department`

---

#### Table: `roles`
**Purpose**: 角色定义

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| name | VARCHAR(50) | | | ❌ | | ✅ | ✅ |
| label | VARCHAR(100) | | | ❌ | | | |
| description | TEXT | | | ✅ | NULL | | |
| sort_order | INT | | | ❌ | 0 | | |
| is_system | BOOLEAN | | | ❌ | FALSE | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Seed Data**: `student`(1), `teacher`(2), `reviewer`(3), `admin`(4), `super_admin`(5)

---

#### Table: `permissions`
**Purpose**: 权限定义（Resource + Action 组合）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| resource | VARCHAR(50) | | | ❌ | | | ✅ |
| action | VARCHAR(50) | | | ❌ | | | ✅ |
| description | TEXT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(resource, action)` 组合唯一

**Seed**: resource ∈ {course, module, lecture, knowledge, document, version, review, ai, user, analytics, system, audit}; action ∈ {read, create, update, delete, publish, archive, rollback, approve, reject}

---

#### Table: `user_roles`
**Purpose**: 用户-角色多对多关联

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| role_id | INT | | FK→roles.id | ❌ | | | ✅ |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(user_id, role_id)`

---

#### Table: `role_permissions`
**Purpose**: 角色-权限多对多关联

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| role_id | INT | | FK→roles.id | ❌ | | | ✅ |
| permission_id | INT | | FK→permissions.id | ❌ | | | ✅ |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(role_id, permission_id)`

---

### 1.2 Course Domain

#### Table: `modules`
**Purpose**: 模块（12个）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| name | VARCHAR(50) | | | ❌ | | | |
| label | VARCHAR(100) | | | ❌ | | | |
| description | TEXT | | | ✅ | NULL | | |
| sort_order | INT | | | ❌ | 0 | | |
| status | VARCHAR(20) | | | ❌ | 'active' | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

#### Table: `courses`
**Purpose**: 课程（35讲）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | VARCHAR(10) | ✅ | | ❌ | | ✅ | ✅ |
| title | TEXT | | | ❌ | | | ✅ |
| short_title | TEXT | | | ✅ | NULL | | |
| module_id | INT | | FK→modules.id | ❌ | | | ✅ |
| lecturer_name | VARCHAR(100) | | | ✅ | NULL | | ✅ |
| overview | TEXT | | | ✅ | NULL | | |
| content | TEXT | | | ✅ | NULL | | |
| keywords | JSONB | | | ✅ | '[]' | | |
| takeaways | JSONB | | | ✅ | '[]' | | |
| word_count | INT | | | ❌ | 0 | | |
| status | VARCHAR(20) | | | ❌ | 'published' | | ✅ |
| version | INT | | | ❌ | 1 | | |
| published_at | TIMESTAMPTZ | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| created_by | INT | | FK→users.id | ✅ | NULL | | |
| updated_by | INT | | FK→users.id | ✅ | NULL | | |

**Indexes**: `idx_courses_module_id`, `idx_courses_status`, `idx_courses_lecturer_name`, `idx_courses_title`(GIN trigram)

---

#### Table: `lecturers`
**Purpose**: 讲师信息

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| name | VARCHAR(100) | | | ❌ | | ✅ | ✅ |
| bio | TEXT | | | ✅ | NULL | | |
| avatar_url | TEXT | | | ✅ | NULL | | |
| title | VARCHAR(100) | | | ✅ | NULL | | |
| organization | VARCHAR(200) | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

#### Table: `knowledge_points`
**Purpose**: 知识点（从课程内容提取）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| title | TEXT | | | ❌ | | | |
| description | TEXT | | | ✅ | NULL | | |
| keywords | JSONB | | | ✅ | '[]' | | |
| sort_order | INT | | | ❌ | 0 | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

### 1.3 Knowledge Domain

#### Table: `documents`
**Purpose**: 文档（上传的原始文件记录）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ✅ | NULL | | ✅ |
| title | TEXT | | | ❌ | | | |
| source_type | VARCHAR(20) | | | ❌ | 'manual' | | |
| source_url | TEXT | | | ✅ | NULL | | |
| file_path | TEXT | | | ✅ | NULL | | |
| file_type | VARCHAR(20) | | | ✅ | NULL | | |
| file_size | BIGINT | | | ✅ | NULL | | |
| status | VARCHAR(20) | | | ❌ | 'draft' | | ✅ |
| current_version_id | INT | | FK→document_versions.id | ✅ | NULL | | |
| created_by | INT | | FK→users.id | ❌ | | | ✅ |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**source_type**: `manual`(手动录入) | `upload`(文件上传) | `import`(批量导入)

---

#### Table: `document_versions`
**Purpose**: 文档版本（每次编辑创建新版本，不覆盖）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| document_id | INT | | FK→documents.id | ❌ | | | ✅ |
| version_number | INT | | | ❌ | 1 | | |
| title | TEXT | | | ❌ | | | |
| content | TEXT | | | ❌ | | | |
| change_summary | TEXT | | | ✅ | NULL | | |
| status | VARCHAR(20) | | | ❌ | 'draft' | | ✅ |
| reviewed_by | INT | | FK→users.id | ✅ | NULL | | |
| reviewed_at | TIMESTAMPTZ | | | ✅ | NULL | | |
| published_at | TIMESTAMPTZ | | | ✅ | NULL | | |
| created_by | INT | | FK→users.id | ❌ | | | ✅ |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(document_id, version_number)`

**status values**: `draft` → `reviewing` → `approved` / `rejected` → `published` → `archived`

---

#### Table: `document_chunks`
**Purpose**: 分块（持久化 UUID，关联 FAISS 索引位置）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| document_version_id | INT | | FK→document_versions.id | ❌ | | | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| module_id | INT | | FK→modules.id | ❌ | | | ✅ |
| section_title | TEXT | | | ✅ | NULL | | |
| text | TEXT | | | ❌ | | | |
| chunk_index | INT | | | ❌ | 0 | | |
| char_count | INT | | | ❌ | 0 | | |
| faiss_idx | INT | | | ❌ | | | ✅ |
| embedding_status | VARCHAR(20) | | | ❌ | 'pending' | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(document_version_id, chunk_index)`

**Index**: `idx_chunks_faiss_idx` (用于检索后回查)

---

#### Table: `resources`
**Purpose**: 课程资源附件

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| knowledge_point_id | INT | | FK→knowledge_points.id | ✅ | NULL | | |
| title | TEXT | | | ❌ | | | |
| resource_type | VARCHAR(20) | | | ❌ | 'link' | | |
| url | TEXT | | | ❌ | | | |
| file_path | TEXT | | | ✅ | NULL | | |
| sort_order | INT | | | ❌ | 0 | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

### 1.4 AI Domain

#### Table: `conversations`
**Purpose**: AI 对话会话

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| title | TEXT | | | ✅ | '新对话' | | |
| course_context | VARCHAR(10) | | FK→courses.id | ✅ | NULL | | |
| message_count | INT | | | ❌ | 0 | | |
| status | VARCHAR(20) | | | ❌ | 'active' | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**status**: `active` | `archived`

---

#### Table: `messages`
**Purpose**: 对话消息

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| conversation_id | UUID | | FK→conversations.id | ❌ | | | ✅ |
| role | VARCHAR(20) | | | ❌ | | | |
| content | TEXT | | | ❌ | | | |
| token_count | INT | | | ✅ | NULL | | |
| latency_ms | INT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**role**: `user` | `assistant` | `system`

---

#### Table: `citations`
**Purpose**: 引用对象（一等公民，每次 AI 回答的来源记录）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| message_id | UUID | | FK→messages.id | ❌ | | | ✅ |
| chunk_id | UUID | | FK→document_chunks.id | ❌ | | | ✅ |
| document_version_id | INT | | FK→document_versions.id | ❌ | | | |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| module_id | INT | | FK→modules.id | ❌ | | | |
| knowledge_point_id | INT | | FK→knowledge_points.id | ✅ | NULL | | |
| citation_number | INT | | | ❌ | | | |
| section_title | TEXT | | | ✅ | NULL | | |
| text | TEXT | | | ❌ | | | |
| score | FLOAT | | | ❌ | 0 | | |
| retrieval_method | VARCHAR(20) | | | ❌ | | | |
| reranker_score | FLOAT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**retrieval_method**: `vector` | `bm25` | `rrf`

---

#### Table: `ai_query_logs`
**Purpose**: AI 查询日志（用于分析）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| conversation_id | UUID | | FK→conversations.id | ✅ | NULL | | |
| query | TEXT | | | ❌ | | | |
| retrieved_chunk_ids | JSONB | | | ✅ | '[]' | | |
| retrieval_scores | JSONB | | | ✅ | '[]' | | |
| reranker_scores | JSONB | | | ✅ | '[]' | | |
| top_k | INT | | | ❌ | 5 | | |
| latency_ms | INT | | | ❌ | 0 | | |
| llm_provider | VARCHAR(50) | | | ✅ | NULL | | |
| llm_model | VARCHAR(100) | | | ✅ | NULL | | |
| prompt_tokens | INT | | | ✅ | NULL | | |
| completion_tokens | INT | | | ✅ | NULL | | |
| has_result | BOOLEAN | | | ❌ | TRUE | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

#### Table: `feedback`
**Purpose**: AI 回答反馈

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| message_id | UUID | | FK→messages.id | ❌ | | | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| rating | VARCHAR(10) | | | ❌ | | | |
| comment | TEXT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**rating**: `positive` | `negative`

---

### 1.5 Learning Domain

#### Table: `learning_progress`
**Purpose**: 学习进度

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| status | VARCHAR(20) | | | ❌ | 'not_started' | | |
| progress_pct | INT | | | ❌ | 0 | | |
| last_read_section | TEXT | | | ✅ | NULL | | |
| last_read_at | TIMESTAMPTZ | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(user_id, course_id)`

**status**: `not_started` | `in_progress` | `completed`

---

#### Table: `bookmarks`
**Purpose**: 收藏

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| section_title | TEXT | | | ✅ | NULL | | |
| note | TEXT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Unique Constraint**: `(user_id, course_id, section_title)`

---

#### Table: `notes`
**Purpose**: 学习笔记

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| user_id | INT | | FK→users.id | ❌ | | | ✅ |
| course_id | VARCHAR(10) | | FK→courses.id | ❌ | | | ✅ |
| section_title | TEXT | | | ✅ | NULL | | |
| content | TEXT | | | ❌ | | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

---

### 1.6 Governance Domain

#### Table: `reviews`
**Purpose**: 审核记录

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| document_version_id | INT | | FK→document_versions.id | ❌ | | | ✅ |
| reviewer_id | INT | | FK→users.id | ✅ | NULL | | ✅ |
| action | VARCHAR(20) | | | ❌ | | | |
| comment | TEXT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**action**: `submit` | `approve` | `reject` | `publish` | `archive` | `rollback`

---

#### Table: `audit_logs`
**Purpose**: 审计日志（所有写操作）

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | UUID | ✅ | | ❌ | gen_random_uuid() | ✅ | ✅ |
| user_id | INT | | FK→users.id | ✅ | NULL | | ✅ |
| action | VARCHAR(50) | | | ❌ | | | ✅ |
| resource_type | VARCHAR(50) | | | ❌ | | | |
| resource_id | TEXT | | | ✅ | NULL | | |
| before_state | JSONB | | | ✅ | NULL | | |
| after_state | JSONB | | | ✅ | NULL | | |
| ip_address | VARCHAR(45) | | | ✅ | NULL | | |
| user_agent | TEXT | | | ✅ | NULL | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**Index**: `idx_audit_user_id`, `idx_audit_action`, `idx_audit_resource`, `idx_audit_created_at`

---

### 1.7 Provider Domain

#### Table: `model_providers`
**Purpose**: AI 模型 Provider 配置

| Column | Type | PK | FK | Nullable | Default | Unique | Index |
|--------|------|:--:|:--:|:-------:|---------|:------:|:-----:|
| id | SERIAL | ✅ | | ❌ | nextval | ✅ | ✅ |
| provider_type | VARCHAR(20) | | | ❌ | | | ✅ |
| name | VARCHAR(100) | | | ❌ | | | |
| is_active | BOOLEAN | | | ❌ | FALSE | | |
| config | JSONB | | | ❌ | '{}' | | |
| priority | INT | | | ❌ | 0 | | |
| created_at | TIMESTAMPTZ | | | ❌ | NOW() | | |
| updated_at | TIMESTAMPTZ | | | ❌ | NOW() | | |

**provider_type**: `llm` | `embedding` | `reranker`

**config** (LLM): `{api_key_env, base_url, model, max_tokens, temperature}`
**config** (Embedding): `{model_name, dim, normalize}`
**config** (Reranker): `{model_name, max_length}`

---

## 02. ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER DOMAIN                                    │
│                                                                          │
│   users (1) ──< user_roles (M) >── (1) roles                             │
│                                          │                               │
│   roles (1) ──< role_permissions (M) >── (1) permissions                │
│                                                                          │
│   users (1) ──< learning_progress (M) >── (1) courses                   │
│   users (1) ──< bookmarks (M) >── (1) courses                           │
│   users (1) ──< notes (M) >── (1) courses                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         COURSE DOMAIN                                    │
│                                                                          │
│   modules (1) ──< courses (M)            [1:M]                          │
│   courses (1) ──< knowledge_points (M)   [1:M]                          │
│   courses (1) ──< resources (M)          [1:M]                          │
│   lecturers (1) ──< courses (M)          [1:M]                          │
│                                                                          │
│   注: lecturers 当前通过 courses.lecturer_name 字符串关联                │
│   未来可加 lecturer_id FK                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       KNOWLEDGE DOMAIN                                   │
│                                                                          │
│   documents (1) ──< document_versions (M)    [1:M]                      │
│   document_versions (1) ──< document_chunks (M)  [1:M]                  │
│   documents (M) >── (1) courses              [M:1]                      │
│   document_chunks (M) >── (1) courses        [M:1]                      │
│   document_chunks (M) >── (1) modules        [M:1]                      │
│                                                                          │
│   documents.current_version_id ──> document_versions.id  [1:1]          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           AI DOMAIN                                      │
│                                                                          │
│   users (1) ──< conversations (M)            [1:M]                      │
│   conversations (1) ──< messages (M)         [1:M]                      │
│   messages (1) ──< citations (M)             [1:M]                      │
│   citations (M) >── (1) document_chunks      [M:1]                      │
│   messages (1) ──< feedback (0..1)           [1:0..1]                   │
│   conversations (M) >── (0..1) courses       [M:0..1]                   │
│                                                                          │
│   ai_query_logs (独立日志表，弱关联 users + conversations)              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE DOMAIN                                   │
│                                                                          │
│   document_versions (1) ──< reviews (M)     [1:M]                       │
│   users (1) ──< reviews (M) (as reviewer)   [1:M]                       │
│   audit_logs (独立，弱关联 users)                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       PROVIDER DOMAIN                                    │
│                                                                          │
│   model_providers (独立配置表，无外键关联)                              │
│   按 provider_type 区分 LLM / Embedding / Reranker                      │
│   按 priority 决定 fallback 顺序                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 关系类型汇总

| 关系 | 类型 | 说明 |
|------|------|------|
| users → user_roles → roles | M:N | 用户可有多角色 |
| roles → role_permissions → permissions | M:N | 角色含多权限 |
| modules → courses | 1:M | 一个模块含多课程 |
| courses → knowledge_points | 1:M | 一个课程含多知识点 |
| courses → resources | 1:M | 一个课程含多资源 |
| documents → document_versions | 1:M | 一个文档多版本 |
| document_versions → document_chunks | 1:M | 一个版本多分块 |
| documents → courses | M:1 | 文档关联课程 |
| users → conversations | 1:M | 用户多对话 |
| conversations → messages | 1:M | 对话多消息 |
| messages → citations | 1:M | 消息多引用 |
| citations → document_chunks | M:1 | 引用指向分块 |
| messages → feedback | 1:0..1 | 消息可有0或1反馈 |
| document_versions → reviews | 1:M | 版本多审核记录 |
| documents → document_versions (current_version_id) | 1:1 | 当前版本指针 |

---

## 03. RBAC

### 3.1 Permission Catalog

| Resource | Actions |
|----------|---------|
| course | read, create, update, delete |
| module | read, create, update, delete |
| lecture | read, create, update, delete |
| knowledge | read, create, update, delete |
| document | read, create, update, delete |
| version | read, create, publish, archive, rollback |
| review | read, submit, approve, reject |
| ai | read, query, view_all |
| user | read, create, update, delete, assign_role |
| analytics | read |
| system | read, update |
| audit | read |

### 3.2 RBAC Matrix

| Resource | Action | Student | Teacher | Reviewer | Admin | Super Admin |
|----------|--------|:---:|:---:|:---:|:---:|:---:|
| course | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| course | create | ❌ | ❌ | ✅ | ✅ | ✅ |
| course | update | ❌ | ✅(自己) | ✅ | ✅ | ✅ |
| course | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| module | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| module | create | ❌ | ❌ | ❌ | ✅ | ✅ |
| module | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| module | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| lecture | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| lecture | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| lecture | update | ❌ | ✅(自己) | ✅ | ✅ | ✅ |
| lecture | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| knowledge | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| knowledge | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| knowledge | update | ❌ | ✅(自己) | ✅ | ✅ | ✅ |
| knowledge | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| document | read | ✅(published) | ✅(own+published) | ✅ | ✅ | ✅ |
| document | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| document | update | ❌ | ✅(own draft) | ✅ | ✅ | ✅ |
| document | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| version | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| version | create | ❌ | ✅ | ✅ | ✅ | ✅ |
| version | publish | ❌ | ❌ | ✅ | ✅ | ✅ |
| version | archive | ❌ | ❌ | ❌ | ✅ | ✅ |
| version | rollback | ❌ | ❌ | ❌ | ✅ | ✅ |
| review | read | ❌ | ✅(own) | ✅ | ✅ | ✅ |
| review | submit | ❌ | ✅ | ✅ | ✅ | ✅ |
| review | approve | ❌ | ❌ | ✅ | ✅ | ✅ |
| review | reject | ❌ | ❌ | ✅ | ✅ | ✅ |
| ai | read | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai | query | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai | view_all | ❌ | ❌ | ❌ | ✅ | ✅ |
| user | read | ❌ | ❌ | ❌ | ✅ | ✅ |
| user | create | ❌ | ❌ | ❌ | ✅ | ✅ |
| user | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| user | delete | ❌ | ❌ | ❌ | ❌ | ✅ |
| user | assign_role | ❌ | ❌ | ❌ | ❌ | ✅ |
| analytics | read | ❌ | ✅(own course) | ✅ | ✅ | ✅ |
| system | read | ❌ | ❌ | ❌ | ✅ | ✅ |
| system | update | ❌ | ❌ | ❌ | ✅ | ✅ |
| audit | read | ❌ | ❌ | ❌ | ✅ | ✅ |

### 3.3 权限检查实现规范

```
FastAPI Dependency:
  require_permission(resource="course", action="create")
  → 检查 JWT 中 user roles → 查 role_permissions → 是否包含 (course, create)
  → ✅ pass / ❌ 403 Forbidden
```

---

## 04. Knowledge Governance

### 4.1 状态机定义

```
                          ┌─────────┐
           create/edit ──>│  DRAFT  │
                          └────┬────┘
                               │ submit (Teacher+)
                               ▼
                    ┌──────────────────┐
                    │    REVIEWING     │
                    └──┬────────┬──────┘
               approve │        │ reject
                       ▼        ▼
              ┌──────────┐  ┌──────────┐
              │ APPROVED │  │ REJECTED │──→ 退回 DRAFT
              └────┬─────┘  └──────────┘
                   │ publish (Reviewer+)
                   ▼
              ┌───────────┐
              │ PUBLISHED │──→ re-index → AI 可用
              └────┬──────┘
                   │ archive (Admin+)
                   ▼
              ┌───────────┐
              │  ARCHIVED │──→ 可 rollback → PUBLISHED
              └───────────┘
```

### 4.2 状态转换权限

| 转换 | 动作 | 允许角色 | 前置条件 |
|------|------|---------|---------|
| → DRAFT | create/edit | Teacher, Reviewer, Admin | 无 |
| DRAFT → REVIEWING | submit | Teacher, Reviewer, Admin | 文档有内容 |
| REVIEWING → APPROVED | approve | Reviewer, Admin | 审核人 ≠ 提交人 |
| REVIEWING → REJECTED | reject | Reviewer, Admin | 附拒绝理由 |
| REJECTED → DRAFT | 退回 | Teacher(own), Admin | 自动退回 |
| APPROVED → PUBLISHED | publish | Reviewer, Admin | 自动触发 re-index |
| PUBLISHED → ARCHIVED | archive | Admin | 保留版本 |
| ARCHIVED → PUBLISHED | rollback | Admin | 回滚到该版本 |

### 4.3 版本关系

```
Document
  │
  ├── Version 1 (status=archived)  ← 历史版本
  ├── Version 2 (status=archived)  ← 历史版本
  └── Version 3 (status=published) ← 当前生产版本 (documents.current_version_id 指向这里)
      │
      ├── Chunk UUID-a (faiss_idx=0)
      ├── Chunk UUID-b (faiss_idx=1)
      └── ...

当 Version 4 创建（DRAFT）:
  → 基于 Version 3 内容创建
  → 编辑后提交审核
  → 审核通过 publish:
      - Version 3 → archived
      - Version 4 → published
      - 旧 chunks 标记为 archived
      - 新 chunks 向量化 → FAISS update
      - documents.current_version_id → Version 4
```

### 4.4 Re-index 策略

1. **增量更新**：publish 新版本时，仅删除旧 chunks 的 FAISS 向量，添加新 chunks 的向量
2. **全量重建**：手动触发 `build_index.py`，从 DB 读取所有 published chunks 重建
3. **FAISS 索引映射**：`document_chunks.faiss_idx` 记录在 FAISS 中的位置，删除时标记为 `-1`

---

## 05. Citation Architecture

### 5.1 Citation 完整追溯链

```
AI Answer (messages.id)
  └── Citation (citations.id)
       ├── citation_number: 1
       ├── score: 0.87
       ├── retrieval_method: "rrf"
       ├── reranker_score: 0.92
       │
       └── chunk_id → document_chunks.id (UUID)
            ├── text: "张丽老师从企业视角..."
            ├── section_title: "二、核心内容梳理"
            ├── chunk_index: 3
            │
            └── document_version_id → document_versions.id
                 ├── version_number: 1
                 ├── status: "published"
                 │
                 └── document_id → documents.id
                      ├── title: "跨国公司活动管理"
                      │
                      └── course_id → courses.id
                           ├── title: "跨国公司活动管理 四大底层逻辑"
                           ├── module_id → modules.id
                           │    └── name: "模块二", label: "活动管理核心"
                           └── lecturer_name: "张丽"
```

### 5.2 Citation 构建流程

```
RAG Pipeline:
  1. 检索得到 Top5 chunks (从 FAISS + BM25 + RRF + Reranker)
  2. 对每个 chunk:
     - 从 document_chunks 表获取完整 metadata
     - 构建 Citation 对象
     - 分配 citation_number (1-5)
  3. 将 citation_number [1][2]... 注入 Prompt Context
  4. LLM 生成回答（含 [1][2] 角标）
  5. SSE 发送:
     - sources event: citations[] 数组
     - content event: 逐 token 回答文本
  6. 持久化:
     - 写入 messages 表 (role=assistant)
     - 批量写入 citations 表
```

### 5.3 Citation SSE Schema

```json
{
  "type": "sources",
  "citations": [
    {
      "citation_number": 1,
      "chunk_id": "550e8400-...",
      "course_id": "03",
      "course_title": "跨国公司活动管理 四大底层逻辑",
      "module_name": "模块二",
      "section_title": "二、核心内容梳理",
      "text": "张丽老师从企业视角与参与者视角...",
      "text_preview": "张丽老师从企业视角与参与者视角双维度切入...",
      "score": 0.87,
      "reranker_score": 0.92
    }
  ]
}
```

---

## 06. API Contract

### 6.1 通用规范

**Base URL**: `/api`

**Auth Header**: `Authorization: Bearer <access_token>`

**统一响应格式**:
```json
// 成功
{ "data": <T>, "meta": { "total": 100, "page": 1, "page_size": 20 } }

// 错误
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "detail": {} } }
```

**分页**: `?page=1&page_size=20` → `meta: { total, page, page_size }`

**排序**: `?sort=created_at:desc`（字段:方向）

**筛选**: `?status=published&module_id=2`

### 6.2 核心 API 详细定义

#### POST /api/auth/login

| 项 | 值 |
|----|-----|
| AUTH | 无（公开端点） |
| ROLE | 无 |
| REQUEST | `{ "email": "string", "password": "string" }` |
| RESPONSE 200 | `{ "data": { "access_token": "string", "refresh_token": "string", "token_type": "bearer", "expires_in": 7200, "user": { "id": 1, "name": "string", "email": "string", "roles": ["student"] } } }` |
| ERROR 401 | `{ "error": { "code": "INVALID_CREDENTIALS", "message": "邮箱或密码错误" } }` |
| ERROR 422 | `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }` |

#### GET /api/courses

| 项 | 值 |
|----|-----|
| AUTH | ✅ Bearer |
| ROLE | 任意 |
| QUERY | `?page=1&page_size=20&module_id=2&status=published&search=keyword&sort=created_at:desc` |
| RESPONSE 200 | `{ "data": [{ "id": "01", "title": "...", "short_title": "...", "module_id": 1, "module_name": "模块一", "lecturer_name": "...", "word_count": 5000, "status": "published" }], "meta": { "total": 35, "page": 1, "page_size": 20 } }` |

#### GET /api/courses/{id}

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | 任意 |
| RESPONSE 200 | `{ "data": { "id": "01", "title": "...", "overview": "...", "content": "Markdown...", "keywords": ["..."], "takeaways": ["..."], "module": { "id": 1, "name": "模块一", "label": "活动管理基础" }, "lecturer_name": "...", "word_count": 5000, "version": 1, "status": "published" } }` |
| ERROR 404 | `{ "error": { "code": "NOT_FOUND", "message": "课程不存在" } }` |

#### POST /api/documents

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | Teacher+ |
| REQUEST | `multipart/form-data: file=<binary>, course_id="03", title="..."` |
| RESPONSE 201 | `{ "data": { "id": 15, "title": "...", "status": "draft", "current_version_id": 23 } }` |
| ERROR 403 | 无权限 |
| ERROR 413 | 文件过大（>20MB） |
| ERROR 415 | 不支持的文件类型 |

#### POST /api/documents/{id}/review

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | Teacher+ (submit), Reviewer+ (approve/reject) |
| REQUEST | `{ "action": "submit"\|"approve"\|"reject", "comment": "string" }` |
| RESPONSE 200 | `{ "data": { "document_version_id": 23, "status": "reviewing"\|"approved"\|"rejected" } }` |

#### POST /api/versions/{id}/publish

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | Reviewer+ |
| RESPONSE 200 | `{ "data": { "version_id": 23, "status": "published", "published_at": "2026-..." } }` |
| SIDE EFFECT | 触发 re-index：旧 chunks 标记 archived，新 chunks 向量化写入 FAISS |

#### POST /api/conversations

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | 任意 |
| REQUEST | `{ "title": "string", "course_context": "03" }` (course_context 可选) |
| RESPONSE 201 | `{ "data": { "id": "uuid", "title": "...", "course_context": "03", "status": "active" } }` |

#### POST /api/conversations/{id}/messages

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | 任意 |
| REQUEST | `{ "content": "用户问题" }` |
| RESPONSE 201 | `{ "data": { "id": "msg-uuid", "role": "user", "content": "..." } }` |
| NOTE | AI 回答通过 `/rag/stream` SSE 返回，不通过此端点 |

### 6.3 完整 API 路由表

| Method | Path | Auth | Role | Description |
|--------|------|:---:|:---:|-------------|
| POST | /api/auth/login | ❌ | — | 登录 |
| POST | /api/auth/register | ❌ | — | 注册 |
| POST | /api/auth/refresh | ❌ | — | 刷新 token |
| GET | /api/auth/me | ✅ | 任意 | 当前用户 |
| PUT | /api/auth/me | ✅ | 任意 | 更新个人资料 |
| GET | /api/courses | ✅ | 任意 | 课程列表 |
| GET | /api/courses/{id} | ✅ | 任意 | 课程详情 |
| POST | /api/courses | ✅ | Reviewer+ | 创建课程 |
| PUT | /api/courses/{id} | ✅ | Teacher+ | 编辑课程 |
| DELETE | /api/courses/{id} | ✅ | SuperAdmin | 删除课程 |
| GET | /api/modules | ✅ | 任意 | 模块列表 |
| GET | /api/modules/{id} | ✅ | 任意 | 模块详情 |
| GET | /api/lecturers | ✅ | 任意 | 讲师列表 |
| GET | /api/knowledge/points | ✅ | 任意 | 知识点列表 |
| GET | /api/knowledge/documents | ✅ | 任意 | 文档列表 |
| POST | /api/knowledge/documents | ✅ | Teacher+ | 上传文档 |
| GET | /api/knowledge/documents/{id} | ✅ | 任意 | 文档详情 |
| GET | /api/knowledge/documents/{id}/versions | ✅ | 任意 | 版本历史 |
| POST | /api/knowledge/documents/{id}/versions | ✅ | Teacher+ | 创建新版本 |
| POST | /api/knowledge/documents/{id}/review | ✅ | Teacher+ | 提交/审核 |
| POST | /api/knowledge/versions/{id}/publish | ✅ | Reviewer+ | 发布 |
| POST | /api/knowledge/versions/{id}/archive | ✅ | Admin+ | 归档 |
| POST | /api/knowledge/versions/{id}/rollback | ✅ | Admin+ | 回滚 |
| GET | /api/knowledge/glossary | ✅ | 任意 | 术语表 |
| POST | /api/rag/search | ✅ | 任意 | 纯检索 |
| POST | /api/rag/stream | ✅ | 任意 | SSE 流式问答 |
| GET | /api/rag/health | ✅ | 任意 | RAG 状态 |
| GET | /api/conversations | ✅ | 任意 | 对话列表 |
| POST | /api/conversations | ✅ | 任意 | 创建对话 |
| GET | /api/conversations/{id} | ✅ | 任意 | 对话详情 |
| DELETE | /api/conversations/{id} | ✅ | 任意 | 删除对话 |
| POST | /api/feedback | ✅ | 任意 | 提交反馈 |
| GET | /api/learning/progress | ✅ | 任意 | 学习进度 |
| POST | /api/learning/progress | ✅ | 任意 | 更新进度 |
| GET | /api/learning/bookmarks | ✅ | 任意 | 收藏列表 |
| POST | /api/learning/bookmarks | ✅ | 任意 | 添加收藏 |
| DELETE | /api/learning/bookmarks/{id} | ✅ | 任意 | 删除收藏 |
| GET | /api/learning/notes | ✅ | 任意 | 笔记列表 |
| POST | /api/learning/notes | ✅ | 任意 | 添加笔记 |
| GET | /api/admin/users | ✅ | Admin+ | 用户列表 |
| POST | /api/admin/users | ✅ | Admin+ | 创建用户 |
| PUT | /api/admin/users/{id} | ✅ | Admin+ | 编辑用户 |
| DELETE | /api/admin/users/{id} | ✅ | SuperAdmin | 删除用户 |
| PUT | /api/admin/users/{id}/roles | ✅ | SuperAdmin | 分配角色 |
| GET | /api/admin/analytics | ✅ | Admin+ | 分析数据 |
| GET | /api/admin/logs | ✅ | Admin+ | 操作日志 |
| GET | /api/admin/audit | ✅ | Admin+ | 审计日志 |
| GET | /api/admin/system | ✅ | Admin+ | 系统配置 |
| PUT | /api/admin/system | ✅ | Admin+ | 系统配置更新 |
| GET | /api/admin/models | ✅ | Admin+ | 模型配置 |
| PUT | /api/admin/models/{id} | ✅ | Admin+ | 更新模型配置 |
| POST | /api/analytics/track | ✅ | 任意 | 前端埋点 |
| GET | /api/analytics/dashboard | ✅ | Teacher+ | 仪表盘数据 |
| GET | /health | ❌ | — | 健康检查 |
| GET | /metrics | ✅ | Admin+ | 系统指标 |

---

## 07. RAG API

### 7.1 POST /api/rag/search

**Purpose**: 纯检索（不调用 LLM）

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | 任意 |

**Request Body**:
```json
{
  "query": "跨国活动管理的核心逻辑",
  "course_id": "03",
  "module_id": 2,
  "knowledge_point_id": null,
  "top_k": 5,
  "rerank": true,
  "filters": {
    "lecturer_name": "张丽"
  }
}
```

**Response 200**:
```json
{
  "data": {
    "query": "跨国活动管理的核心逻辑",
    "results": [
      {
        "citation_number": 1,
        "chunk_id": "uuid",
        "course_id": "03",
        "course_title": "跨国公司活动管理 四大底层逻辑",
        "module_name": "模块二",
        "section_title": "二、核心内容梳理",
        "text": "...",
        "text_preview": "前200字...",
        "score": 0.87,
        "reranker_score": 0.92,
        "retrieval_method": "rrf"
      }
    ],
    "total_found": 5,
    "latency_ms": 350
  }
}
```

### 7.2 POST /api/rag/stream

**Purpose**: SSE 流式问答

| 项 | 值 |
|----|-----|
| AUTH | ✅ |
| ROLE | 任意 |
| Content-Type | `application/json` |
| Response Content-Type | `text/event-stream` |

**Request Body**:
```json
{
  "query": "跨国活动管理的核心逻辑是什么？",
  "conversation_id": "uuid",
  "course_id": "03",
  "module_id": null,
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "top_k": 5,
  "rerank": true,
  "filters": {}
}
```

### 7.3 SSE Event Schema

**Event 1: sources**（检索完成后，LLM 生成前）
```json
data: {
  "type": "sources",
  "citations": [
    {
      "citation_number": 1,
      "chunk_id": "uuid",
      "course_id": "03",
      "course_title": "跨国公司活动管理 四大底层逻辑",
      "module_name": "模块二",
      "section_title": "二、核心内容梳理",
      "text_preview": "前200字...",
      "score": 0.87,
      "reranker_score": 0.92
    }
  ],
  "total_found": 5,
  "retrieval_latency_ms": 350
}
```

**Event 2-N: content**（LLM 逐 token 生成）
```json
data: {
  "type": "content",
  "text": "跨国活动管理的核心逻辑包括"
}
```

**Event: metadata**（LLM 完成后）
```json
data: {
  "type": "metadata",
  "message_id": "msg-uuid",
  "conversation_id": "conv-uuid",
  "prompt_tokens": 1500,
  "completion_tokens": 800,
  "llm_latency_ms": 3200,
  "llm_provider": "deepseek",
  "llm_model": "deepseek-chat"
}
```

**Event: error**（异常时）
```json
data: {
  "type": "error",
  "code": "LLM_TIMEOUT",
  "message": "AI 回答超时，请重试"
}
```

**Event: done**
```
data: [DONE]
```

### 7.4 完整 SSE 流

```
1. data: {"type":"sources","citations":[...],"retrieval_latency_ms":350}
2. data: {"type":"content","text":"跨国活动管理"}
3. data: {"type":"content","text":"的核心逻辑包括"}
4. data: {"type":"content","text":"[1]：..."}
...
N. data: {"type":"metadata","message_id":"...","prompt_tokens":1500,...}
N+1. data: [DONE]
```

---

## 08. Frontend Information Architecture

### 8.1 App Shell

```
┌─────────────────────────────────────────────────────┐
│  Header: Logo │ Global Search │ User Avatar │ Theme │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  Sidebar │              Main Content                │
│  (role-  │           (Router Outlet)                │
│  aware)  │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Footer: © MICE Academy                             │
└─────────────────────────────────────────────────────┘
```

### 8.2 Router 定义

```
/login                          → AuthLayout > Login
/register                       → AuthLayout > Register

/                               → StudentLayout > Home
/courses                        → StudentLayout > CourseList
/courses/:id                    → StudentLayout > CourseView
/modules                        → StudentLayout > ModuleList
/modules/:id                    → StudentLayout > ModuleDetail
/knowledge                      → StudentLayout > KnowledgeExplorer
/knowledge/glossary             → StudentLayout > Glossary
/knowledge/lecturers            → StudentLayout > Lecturers
/ai-tutor                       → StudentLayout > AITutor
/ai-tutor/:conversationId       → StudentLayout > AITutor
/my-learning                    → StudentLayout > MyLearning
/my-learning/progress           → StudentLayout > LearningProgress
/my-learning/bookmarks          → StudentLayout > Bookmarks
/my-learning/notes              → StudentLayout > Notes
/profile                        → StudentLayout > Profile

/teacher                        → TeacherLayout > Dashboard
/teacher/courses                → TeacherLayout > MyCourses
/teacher/knowledge              → TeacherLayout > Knowledge
/teacher/knowledge/upload       → TeacherLayout > DocumentUpload
/teacher/knowledge/:id/versions → TeacherLayout > VersionHistory
/teacher/review                 → TeacherLayout > ReviewQueue
/teacher/students               → TeacherLayout > StudentLearning

/admin                          → AdminLayout > Dashboard
/admin/users                    → AdminLayout > UserManagement
/admin/users/:id                → AdminLayout > UserDetail
/admin/courses                  → AdminLayout > CourseManagement
/admin/knowledge                → AdminLayout > KnowledgeManagement
/admin/review                   → AdminLayout > ReviewManagement
/admin/versions                 → AdminLayout > VersionManagement
/admin/models                   → AdminLayout > ModelConfig
/admin/analytics                → AdminLayout > Analytics
/admin/system                   → AdminLayout > SystemSettings
/admin/logs                     → AdminLayout > OperationLogs
/admin/audit                    → AdminLayout > AuditLogs
```

### 8.3 路由守卫

```
<Route element={<RequireAuth />}>        // 检查 JWT
  <Route element={<StudentLayout />}>    // 检查 student 角色可见
    ...student routes
  </Route>
  <Route element={<RequireRole min="teacher" />}>
    <Route element={<TeacherLayout />}>
      ...teacher routes
    </Route>
  </Route>
  <Route element={<RequireRole min="admin" />}>
    <Route element={<AdminLayout />}>
      ...admin routes
    </Route>
  </Route>
</Route>
```

### 8.4 角色可见导航

| 导航项 | Student | Teacher | Reviewer | Admin | Super Admin |
|--------|:---:|:---:|:---:|:---:|:---:|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ |
| Courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Knowledge Explorer | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Tutor | ✅ | ✅ | ✅ | ✅ | ✅ |
| My Learning | ✅ | ✅ | ✅ | ✅ | ✅ |
| Teacher Dashboard | ❌ | ✅ | ✅ | ✅ | ✅ |
| Review Queue | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Console | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 09. Page Specification

### Student Home

| 项 | 值 |
|----|-----|
| Purpose | 平台首页，展示统计 + 模块入口 + 快捷功能 |
| Role | All |
| Entry | `/` |
| Data | stats（课程数/模块数/讲师数/字数）, modules[], recent conversations[] |
| Actions | 点击模块→ModuleDetail, 点击AI Tutor→/ai-tutor, 搜索 |
| API | GET /api/courses?module_id=X, GET /api/conversations?page_size=5 |
| Loading | 骨架屏 |
| Empty | "暂无课程" |
| Error | "加载失败，请重试" + 重试按钮 |

### Course List

| 项 | 值 |
|----|-----|
| Purpose | 浏览全部课程，按模块/讲师筛选 |
| Entry | `/courses` |
| Data | courses[] (分页), modules[] (筛选器) |
| Actions | 筛选, 排序, 点击课程→CourseView |
| API | GET /api/courses?module_id=&search=&sort=&page= |
| Loading | 卡片骨架屏 |
| Empty | "未找到匹配课程" |

### Course View

| 项 | 值 |
|----|-----|
| Purpose | 阅读课程内容（Markdown） |
| Entry | `/courses/:id` |
| Data | course详情 (content, keywords, takeaways), learning_progress, bookmarks |
| Actions | 标记已读, 收藏, 记笔记, 向AI提问(带course_context) |
| API | GET /api/courses/:id, POST /api/learning/progress, POST /api/learning/bookmarks |
| States | 正常 / 加载中 / 404 |
| Permissions | published 课程所有人可读；draft 仅 Teacher+ 可读 |

### AI Tutor

| 项 | 值 |
|----|-----|
| Purpose | AI 辅助学习，一级产品空间 |
| Entry | `/ai-tutor` |
| Layout | 三栏：左=会话列表, 中=对话区, 右=来源面板 |
| Data | conversations[], messages[], citations[] |
| Actions | 新建对话, 提问, 点击引用→查看原文, 反馈, 重新生成 |
| API | POST /api/rag/stream (SSE), GET /api/conversations, POST /api/conversations |
| Loading | 打字机效果 + "思考中..." |
| Empty | "开始你的第一个问题" + 推荐问题 |
| Error | "请求出错" + 重试 |

### Teacher Dashboard

| 项 | 值 |
|----|-----|
| Purpose | 教师工作台概览 |
| Entry | `/teacher` |
| Data | my_courses[], knowledge_status{}, ai_queries[], unanswered_questions[] |
| API | GET /api/courses?created_by=me, GET /api/admin/analytics?scope=teacher |
| Loading | 指标卡片骨架屏 |

### Document Management

| 项 | 值 |
|----|-----|
| Purpose | 教师上传/编辑/管理文档 |
| Entry | `/teacher/knowledge` |
| Data | documents[] (含 status, version), chunks[] |
| Actions | 上传, 编辑(创建新版本), 提交审核, 查看版本历史, 查看chunks |
| API | POST /api/knowledge/documents, GET /api/knowledge/documents/:id/versions, POST /api/knowledge/documents/:id/review |

### Review Queue

| 项 | 值 |
|----|-----|
| Purpose | Reviewer 审核待审文档 |
| Entry | `/teacher/review` (Reviewer+ 可见) |
| Data | documents[] (status=reviewing) |
| Actions | 通过, 驳回(附理由), 预览内容 |
| API | POST /api/knowledge/documents/:id/review (action=approve/reject) |

### Version Management

| 项 | 值 |
|----|-----|
| Purpose | 查看版本历史，对比，回滚 |
| Entry | `/teacher/knowledge/:id/versions` |
| Data | document_versions[] |
| Actions | 对比两版本, 回滚 |
| API | GET /api/knowledge/documents/:id/versions, POST /api/knowledge/versions/:id/rollback |

### Admin Dashboard

| 项 | 值 |
|----|-----|
| Purpose | 系统概览 |
| Entry | `/admin` |
| Data | user_count, course_count, query_count_7d, system_health |
| API | GET /api/admin/analytics, GET /metrics |

### User Management

| 项 | 值 |
|----|-----|
| Purpose | 管理用户和角色 |
| Entry | `/admin/users` |
| Data | users[] (分页) |
| Actions | 创建, 编辑, 分配角色, 禁用 |
| API | GET /api/admin/users, POST /api/admin/users, PUT /api/admin/users/:id/roles |

### Analytics

| 项 | 值 |
|----|-----|
| Purpose | 数据分析看板 |
| Entry | `/admin/analytics` |
| Data | 问答趋势, 热门问题Top20, 检索命中率, 满意度, token消耗 |
| API | GET /api/admin/analytics?range=7d |
| Visualization | 折线图(趋势), 柱状图(热门), 饼图(满意度), 数字卡片(汇总) |

---

## 10. AI Tutor

### 10.1 三栏布局规格

```
┌─────────────┬────────────────────────────┬─────────────────┐
│  会话列表    │       对话区               │   来源面板       │
│  (280px)    │       (flex-1)             │   (320px)       │
│             │                            │                 │
│  [+ 新对话]  │  ┌──────────────────────┐ │  [折叠/展开]     │
│             │  │  ✨ AI Tutor          │ │                 │
│  今天        │  │  你好！我是 MICE...   │ │  参考来源        │
│  ├ RFP流程  │  │                      │ │  ─────────       │
│  ├ BATNA    │  │  [用户消息]           │ │  [1] 课程03     │
│             │  │  跨国活动管理...       │ │  跨国活动管理    │
│  昨天        │  │                      │ │  二、核心内容    │
│  ├ 谈判技巧  │  │  [AI 回答]            │ │  score: 0.87    │
│  └ 展会策划  │  │  核心逻辑包括[1]...   │ │  [查看原文]     │
│             │  │                      │ │  [跳转课程]     │
│             │  └──────────────────────┘ │                 │
│             │  ┌──────────────────────┐ │  [2] 课程03     │
│             │  │  输入问题...  [发送]  │ │  BATNA应用      │
│             │  └──────────────────────┘ │  score: 0.82    │
│             │  [📎 附件] [🎤 语音]      │  [查看原文]     │
└─────────────┴────────────────────────────┴─────────────────┘
```

### 10.2 交互规格

| 交互 | 行为 |
|------|------|
| 新建对话 | 左栏顶部按钮，清空对话区，创建空 conversation |
| 输入问题 | Enter 发送，Shift+Enter 换行，最大 500 字 |
| 发送 | 禁用输入框，显示"思考中..."，发起 SSE |
| SSE sources | 渲染来源面板右侧 |
| SSE content | 逐 token 追加到 AI 回答区，自动滚动 |
| SSE metadata | 记录 token/latency，不显示给用户 |
| SSE done | 启用输入框，显示操作栏（反馈/重新生成/复制） |
| 点击 [1] | 滚动右侧来源面板到对应卡片，高亮 |
| 点击 [查看原文] | 弹出 Modal 展示 chunk 完整文本 |
| 点击 [跳转课程] | 新标签打开 `/courses/:id` |
| 👍 反馈 | POST /api/feedback {rating: positive} |
| 👎 反馈 | 弹出文本框，POST /api/feedback {rating: negative, comment} |
| 重新生成 | 重新调用 /rag/stream，追加新 AI 回答 |
| 历史对话 | 点击左栏对话项，加载 messages + citations |
| Course Context | 顶部可选「仅搜索当前课程」下拉框 |

### 10.3 回答与 Citation 对应关系

```
AI 回答文本:
  "跨国活动管理的核心逻辑包括[1]：
   1. 企业视角与参与者视角的双维度分析[1]
   2. BATNA 在谈判中的应用[2]
   3. RFP 招标流程的标准化[3]"

对应 Citations:
  [1] → citations[0] = { chunk_id, course_id:"03", section:"二、核心内容梳理" }
  [2] → citations[1] = { chunk_id, course_id:"03", section:"三、BATNA 应用" }
  [3] → citations[2] = { chunk_id, course_id:"07", section:"二、流程步骤" }

前端渲染:
  - [1] [2] [3] 渲染为可点击角标
  - 点击 → 高亮右侧来源卡片
  - 角标颜色 = 来源卡片边框颜色（视觉关联）
```

---

## 11. Provider Architecture

### 11.1 LLMProvider Interface

```python
class LLMProvider(ABC):
    @abstractmethod
    async def stream(
        self, messages: list[dict], **kwargs
    ) -> AsyncGenerator[str, None]:
        """逐 token 返回生成文本"""
        pass

    @abstractmethod
    async def generate(
        self, messages: list[dict], **kwargs
    ) -> str:
        """一次性返回完整文本"""
        pass

    @property
    @abstractmethod
    def name(self) -> str: pass

    @property
    @abstractmethod
    def max_tokens(self) -> int: pass
```

**配置**:
```ini
LLM_PROVIDER=deepseek
LLM_TIMEOUT=30
LLM_MAX_RETRIES=2
LLM_FALLBACK_PROVIDER=
```

**Provider Registry**:
```python
_LLM_REGISTRY = {
    "deepseek": DeepSeekProvider,
    "openai": OpenAIProvider,
    "qwen": QwenProvider,
    "ollama": OllamaProvider,
}

def get_llm_provider() -> LLMProvider:
    name = settings.LLM_PROVIDER
    if name not in _LLM_REGISTRY:
        raise ValueError(f"Unknown LLM provider: {name}")
    return _LLM_REGISTRY[name]()
```

**Fallback 策略**:
1. 主 Provider 超时/错误 → 重试 `LLM_MAX_RETRIES` 次
2. 仍失败 → 切换到 `LLM_FALLBACK_PROVIDER`
3. 全部失败 → 返回降级内容（检索摘要 + "AI 服务暂时不可用"）

**Logging**: 每次 LLM 调用记录 `ai_query_logs` 表

### 11.2 EmbeddingProvider Interface

```python
class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """批量向量化"""
        pass

    @abstractmethod
    async def embed_query(self, text: str) -> list[float]:
        """单条查询向量化"""
        pass

    @property
    @abstractmethod
    def dim(self) -> int: pass

    @property
    @abstractmethod
    def name(self) -> str: pass
```

### 11.3 RerankerProvider Interface

```python
class RerankerProvider(ABC):
    @abstractmethod
    async def rerank(
        self, query: str, chunks: list[dict], top_k: int = 5
    ) -> list[ScoredChunk]:
        """对 chunks 重排序，返回 top_k"""
        pass

    @property
    @abstractmethod
    def name(self) -> str: pass

@dataclass
class ScoredChunk:
    chunk: dict
    original_score: float
    reranker_score: float
    final_rank: int
```

---

## 12. VectorStore Architecture

```python
class VectorStore(ABC):
    @abstractmethod
    def search(
        self, query_vector: list[float], top_k: int = 20
    ) -> list[SearchResult]:
        """向量检索"""
        pass

    @abstractmethod
    def add(
        self, vectors: list[list[float]], ids: list[int]
    ) -> None:
        """添加向量"""
        pass

    @abstractmethod
    def delete(self, ids: list[int]) -> None:
        """删除向量"""
        pass

    @abstractmethod
    def update(
        self, id: int, vector: list[float]
    ) -> None:
        """更新单个向量"""
        pass

    @abstractmethod
    def rebuild(
        self, vectors: list[list[float]], ids: list[int]
    ) -> None:
        """全量重建"""
        pass

    @property
    @abstractmethod
    def size(self) -> int: pass

    @property
    @abstractmethod
    def dim(self) -> int: pass
```

**当前实现**: `FAISSVectorStore(VectorStore)` — 使用 `IndexFlatIP`

**未来实现**: `PgVectorStore`, `QdrantVectorStore`, `MilvusVectorStore`

**切换方式**: `VECTOR_STORE=faiss`（.env），`get_vector_store()` 工厂方法

---

## 13. Frontend Design System

### 13.1 Design Tokens

```css
:root {
  /* Color - Primary */
  --color-primary: #1a2744;
  --color-primary-hover: #243556;
  --color-primary-light: #E8EBF0;

  /* Color - Accent */
  --color-accent: #c9a227;
  --color-accent-hover: #B8901F;

  /* Color - Background */
  --color-bg: #faf9f7;
  --color-bg-card: #ffffff;
  --color-bg-hover: #f5f4f2;

  /* Color - Text */
  --color-text: #1a1a1a;
  --color-text-secondary: #5a5a5a;
  --color-text-muted: #999999;
  --color-text-inverse: #ffffff;

  /* Color - Functional */
  --color-success: #2d8659;
  --color-error: #c0392b;
  --color-warning: #e67e22;
  --color-info: #2980b9;

  /* Color - AI Tutor */
  --color-ai: #3730a3;
  --color-ai-light: #EDE9FE;
  --color-ai-bg: #F5F3FF;

  /* Typography */
  --font-serif: "Noto Serif SC", "Source Han Serif", serif;
  --font-sans: "Noto Sans SC", "Source Han Sans", "Inter", sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", monospace;

  --fs-xs: 12px;
  --fs-sm: 14px;
  --fs-base: 16px;
  --fs-lg: 18px;
  --fs-xl: 20px;
  --fs-2xl: 24px;
  --fs-3xl: 30px;
  --fs-4xl: 36px;
  --fs-5xl: 48px;

  /* Spacing (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Grid */
  --grid-max-width: 1280px;
  --grid-gutter: 24px;
  --grid-columns: 12;
}
```

### 13.2 组件规范

| 组件 | 规格 |
|------|------|
| Button | 高度 36px/40px/44px (sm/md/lg)；圆角 var(--radius-md)；hover 加深 10% |
| Input | 高度 40px；边框 1px #ddd；focus 边框 var(--color-primary) |
| Table | 行高 48px；表头 bg var(--color-primary-light)；斑马纹 var(--color-bg-hover) |
| Card | bg white；radius var(--radius-md)；shadow var(--shadow-sm)；hover shadow-md |
| Modal | 遮罩 rgba(0,0,0,0.5)；内容 radius-lg；max-width 640px |
| Sidebar | 宽度 240px（折叠 64px）；bg var(--color-primary)；text white |
| Badge | 高度 22px；padding 2px 8px；radius-full；按状态着色 |
| Tag | 同 Badge 但有 × 关闭按钮 |
| Loading | 旋转图标 + 文字；骨架屏用 #eee 闪烁 |

### 13.3 风格关键词

**Enterprise Academic Intelligence UI**：高级、克制、国际化、学院感、专业、数据密度高

**避免**：廉价 SaaS、过度圆角、大面积渐变、营销网站风格、ChatGPT Clone

---

## 14. Security

| 领域 | 规范 |
|------|------|
| Authentication | JWT HS256；Access Token 2h；Refresh Token 7d (httpOnly cookie) |
| Password | bcrypt (cost=12)；最小 8 字符 |
| CORS | `ALLOWED_ORIGINS` 从 .env 读取；生产环境仅学院域名 |
| Rate Limit | AI Tutor: 20 req/min/user；Search: 60 req/min/user；Auth: 5 req/min/IP |
| Input Validation | Pydantic schema 全覆盖；query ≤ 500 字；文件 ≤ 20MB |
| File Upload | 类型白名单 (.docx/.pdf/.md)；文件名 sanitize；存储路径不可遍历 |
| Prompt Injection | System prompt 明确「忽略角色切换」；用户输入用 `<user_input>` 标签包裹 |
| Secret Management | .env 不入 Git；.env.example 仅占位符；生产用 Docker secrets |
| Audit Log | 所有写操作记录 audit_logs（who/what/when/before/after） |
| Error Exposure | 生产关闭 debug traceback；返回 `{error: {code, message}}` + 内部 log_id |
| API Security | 除 /auth/* 和 /health 外全部需 Bearer Token |

---

## 15. Observability

### 15.1 日志格式（JSON）

```json
{
  "timestamp": "2026-09-23T10:30:00Z",
  "level": "INFO",
  "logger": "rag_service",
  "event": "retrieval_complete",
  "user_id": 1,
  "query": "跨国活动管理",
  "retrieved_count": 5,
  "latency_ms": 350,
  "scores": [0.87, 0.82, 0.78, 0.71, 0.65]
}
```

### 15.2 日志类型

| 类型 | Logger | 关键字段 |
|------|--------|---------|
| API Log | `api` | method, path, status, latency_ms, user_id |
| RAG Log | `rag` | query, retrieved_count, scores, latency_ms, method |
| LLM Log | `llm` | provider, model, prompt_tokens, completion_tokens, latency_ms |
| Error Log | `error` | exception, traceback, context |
| Audit Log | `audit` | user_id, action, resource, before, after |

### 15.3 Metrics 端点

```json
{
  "status": "healthy",
  "database": "connected",
  "faiss": {"loaded": true, "chunk_count": 802},
  "bm25": {"loaded": true},
  "llm": {"provider": "deepseek", "available": true},
  "reranker": {"provider": "bge-reranker", "available": true},
  "metrics": {
    "rag_queries_total": 1234,
    "rag_avg_latency_ms": 850,
    "rag_no_result_count": 23,
    "llm_tokens_total": 456000,
    "llm_avg_latency_ms": 2800,
    "active_users_24h": 12,
    "conversations_total": 567,
    "feedback_positive_rate": 0.82
  }
}
```

---

## 16. Evaluation

### 16.1 评测集结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 评测条目 ID |
| question | TEXT | 测试问题 |
| ground_truth | TEXT | 标准答案 |
| expected_course_id | VARCHAR(10) | 期望来源课程 |
| expected_knowledge_point | TEXT | 期望知识点 |
| expected_keywords | JSONB | 答案应包含的关键词 |

### 16.2 评测指标

| 指标 | 计算方式 | V1 目标 |
|------|---------|---------|
| Recall@5 | 正确 chunk 在 Top5 占比 | >80% |
| MRR | 1/正确 chunk 排名 均值 | >0.6 |
| Citation Precision | 正确引用占比 | >85% |
| Groundedness | 基于 context 回答占比 | >85% |
| Relevance | 回答与问题相关性 | >85% |
| Latency P95 | 端到端 | <5s |
| Token Cost | 平均 token/次 | <2000 |

### 16.3 评测流程

1. 构建 50-100 条评测集（含标准答案）
2. 运行评测脚本，调用 /api/rag/search + /api/rag/stream
3. 自动计算 Recall/MRR/Latency/Token
4. 人工评分 Groundedness/Relevance（1-5 分）
5. 对比 Baseline vs V1 指标变化
6. 记录到 evaluation_results 表

---

## 17. Migration Strategy

### Phase 1: Dual Read / Migration Preparation

| 项 | 内容 |
|----|------|
| **做什么** | 引入 PostgreSQL + SQLAlchemy + Alembic；创建全部表结构；写迁移脚本 `json_to_pg.py` |
| **不做什么** | 不改前端数据源（仍读 JSON）；不改后端检索（仍读 FAISS 文件） |
| **风险** | 低（纯新增，不改现有代码路径） |
| **回滚** | 删除 migration + 表，无影响 |
| **验收** | 表结构创建成功；迁移后 PG 中行数 = JSON 中数量（35 课程/12 模块/802 chunks） |

### Phase 2: DB Becomes Source of Truth

| 项 | 内容 |
|----|------|
| **做什么** | 后端课程 API 从 PG 读取（替代 JSON）；前端课程数据从 API 获取（替代 import JSON） |
| **不做什么** | 不改 FAISS/BM25 索引（仍从文件加载） |
| **风险** | 中（前端数据源切换，可能遗漏字段） |
| **回滚** | 前端 revert 到 import JSON；后端 revert 到读 JSON |
| **验收** | 前端展示与 Phase 1 前完全一致；API 返回数据与 JSON 字段对齐 |

### Phase 3: FAISS Generated from DB

| 项 | 内容 |
|----|------|
| **做什么** | `build_index.py` 从 PG `document_chunks` 表读取（替代 chunks.json）；FAISS 索引与 DB 同步 |
| **不做什么** | 不改变检索逻辑（仍是 FAISS+BM25+RRF） |
| **风险** | 中（索引一致性） |
| **回滚** | `build_index.py` revert 到读 chunks.json |
| **验收** | 重建索引后，检索结果与 Phase 2 前完全一致；chunk_count = 802 |

### Phase 4: Remove Legacy JSON Dependency

| 项 | 内容 |
|----|------|
| **做什么** | 删除前端 `import kb-data.json`；删除 `backend/index/chunks.json`；JSON 仅作为初始导入种子文件保留 |
| **不做什么** | 不删除 `data/kb-data.json`（作为 backup） |
| **风险** | 低（前三阶段已验证 DB 数据完整） |
| **回滚** | git revert |
| **验收** | 系统全功能正常；JSON 不再被运行时引用 |

---

## 18. File Structure

### 18.1 Frontend

```
frontend/src/
├── app/
│   ├── AppShell.tsx
│   ├── router.tsx
│   └── providers.tsx
├── layouts/
│   ├── StudentLayout.tsx
│   ├── TeacherLayout.tsx
│   ├── AdminLayout.tsx
│   └── AuthLayout.tsx
├── pages/
│   ├── student/
│   ├── teacher/
│   ├── admin/
│   └── auth/
├── features/
│   ├── ai-tutor/
│   ├── course/
│   ├── knowledge/
│   └── analytics/
├── components/
│   ├── ui/
│   └── feedback/
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── course.service.ts
│   ├── rag.service.ts
│   └── admin.service.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useRBAC.ts
│   └── useDebounce.ts
├── stores/
│   ├── auth.store.ts
│   └── ui.store.ts
├── types/
│   ├── domain.ts
│   ├── api.ts
│   └── common.ts
└── styles/
    ├── tokens.css
    ├── global.css
    └── utilities.css
```

### 18.2 Backend

```
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── knowledge.py
│   │   ├── rag.py
│   │   ├── conversations.py
│   │   ├── learning.py
│   │   ├── admin.py
│   │   └── analytics.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   └── logging.py
│   ├── models/
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── knowledge.py
│   │   ├── conversation.py
│   │   ├── learning.py
│   │   └── governance.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── course.py
│   │   ├── knowledge.py
│   │   ├── rag.py
│   │   └── admin.py
│   ├── services/
│   │   ├── rag_service.py
│   │   ├── llm_service.py
│   │   ├── course_service.py
│   │   ├── knowledge_service.py
│   │   └── analytics_service.py
│   ├── repositories/
│   │   ├── user_repo.py
│   │   ├── course_repo.py
│   │   ├── knowledge_repo.py
│   │   └── conversation_repo.py
│   ├── rag/
│   │   ├── embedder.py
│   │   ├── vector_store.py
│   │   ├── bm25.py
│   │   ├── reranker.py
│   │   ├── fusion.py
│   │   ├── citation.py
│   │   └── context.py
│   ├── ingestion/
│   │   ├── parser.py
│   │   ├── chunker.py
│   │   └── build_index.py
│   ├── governance/
│   │   ├── workflow.py
│   │   └── review.py
│   ├── auth/
│   │   ├── jwt.py
│   │   └── rbac.py
│   └── analytics/
│       ├── tracker.py
│       └── aggregator.py
├── migrations/
├── tests/
└── requirements.txt
```

---

## 19. Implementation Dependency Graph

```
Phase 1 (Migration Preparation):
  (#1 修复 .env.example Key) ────────────────────────> 独立，立即
  (#2 PostgreSQL + SQLAlchemy + Alembic) ───────────> 独立
       │
       ├──> (#3 数据迁移 kb-data.json → PG)
       │         │
       │         └──> (#4 chunk UUID + faiss_idx 映射)
       │
       └──> (#5 JWT 认证) ──> (#6 RBAC 中间件)
                                     │
                                     └──> (#7 前端 Router + Auth Layout)

Phase 2 (DB Source of Truth):
  (#8 后端 API 从 PG 读取) ←── #3
  (#9 前端从 API 读取数据) ←── #7,#8

Phase 3 (RAG + 平台化):
  (#10 Reranker 集成) ←── #4                    ┐
  (#11 Provider 抽象) ←── #2                   ├── 可并行
  (#12 结构化日志) ←── #2                      │
  (#13 Citation Builder) ←── #4                │
  (#14 对话持久化) ←── #5,#7                   ┘
  (#15 管理后台骨架) ←── #6,#7
  (#16 文档上传+解析) ←── #8
  (#17 AI Tutor 一级页面) ←── #13,#14

Phase 4 (学院运营):
  (#18 知识审核流程) ←── #16
  (#19 版本管理+回滚) ←── #8
  (#20 数据统计看板) ←── #14
  (#21 学院 UI 品牌化) ←── #17
  (#22 Teacher Workspace) ←── #18
  (#23 学习进度/收藏/笔记) ←── #9
  (#24 前端搜索接后端) ←── #9

可并行的关键路径:
  Path A: #2→#3→#4→#8→#9 (数据库线)
  Path B: #5→#6→#7 (认证线)
  Path C: #10,#11,#12 (RAG增强线)
  Path D: #13→#17 (Citation+AI Tutor线)
  Path E: #14→#15 (对话+管理后台线)

  A 和 B 完全并行。
  C 和 D 依赖 A。
  E 依赖 A 和 B。
```

---

## 20. Final Implementation Specification

### 开发人员施工指引

本规范覆盖了从数据库到前端的全部设计决策。开发人员拿到此文档后：

**不需要自行决定**：
- 数据库怎么设计 → Section 01（完整 DDL 级表结构）
- 关系怎么连 → Section 02（ER Diagram + 关系类型）
- 权限怎么设计 → Section 03（完整 RBAC Matrix）
- 知识怎么审核 → Section 04（状态机 + 权限 + 版本关系）
- 引用怎么设计 → Section 05（Citation 全链追溯 + SSE Schema）
- API 怎么设计 → Section 06-07（完整路由表 + 请求/响应格式 + SSE Event Schema）
- 页面怎么组织 → Section 08-09（Router + Layout + Page Spec）
- AI Tutor 怎么做 → Section 10（三栏布局 + 交互规格 + Citation 对应）
- Provider 怎么抽象 → Section 11（三个接口 + Registry + Fallback）
- VectorStore 怎么抽象 → Section 12（接口定义 + 当前实现）
- 设计系统怎么定 → Section 13（Tokens + 组件规格 + 风格关键词）
- 安全怎么做 → Section 14（13 项安全规范）
- 日志怎么记 → Section 15（日志格式 + 类型 + Metrics）
- 评测怎么做 → Section 16（评测集 + 指标 + 流程）
- 迁移怎么做 → Section 17（4 阶段 + 风险 + 回滚 + 验收）
- 目录怎么放 → Section 18（前后端完整目录树）
- 先做什么后做什么 → Section 19（Dependency Graph + 并行路径）

**可以直接进入 Coding。**

### 实施顺序建议

```
Week 1: Phase 1
  - 修复 .env.example
  - PostgreSQL + 表结构 + 迁移
  - JWT + RBAC
  - 前端 Router + Login

Week 2: Phase 2-3 (并行)
  Path A: 后端 API 从 PG 读取 → 前端从 API 读取
  Path C: Reranker + Provider 抽象 + 日志
  Path D: Citation Builder → AI Tutor 页面

Week 3: Phase 3-4
  - 管理后台骨架
  - 文档上传 + 解析
  - 对话持久化
  - 知识审核流程

Week 4: Phase 4
  - 版本管理 + 回滚
  - 数据统计看板
  - 学院 UI 品牌化
  - Teacher Workspace
  - 学习进度/收藏/笔记
  - 前端搜索接后端
```

### 验收标准

| Phase | 验收项 |
|-------|--------|
| Phase 1 | PG 表结构完整；数据迁移行数一致；JWT 登录可用；RBAC 拦截越权 |
| Phase 2 | 前端从 API 读取，展示与 JSON 时代一致；FAISS 从 DB 重建结果一致 |
| Phase 3 | RAG 回答含 [1][2] 引用；点击可看原文；对话刷新不丢失；Reranker 集成；LLM 可切换 |
| Phase 4 | 审核全流程可用；版本可回滚；统计看板有数据；UI 有学院品牌 |

---

**Implementation Specification 输出完毕。**
