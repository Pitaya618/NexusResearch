# -*- coding: utf-8 -*-
"""
配置 AI Provider 并验证连通性。

用法：
  python setup_provider.py

支持 OpenAI / DeepSeek / Moonshot / 任何 OpenAI 兼容服务。
API Key 加密后存入数据库，之后即可在前端 AI 对话中使用。
"""
import getpass
import json
import sys
import urllib.error
import urllib.request

from app.core.config import settings
from app.db.session import AsyncSessionLocal, init_db, engine
from app.db.repositories import provider_repo
from app.utils.crypto import encrypt
import asyncio

# 预设 Provider 模板
PROVIDERS = {
    "1": {
        "id": "deepseek",
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "compatibility": "openai",
        "default_model": "deepseek-chat",
    },
    "2": {
        "id": "openai",
        "name": "OpenAI",
        "base_url": "",  # 官方默认
        "compatibility": "openai",
        "default_model": "gpt-4o-mini",
    },
    "3": {
        "id": "moonshot",
        "name": "Moonshot (Kimi)",
        "base_url": "https://api.moonshot.cn/v1",
        "compatibility": "openai",
        "default_model": "moonshot-v1-8k",
    },
    "4": {
        "id": "custom",
        "name": "自定义 (OpenAI 兼容)",
        "base_url": "",
        "compatibility": "openai",
        "default_model": "",
    },
}


def choose_provider():
    print("\n=== 选择 AI Provider ===")
    for key, p in PROVIDERS.items():
        print(f"  {key}. {p['name']}")
    choice = input("\n输入序号 (1-4): ").strip()
    return PROVIDERS.get(choice, PROVIDERS["1"])


async def main():
    await init_db()

    # 1. 选 Provider
    template = choose_provider()

    # 2. 录入 API Key
    print(f"\n=== 配置 {template['name']} ===")
    if template["id"] == "custom":
        base_url = input("Base URL (如 https://api.example.com/v1): ").strip()
        template["base_url"] = base_url
    print(f"Base URL: {template['base_url'] or '(官方默认)'}")
    api_key = getpass.getpass("API Key (输入不可见): ").strip()
    if not api_key:
        print("✗ API Key 不能为空")
        return

    model_name = input(f"模型名 (回车用默认 {template['default_model']}): ").strip()
    if not model_name:
        model_name = template["default_model"]
    if not model_name:
        model_name = input("请输入模型名: ").strip()

    # 3. 写入数据库（加密 API Key）
    async with AsyncSessionLocal() as session:
        await provider_repo.upsert_provider(
            session,
            id=template["id"],
            name=template["name"],
            base_url=template["base_url"],
            api_key_encrypted=encrypt(api_key),
            compatibility_type=template["compatibility"],
            connection_status="connected",
            is_default=True,
        )
        # 设置模块模型分配（所有模块用同一模型）
        model_id = f"{template['id']}:{model_name}"
        for module in ("literature", "reader", "essay", "paper"):
            await provider_repo.set_assignment(session, module, model_id, "默认")
        print(f"\n✓ Provider 已保存（API Key 已加密）")
        print(f"✓ 模块模型分配: {model_id}")

    # 4. 验证连通性（发一条测试消息）
    print(f"\n=== 验证连通性 ===")
    test_ok = await test_chat(template, api_key, model_name)
    if test_ok:
        print(f"\n🎉 验证成功！现在可以启动前端使用 AI 对话了。")
        print(f"   后端: cd server && .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000")
        print(f"   前端: pnpm dev  (访问 http://localhost:5173)")
    else:
        print(f"\n⚠ 连通性测试失败，但配置已保存。请检查 API Key / 网络 / 代理。")

    await engine.dispose()


async def test_chat(template, api_key, model_name):
    """直接调用 Provider API 验证连通性。"""
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage

    kwargs = {"model": model_name, "api_key": api_key, "streaming": False}
    if template["base_url"]:
        kwargs["base_url"] = template["base_url"]

    try:
        model = ChatOpenAI(**kwargs)
        resp = await model.ainvoke([HumanMessage(content='回复"OK"两个字符即可')])
        content = resp.content if isinstance(resp.content, str) else str(resp.content)
        print(f"  模型回复: {content[:80]}")
        return True
    except Exception as e:
        print(f"  ✗ 错误: {e}")
        return False


if __name__ == "__main__":
    asyncio.run(main())
