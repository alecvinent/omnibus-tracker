import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(os.getenv("API_KEYS_DB_PATH", "/data/api_keys.db"))


def _get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                revoked_at TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)"
        )


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def create_api_key(name: str) -> tuple[str, str]:
    """Return (key_id, plain_key). The plain key is shown only once."""
    key_id = secrets.token_urlsafe(16)
    plain_key = f"omni_{secrets.token_urlsafe(32)}"
    key_hash = _hash_key(plain_key)
    now = datetime.now(timezone.utc).isoformat()
    with _get_connection() as conn:
        conn.execute(
            "INSERT INTO api_keys (id, name, key_hash, created_at) VALUES (?, ?, ?, ?)",
            (key_id, name, key_hash, now),
        )
    return key_id, plain_key


def list_api_keys(active_only: bool = True) -> list[dict]:
    with _get_connection() as conn:
        if active_only:
            rows = conn.execute(
                "SELECT id, name, created_at, revoked_at FROM api_keys WHERE revoked_at IS NULL ORDER BY created_at DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, name, created_at, revoked_at FROM api_keys ORDER BY created_at DESC"
            ).fetchall()
    return [dict(row) for row in rows]


def revoke_api_key(key_id: str) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    with _get_connection() as conn:
        cursor = conn.execute(
            "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
            (now, key_id),
        )
    return cursor.rowcount > 0


def is_valid_api_key(key: str) -> bool:
    key_hash = _hash_key(key)
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL",
            (key_hash,),
        ).fetchone()
    return row is not None
