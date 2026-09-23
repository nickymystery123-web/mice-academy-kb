"""FAISS 向量库封装：IndexFlatIP（内积，向量已归一化时等价余弦相似度）。"""
from __future__ import annotations
import json
from pathlib import Path

import faiss
import numpy as np

from app.core.config import get_settings

INDEX_DIR = Path(__file__).resolve().parents[2] / "index"
FAISS_INDEX_PATH = INDEX_DIR / "faiss.index"
CHUNKS_PATH = INDEX_DIR / "chunks.json"


class VectorStore:
    def __init__(self) -> None:
        self.index: faiss.Index | None = None
        self.chunks: list[dict] = []

    def build(self, embeddings: np.ndarray, chunks: list[dict]) -> None:
        """构建索引。"""
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)
        self.chunks = chunks
        self.save()

    def save(self) -> None:
        INDEX_DIR.mkdir(parents=True, exist_ok=True)
        if self.index is not None:
            faiss.write_index(self.index, str(FAISS_INDEX_PATH))
        with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)

    def load(self) -> bool:
        """从磁盘加载索引。成功返回 True，文件不存在返回 False。"""
        if not FAISS_INDEX_PATH.exists() or not CHUNKS_PATH.exists():
            return False
        self.index = faiss.read_index(str(FAISS_INDEX_PATH))
        with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)
        return True

    def search(self, query_vec: np.ndarray, top_k: int) -> list[tuple[int, float]]:
        """向量检索，返回 [(chunk_idx, score), ...]。"""
        if self.index is None:
            return []
        scores, indices = self.index.search(query_vec.reshape(1, -1), top_k)
        results: list[tuple[int, float]] = []
        for idx, score in zip(indices[0], scores[0]):
            if idx >= 0:
                results.append((int(idx), float(score)))
        return results
