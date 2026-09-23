"""RAG API 路由：流式问答 + 纯检索。"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.rag_service import get_rag_service

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    history: list[dict[str, str]] | None = None


class SearchRequest(BaseModel):
    query: str
    top_k: int | None = None


@router.get("/rag/health")
def rag_health():
    svc = get_rag_service()
    return {"index_loaded": svc.index_loaded, "chunk_count": svc.chunk_count}


@router.post("/rag/search")
def rag_search(req: SearchRequest):
    """纯检索：返回相关课程片段，不调用 LLM。"""
    svc = get_rag_service()
    results = svc.search(req.query, req.top_k)
    return {"results": results}


@router.post("/rag/stream")
def rag_stream(req: QueryRequest):
    """流式问答：SSE 输出，含回答内容与来源引用。"""
    svc = get_rag_service()
    return StreamingResponse(
        svc.stream_answer(req.query, req.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )

