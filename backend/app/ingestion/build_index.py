"""建库脚本：读取 kb-data.json → 分块 → bge-m3 向量化 → FAISS + BM25 索引。

用法：
    cd backend
    python -m app.ingestion.build_index
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

import numpy as np

# 确保 backend 目录在 sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.core.config import get_settings
from app.core.embedder import embed_texts, get_model
from app.core.vector_store import VectorStore, INDEX_DIR
from app.core.bm25 import tokenize
from app.ingestion.chunker import chunk_all_courses

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
KB_DATA_PATH = DATA_DIR / "kb-data.json"
BM25_CORPUS_PATH = INDEX_DIR / "bm25_corpus.json"


def build():
    print(f"[1/5] 读取课程数据: {KB_DATA_PATH}")
    with open(KB_DATA_PATH, "r", encoding="utf-8") as f:
        kb_data = json.load(f)
    print(f"      共 {len(kb_data['courses'])} 讲课程")

    print("[2/5] 文档分块...")
    chunks = chunk_all_courses(kb_data)
    print(f"      切分为 {len(chunks)} 个 chunk")

    print(f"[3/5] 加载向量模型: {get_settings().embedding_model}")
    get_model()  # 预加载
    texts = [c["text"] for c in chunks]

    print("[4/5] 生成向量（首次下载 bge-m3 约 2.2GB，请耐心等待）...")
    embeddings = embed_texts(texts, batch_size=16)
    print(f"      向量维度: {embeddings.shape[1]}, 数量: {embeddings.shape[0]}")

    print("[5/5] 构建 FAISS + BM25 索引...")
    vector_store = VectorStore()
    vector_store.build(embeddings, chunks)

    # 保存 BM25 分词语料
    tokenized = [tokenize(t) for t in texts]
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    with open(BM25_CORPUS_PATH, "w", encoding="utf-8") as f:
        json.dump(tokenized, f, ensure_ascii=False)

    print(f"\n✅ 索引构建完成！")
    print(f"   chunks: {len(chunks)}")
    print(f"   FAISS: {INDEX_DIR / 'faiss.index'}")
    print(f"   chunks.json: {INDEX_DIR / 'chunks.json'}")
    print(f"   bm25_corpus.json: {BM25_CORPUS_PATH}")


if __name__ == "__main__":
    build()
