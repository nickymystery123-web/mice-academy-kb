"""全局配置：从环境变量 / .env 读取，支持 DEEPSEEK_API_KEY 专用变量名。"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- DeepSeek LLM ---
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    deepseek_base_url: str = "https://api.deepseek.com/v1"

    # --- 向量模型 ---
    embedding_model: str = "BAAI/bge-m3"

    # --- 服务 ---
    backend_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- 检索参数 ---
    vector_top_k: int = 20
    bm25_top_k: int = 20
    final_top_k: int = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def llm_available(self) -> bool:
        return bool(self.deepseek_api_key and self.deepseek_api_key != "sk-your-deepseek-api-key-here")


@lru_cache
def get_settings() -> Settings:
    return Settings()
