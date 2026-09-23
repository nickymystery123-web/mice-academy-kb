"""将 D:\\MICE-KB\\data\\kb-data.json 中的 35 门课程导入 FastGPT 知识库。

用法:
    set FASTGPT_APIKEY=xxx   (或在脚本同目录 .env 配置)
    python import_kb.py

每门课导入为一个 collection，名称格式: [模块X] 01-课程标题
分块参数对齐现有 chunker.py: chunkSize=800, 优先按 \\n## 切分。
"""
from __future__ import annotations
import json
import os
import sys
import time
from pathlib import Path

import httpx

# ---- 配置 ----
BASE = os.getenv("FASTGPT_BASE", "http://localhost:3001")
APIKEY = os.getenv("FASTGPT_APIKEY", "")
KB_PATH = Path(__file__).resolve().parents[2] / "data" / "kb-data.json"

DATASET_NAME = "MICE会展专业课程库"
CHUNK_SIZE = 800
CHUNK_SPLITTER = "\n## "


def log(msg: str) -> None:
    print(f"[import] {msg}", flush=True)


def api(method: str, path: str, **kwargs) -> dict:
    """调用 FastGPT API，自动带 Authorization。"""
    url = f"{BASE}{path}"
    headers = {"Authorization": f"Bearer {APIKEY}"}
    resp = httpx.request(method, url, headers=headers, timeout=120, trust_env=False, **kwargs)
    try:
        data = resp.json()
    except Exception:
        data = {"raw": resp.text}
    if resp.status_code >= 400:
        log(f"API ERROR {resp.status_code} {method} {path}: {data}")
    return data


def get_or_create_dataset() -> str:
    """获取已存在的同名知识库，不存在则创建。"""
    # 列出根目录知识库
    data = api("POST", "/api/core/dataset/list", json={"parentId": ""})
    datasets = data.get("data", [])
    for ds in datasets:
        if ds.get("name") == DATASET_NAME:
            log(f"复用已有知识库: {ds['_id']}")
            return ds["_id"]
    # 创建
    data = api("POST", "/api/core/dataset/create", json={
        "parentId": None,
        "type": "dataset",
        "name": DATASET_NAME,
        "intro": "35讲真实会展专业课程纪要,12模块/31讲师/58.8万字",
        "vectorModel": "bge-m3",
        "agentModel": "deepseek-chat",
        "vlmModel": "",
    })
    dataset_id = data.get("data")
    if not dataset_id:
        raise RuntimeError(f"创建知识库失败: {data}")
    log(f"创建知识库成功: {dataset_id}")
    return dataset_id


def collection_exists(dataset_id: str, name: str) -> bool:
    """检查 collection 是否已存在（幂等）。"""
    data = api("POST", "/api/core/dataset/collection/listV2", json={
        "datasetId": dataset_id,
        "pageNum": 1,
        "pageSize": 100,
    })
    collections = data.get("data", {}).get("data", [])
    return any(c.get("name") == name for c in collections)


def import_course(dataset_id: str, course: dict) -> None:
    """导入一门课为一个 text collection。"""
    cid = course["id"]
    module = course.get("module", "")
    title = course.get("title", "")
    name = f"[{module}] {cid}-{title}"

    if collection_exists(dataset_id, name):
        log(f"跳过(已存在): {name}")
        return

    payload = {
        "datasetId": dataset_id,
        "trainingType": "chunk",
        "chunkSettingMode": "custom",
        "chunkSplitMode": "char",
        "chunkSize": CHUNK_SIZE,
        "chunkSplitter": CHUNK_SPLITTER,
        "name": name,
        "text": course.get("content", ""),
    }
    data = api("POST", "/api/core/dataset/collection/create/text", json=payload)
    if data.get("code") == 200:
        log(f"导入成功: {name}")
    else:
        log(f"导入失败: {name} -> {data}")


def main() -> int:
    if not APIKEY:
        log("ERROR: 请设置 FASTGPT_APIKEY 环境变量")
        return 1

    if not KB_PATH.exists():
        log(f"ERROR: 找不到数据文件: {KB_PATH}")
        return 1

    kb = json.loads(KB_PATH.read_text(encoding="utf-8"))
    courses = kb["courses"]
    log(f"共 {len(courses)} 门课程待导入")

    dataset_id = get_or_create_dataset()
    log(f"知识库 ID: {dataset_id}")

    for i, course in enumerate(courses, 1):
        log(f"[{i}/{len(courses)}] 导入课程 {course['id']}")
        import_course(dataset_id, course)
        time.sleep(0.5)  # 避免请求过快

    log("全部导入完成。请到 FastGPT 后台确认 35 个 collection 状态为 active。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
