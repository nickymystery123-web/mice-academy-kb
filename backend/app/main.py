"""FastAPI 入口：薄 main 层，只负责 HTTP 边界、CORS、路由注册。"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api import rag, embeddings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时预加载索引（懒加载亦可，这里显式预热）
    from app.services.rag_service import get_rag_service
    get_rag_service()
    yield


app = FastAPI(
    title="MICE 会展专业知识库 - AI 检索后端",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api", tags=["RAG"])
app.include_router(embeddings.router, prefix="/api", tags=["Embeddings"])


@app.get("/health")
def health():
    from app.services.rag_service import get_rag_service
    svc = get_rag_service()
    return {
        "status": "ok",
        "index_loaded": svc.index_loaded,
        "chunk_count": svc.chunk_count,
        "llm_available": settings.llm_available,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.backend_port, reload=True)
