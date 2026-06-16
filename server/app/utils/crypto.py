"""API Key 加密存储。

用 Fernet（AES-128-CBC + HMAC）对称加密。主密钥从 settings.secret_key 派生；
开发期若 secret_key 为空则用固定占位密钥（仅本地，不安全，生产期必须注入）。
"""
from __future__ import annotations

import hashlib
import base64

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _derive_key() -> bytes:
    """从 secret_key 派生 32 字节 Fernet 密钥。"""
    secret = settings.secret_key or "nexusresearch-dev-insecure-key-change-me"
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_derive_key())
    return _fernet


def encrypt(plaintext: str) -> str:
    """加密明文，返回 base64 密文字符串。"""
    return _get_fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt(ciphertext: str) -> str:
    """解密密文，返回明文。失败返回空串（不抛异常，避免泄露信息）。"""
    if not ciphertext:
        return ""
    try:
        return _get_fernet().decrypt(ciphertext.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError):
        logger.warning("api_key_decrypt_failed")
        return ""
