import logging
import os
import sys
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config import get_settings
from database import AsyncSessionLocal
from dependencies.auth import SESSION_COOKIE_NAME
from routers import auth, contacts, activities, companies, events, dashboard, ai
from routers.auth import CSRF_COOKIE_NAME

settings = get_settings()

# ── Logging con rotación (A7) ──────────────────────────────────────────────
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
_file_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "datasales.log"),
    maxBytes=10 * 1024 * 1024,  # 10 MB
    backupCount=5,
    encoding="utf-8",
)
_file_handler.setFormatter(_formatter)
_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(_formatter)

_root = logging.getLogger()
_root.setLevel(logging.INFO)
_root.addHandler(_file_handler)
if not any(isinstance(h, logging.StreamHandler) and not isinstance(h, RotatingFileHandler) for h in _root.handlers):
    _root.addHandler(_stream_handler)

logger = logging.getLogger("datasales")


def _run_migrations() -> None:
    """Aplica migraciones Alembic al arrancar (B2).

    Usa un subproceso para evitar conflictos con el env.py async de Alembic
    cuando la app ya tiene un event loop activo.
    """
    import subprocess
    backend_dir = os.path.dirname(__file__)
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode == 0:
            logger.info("✅ Alembic migrations up to date")
        else:
            logger.error("⚠️  Alembic upgrade failed: %s", result.stderr.strip())
    except Exception as exc:
        logger.error("⚠️  Alembic upgrade error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("✅ MySQL connected — %s", settings.db_name)
    except Exception as exc:
        logger.error("❌ MySQL connection failed: %s", exc)
        sys.exit(1)
    if settings.is_production:
        _run_migrations()
    yield


# ── App (A4: docs deshabilitados en prod) ──────────────────────────────────
app = FastAPI(
    title="DatâSales API",
    version="1.0.0",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
    lifespan=lifespan,
)

# ── CORS (A3: restringido a métodos y headers reales) ──────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


# ── CSRF protection middleware (B1) ────────────────────────────────────────
CSRF_EXEMPT_PATHS = {"/auth/login", "/auth/logout"}
UNSAFE_METHODS = {"POST", "PATCH", "PUT", "DELETE"}


@app.middleware("http")
async def csrf_protect(request: Request, call_next):
    if request.method in UNSAFE_METHODS and request.url.path not in CSRF_EXEMPT_PATHS:
        # Solo exigir CSRF si la petición usa la cookie de sesión.
        # Llamadas con Authorization: Bearer (servicios) están exentas.
        has_session_cookie = SESSION_COOKIE_NAME in request.cookies
        if has_session_cookie:
            cookie_csrf = request.cookies.get(CSRF_COOKIE_NAME)
            header_csrf = request.headers.get("X-CSRF-Token")
            if not cookie_csrf or not header_csrf or cookie_csrf != header_csrf:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Sin permiso para realizar esta acción"},
                )
    return await call_next(request)


# ── Security headers (A2) ──────────────────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob:; "
        "connect-src 'self'"
    )
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ── Audit logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def audit_log(request: Request, call_next):
    response = await call_next(request)
    method = request.method
    path = request.url.path
    if method in ("POST", "PATCH", "PUT", "DELETE") or path.startswith("/auth"):
        logger.info(
            "AUDIT %s %s → %s | ip=%s",
            method,
            path,
            response.status_code,
            request.client.host if request.client else "unknown",
        )
    return response


# ── Handlers de error unificados (A5) ──────────────────────────────────────
from fastapi.exceptions import HTTPException as FastAPIHTTPException


@app.exception_handler(FastAPIHTTPException)
async def unified_http_exception_handler(request: Request, exc: FastAPIHTTPException):
    if exc.status_code == 404:
        return JSONResponse(status_code=404, content={"detail": "Recurso no encontrado"})
    if exc.status_code == 403:
        return JSONResponse(status_code=403, content={"detail": "Sin permiso para realizar esta acción"})
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers or None)


# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(activities.router, prefix="/activities", tags=["activities"])
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}
