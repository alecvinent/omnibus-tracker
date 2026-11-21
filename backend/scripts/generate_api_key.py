"""Genera una nueva API key y la inserta en el SQLite local de API keys.

Uso:
    python backend/scripts/generate_api_key.py --name <nombre> [--output <archivo>]

El valor de la key se muestra una sola vez: por stdout (o al archivo dado
con `--output`). Se respeta `API_KEYS_DB_PATH` y el default
`backend/data/api_keys.db`.
"""

from __future__ import annotations

import argparse
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import db as db_module
from app.db import create_api_key_with_id, is_valid_api_key


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Genera una API key de Ómnibus Tracker y la guarda en el SQLite de API keys "
            "(API_KEYS_DB_PATH o default backend/data/api_keys.db)."
        )
    )
    parser.add_argument("--name", required=True, help="Nombre descriptivo de la key.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Archivo donde guardar la key (por defecto: stdout).",
    )
    args = parser.parse_args(argv)

    name = args.name.strip()
    if not name:
        parser.error("--name no debe estar vacío")

    # Redirigir el SQLite para honorar API_KEYS_DB_PATH seteando el global de app.db
    db_path = db_module.get_db_path()
    db_module.DB_PATH = db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    db_module.init_db()

    key_id = secrets.token_urlsafe(16)
    _id, plain_key = create_api_key_with_id(name, key_id)
    assert is_valid_api_key(plain_key), "la key generada no pasa la validación de hash"

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(plain_key + "\n", encoding="utf-8")
    else:
        print(plain_key)

    print(f"Key guardada en {db_path} (id={_id}). Muestra el valor una sola vez.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
