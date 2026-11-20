# Backend

FastAPI inicial. Mantener aquí las credenciales privadas de la API de la IMM; nunca incluirlas en `EXPO_PUBLIC_*`.

## Endpoints actuales

- `GET /health`
- `GET /v1/geocode/search?q=...&limit=6&cityId=...` — búsqueda de lugares en la ciudad configurada (Nominatim mediado por servidor)

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### WSL / Linux

En Ubuntu el venv a veces se crea **sin pip** (`No module named pip`). Tras `source .venv/bin/activate`, el comando `pip` del sistema dispara **externally-managed-environment**.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m ensurepip --upgrade    # solo si falta pip
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Usá siempre `python -m pip`, no el `pip` global. No uses la carpeta `backend/.env` como venv (confunde con variables de entorno); el entorno virtual correcto es `backend/.venv`.

Próxima implementación:
1. Cliente IMM con autenticación en servidor.
2. Descarga/validación periódica del GTFS.
3. OpenTripPlanner como motor de itinerarios.
4. Adaptador de ETA y posición de vehículos.
5. Caché y límites de consulta.
