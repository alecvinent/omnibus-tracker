import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "api_keys.db"
DB_PATH = Path(os.getenv("API_KEYS_DB_PATH", str(_DEFAULT_DB_PATH)))


def get_db_path() -> Path:
    """Path dinámico del SQLite: respeta `API_KEYS_DB_PATH` al correr."""
    return Path(os.getenv("API_KEYS_DB_PATH", str(DB_PATH)))


def _get_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
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


def create_api_key_with_id(name: str, key_id: str) -> tuple[str, str]:
    """Like create_api_key but uses the given key_id. Used by scripts/CLI."""
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


def get_api_key(key_id: str) -> dict | None:
    """Return the full row for key_id regardless of revocation state."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM api_keys WHERE id = ?",
            (key_id,),
        ).fetchone()
    return dict(row) if row else None


def rotate_api_key(old_id: str) -> tuple[dict, str]:
    """Revoca la key con `old_id` y crea una nueva (heredando su nombre).

    Returns (new_row_without_key_hash_as_dict, plain_key) — the plain key is
    shown only once by the caller. Raises KeyError if old_id does not exist
    or is already revoked.
    """
    with _get_connection() as conn:
        old = conn.execute(
            "SELECT name FROM api_keys WHERE id = ? AND revoked_at IS NULL",
            (old_id,),
        ).fetchone()
        if old is None:
            raise KeyError(old_id)
        name = old["name"]
        now = datetime.now(timezone.utc).isoformat()
        new_key_id = new_plain_key = None
        for _ in range(5):
            candidate_id = secrets.token_urlsafe(16)
            candidate_key = f"omni_{secrets.token_urlsafe(32)}"
            try:
                conn.execute(
                    "INSERT INTO api_keys (id, name, key_hash, created_at) VALUES (?, ?, ?, ?)",
                    (candidate_id, name, _hash_key(candidate_key), now),
                )
            except sqlite3.IntegrityError:
                continue
            new_key_id, new_plain_key = candidate_id, candidate_key
            break
        if new_key_id is None:
            raise RuntimeError("No se pudo crear una key rotada (colisiones).")
        # Revocar la anterior en la misma transacción.
        conn.execute(
            "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
            (now, old_id),
        )
    return {"id": new_key_id, "name": name, "created_at": now}, new_plain_key
