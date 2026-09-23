"""向量模型封装：bge-m3，本地运行，支持中英文。"""
from __future__ import annotations
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        settings = get_settings()
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str], batch_size: int = 32) -> np.ndarray:
    """批量生成向量。bge-m3 输出已归一化，用内积即余弦相似度。"""
    model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
    )
    return np.array(embeddings, dtype=np.float32)


def embed_query(text: str) -> np.ndarray:
    """单条查询向量化。"""
    return embed_texts([text], batch_size=1)[0]
