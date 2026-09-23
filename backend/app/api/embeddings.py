"""OpenAI 兼容的 Embeddings API：复用本地 bge-m3 模型。
供 FastGPT 调用，作为知识库向量化后端。
"""
from pydantic import BaseModel, Field, ConfigDict
from fastapi import APIRouter, Request

from app.core.embedder import embed_texts

router = APIRouter()


class EmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    model: str = "bge-m3"
    input: str | list[str]
    encoding_format: str | None = None


class EmbeddingData(BaseModel):
    object: str = "embedding"
    index: int
    embedding: list[float]


class EmbeddingResponse(BaseModel):
    object: str = "list"
    data: list[EmbeddingData]
    model: str
    usage: dict = Field(default_factory=lambda: {"prompt_tokens": 0, "total_tokens": 0})


@router.post("/v1/embeddings")
async def create_embeddings(request: Request) -> EmbeddingResponse:
    raw = await request.body()
    print("[EMB] len=%d body=%s" % (len(raw), raw[:300]), flush=True)
    req = EmbeddingRequest.model_validate_json(raw)
    """生成文本向量，兼容 OpenAI /v1/embeddings 接口。"""
    texts = [req.input] if isinstance(req.input, str) else req.input
    vectors = embed_texts(texts, batch_size=min(len(texts), 32))
    data = [
        EmbeddingData(index=i, embedding=vectors[i].tolist())
        for i in range(len(texts))
    ]
    return EmbeddingResponse(data=data, model=req.model)
