"""BM25 关键词检索：jieba 中文分词 + rank_bm25。"""
from __future__ import annotations
import jieba
from rank_bm25 import BM25Okapi

# 关闭 jieba 的调试日志
jieba.setLogLevel(jieba.logging.WARNING)


def tokenize(text: str) -> list[str]:
    """中文分词：jieba 精确模式，过滤单字和空白。"""
    return [w for w in jieba.lcut(text) if w.strip() and len(w.strip()) > 1]


class BM25Index:
    def __init__(self) -> None:
        self.bm25: BM25Okapi | None = None
        self.tokenized_corpus: list[list[str]] = []

    def build(self, texts: list[str]) -> None:
        self.tokenized_corpus = [tokenize(t) for t in texts]
        self.bm25 = BM25Okapi(self.tokenized_corpus)

    def search(self, query: str, top_k: int) -> list[tuple[int, float]]:
        if self.bm25 is None:
            return []
        tokens = tokenize(query)
        scores = self.bm25.get_scores(tokens)
        # 按分数降序，取 top_k
        indexed = [(i, float(s)) for i, s in enumerate(scores)]
        indexed.sort(key=lambda x: x[1], reverse=True)
        # 只返回分数 > 0 的
        return [(i, s) for i, s in indexed[:top_k] if s > 0]
