"""RAG 服务：混合检索（向量 + BM25）+ RRF 重排 + LLM 流式生成。"""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import get_settings
from app.core.embedder import embed_query
from app.core.vector_store import VectorStore, INDEX_DIR
from app.core.bm25 import BM25Index

logger = logging.getLogger(__name__)
settings = get_settings()

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
KB_DATA_PATH = DATA_DIR / "kb-data.json"
BM25_CORPUS_PATH = INDEX_DIR / "bm25_corpus.json"


def _rrf(rankings: list[list[int]], k: int = 60) -> dict[int, float]:
    """RRF (Reciprocal Rank Fusion) 融合多个排序列表。"""
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, idx in enumerate(ranking):
            scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    return scores


class RAGService:
    def __init__(self) -> None:
        self._chunks: list[dict[str, Any]] = []
        self._vector_store = VectorStore()
        self._bm25 = BM25Index()
        self._index_loaded = False
        self._kb_data: dict[str, Any] = {}

    @property
    def index_loaded(self) -> bool:
        return self._index_loaded

    @property
    def chunk_count(self) -> int:
        return len(self._chunks)

    def load_kb_data(self) -> dict[str, Any]:
        if not self._kb_data:
            with open(KB_DATA_PATH, "r", encoding="utf-8") as f:
                self._kb_data = json.load(f)
        return self._kb_data

    def ensure_index(self) -> None:
        """加载 FAISS + BM25 索引；不存在则自动构建。"""
        if self._index_loaded:
            return
        if not self._vector_store.load():
            logger.info("索引不存在，开始自动构建...")
            from app.ingestion.build_index import build
            build()
            self._vector_store.load()
        self._chunks = self._vector_store.chunks
        if BM25_CORPUS_PATH.exists():
            with open(BM25_CORPUS_PATH, "r", encoding="utf-8") as f:
                tokenized = json.load(f)
            self._bm25.tokenized_corpus = tokenized
            self._bm25.bm25 = BM25Okapi_from_corpus(tokenized)
        self._index_loaded = True
        logger.info("索引加载完成，共 %d 个 chunk", len(self._chunks))

    def search(self, query: str, top_k: int | None = None) -> list[dict[str, Any]]:
        """混合检索：向量召回 + BM25 召回 → RRF 融合重排序。"""
        if not self._index_loaded:
            self.ensure_index()
        if not self._index_loaded:
            return []

        k = top_k or settings.final_top_k
        vec_top = settings.vector_top_k
        bm25_top = settings.bm25_top_k

        q_vec = embed_query(query)
        vec_results = self._vector_store.search(q_vec, vec_top)
        vec_indices = [idx for idx, _ in vec_results]

        bm25_results = self._bm25.search(query, bm25_top)
        bm25_indices = [idx for idx, _ in bm25_results]

        fused = _rrf([vec_indices, bm25_indices])
        sorted_indices = sorted(fused.items(), key=lambda x: x[1], reverse=True)[:k]

        results: list[dict[str, Any]] = []
        for idx, score in sorted_indices:
            chunk = self._chunks[idx]
            results.append({
                "chunk_idx": idx,
                "score": round(score, 4),
                "course_id": chunk["course_id"],
                "course_title": chunk["course_title"],
                "module": chunk["module"],
                "module_name": chunk["module_name"],
                "section_title": chunk["section_title"],
                "text": chunk["text"],
            })
        return results

    def stream_answer(self, query: str, history: list[dict[str, str]] | None = None):
        """流式生成回答（SSE）。"""
        from app.services.llm_service import generate_answer_stream
        yield from generate_answer_stream(query, self.search(query), history or [])


def BM25Okapi_from_corpus(tokenized_corpus: list[list[str]]):
    from rank_bm25 import BM25Okapi
    return BM25Okapi(tokenized_corpus)


_singleton: RAGService | None = None


def get_rag_service() -> RAGService:
    global _singleton
    if _singleton is None:
        _singleton = RAGService()
        _singleton.ensure_index()
    return _singleton
