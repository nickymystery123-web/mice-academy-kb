"""文档分块：按 Markdown 二级标题切分，过长则按字数二次切分。"""
import re
from typing import Any

# 二级标题正则：## 标题
H2_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)
# 三级标题
H3_RE = re.compile(r"^###\s+(.+)$", re.MULTILINE)

MAX_CHUNK_CHARS = 800  # 单块最大字符数
OVERLAP_CHARS = 100    # 块间重叠字符数


def _strip_markdown_symbols(text: str) -> str:
    """去除 Markdown 语法符号，得到纯文本用于检索。"""
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\|.*\|\s*$", lambda m: m.group(0).replace("|", " "), text, flags=re.MULTILINE)
    text = re.sub(r"[*_~]{1,3}([^*_~]+)[*_~]{1,3}", r"\1", text)
    text = re.sub(r"[>#]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _split_long_text(text: str, max_chars: int = MAX_CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> list[str]:
    """按字数切分长文本，保留重叠。"""
    if len(text) <= max_chars:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def chunk_course(course: dict[str, Any]) -> list[dict[str, Any]]:
    """将单门课程切分为多个 chunk。"""
    content = course.get("content", "")
    course_id = course.get("id", "")
    course_title = course.get("shortTitle") or course.get("title", "")
    module = course.get("module", "")
    module_name = course.get("moduleName", "")

    # 按二级标题切分
    h2_matches = list(H2_RE.finditer(content))
    sections: list[tuple[str, str]] = []  # (section_title, section_text)

    if not h2_matches:
        # 无二级标题，整篇作为一块
        sections.append(("", content))
    else:
        for i, m in enumerate(h2_matches):
            sec_title = m.group(1).strip()
            sec_start = m.start()
            sec_end = h2_matches[i + 1].start() if i + 1 < len(h2_matches) else len(content)
            sec_text = content[sec_start:sec_end]
            sections.append((sec_title, sec_text))

    chunks: list[dict[str, Any]] = []
    for sec_title, sec_text in sections:
        # 去除 Markdown 符号后的纯文本
        plain = _strip_markdown_symbols(sec_text)
        if not plain:
            continue
        # 过长则二次切分
        for piece in _split_long_text(plain):
            chunks.append({
                "course_id": course_id,
                "course_title": course_title,
                "module": module,
                "module_name": module_name,
                "section_title": sec_title,
                "text": piece,
            })
    return chunks


def chunk_all_courses(kb_data: dict[str, Any]) -> list[dict[str, Any]]:
    """对全部课程分块。"""
    all_chunks: list[dict[str, Any]] = []
    for course in kb_data.get("courses", []):
        all_chunks.extend(chunk_course(course))
    return all_chunks
