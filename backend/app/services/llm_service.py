"""LLM 服务：调用 DeepSeek API 流式生成回答，基于检索到的课程内容。"""
from __future__ import annotations
import json
from typing import Any, Iterator

import httpx

from app.core.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """你是「MICE 会展专业知识库」的 AI 助教，基于 35 讲真实会展专业课程内容回答问题。

规则：
1. 严格基于【参考内容】回答，不要编造课程中没有的信息。
2. 如果参考内容不足以回答问题，请明确说「根据现有课程内容，这个问题暂无直接答案」，并给出最相关的课程方向建议。
3. 回答要专业、条理清晰，适当使用要点列表。
4. 回答末尾附上参考来源（课程编号+标题）。
5. 使用中文回答。"""


def _build_context(chunks: list[dict[str, Any]]) -> str:
    """将检索结果拼接为上下文文本。"""
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(
            f"[参考{i}] 课程{c['course_id']}《{c['course_title']}》"
            f" - {c['section_title']}\n{c['text']}"
        )
    return "\n\n".join(parts)


def _build_messages(
    query: str,
    chunks: list[dict[str, Any]],
    history: list[dict[str, str]],
) -> list[dict[str, str]]:
    context = _build_context(chunks)
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # 加入历史对话（最多保留最近 6 轮）
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})

    user_msg = f"【参考内容】\n{context}\n\n【用户问题】\n{query}"
    messages.append({"role": "user", "content": user_msg})
    return messages


def _iter_sse_lines(resp) -> Iterator[str]:
    """从流式响应中按 UTF-8 解码并逐行产出 SSE data 行。"""
    buf = b""
    for chunk in resp.iter_bytes():
        buf += chunk
        while b"\n" in buf:
            line, buf = buf.split(b"\n", 1)
            line = line.rstrip(b"\r")
            if not line:
                continue
            yield line.decode("utf-8", errors="replace")


def generate_answer_stream(
    query: str,
    chunks: list[dict[str, Any]],
    history: list[dict[str, str]],
) -> Iterator[str]:
    """流式生成回答，SSE 格式输出。"""
    sources = [
        {
            "course_id": c["course_id"],
            "course_title": c["course_title"],
            "section_title": c["section_title"],
            "score": c["score"],
        }
        for c in chunks
    ]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources}, ensure_ascii=False)}\n\n"

    if not chunks:
        yield f"data: {json.dumps({'type': 'content', 'text': '根据现有课程内容，暂未检索到相关信息。请尝试其他关键词。'}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
        return

    if not settings.llm_available:
        fallback = "（AI 生成服务未配置，以下为检索到的课程片段摘要）\n\n"
        for c in chunks[:3]:
            fallback += f"📌 课程{c['course_id']}《{c['course_title']}》\n{c['text'][:200]}...\n\n"
        yield f"data: {json.dumps({'type': 'content', 'text': fallback}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
        return

    messages = _build_messages(query, chunks, history)
    url = f"{settings.deepseek_base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.deepseek_api_key}",
        "Content-Type": "application/json; charset=utf-8",
    }
    payload = {
        "model": settings.deepseek_model,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    try:
        with httpx.Client(timeout=120.0) as client:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            with client.stream("POST", url, headers=headers, content=body) as resp:
                resp.raise_for_status()
                for line in _iter_sse_lines(resp):
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        delta = obj.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield f"data: {json.dumps({'type': 'content', 'text': content}, ensure_ascii=False)}\n\n"
                    except json.JSONDecodeError:
                        continue
    except httpx.HTTPError as e:
        yield f"data: {json.dumps({'type': 'error', 'text': f'DeepSeek API 调用失败：{str(e)}'}, ensure_ascii=False)}\n\n"

    yield "data: [DONE]\n\n"

