FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码与数据
COPY . .

# 预下载 bge-m3 向量模型（约 2.2GB，构建时下载一次）
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"

# 构建向量索引（FAISS + BM25）
RUN python -m app.ingestion.build_index || echo "FAISS index build skipped (using FastGPT for vector store)"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
