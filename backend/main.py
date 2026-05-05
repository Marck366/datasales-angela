import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import get_settings
from database import AsyncSessionLocal
from routers import auth, contacts, activities, companies, events, dashboard, ai

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("datasales")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("✅ MySQL connected — %s", settings.db_name)
    except Exception as exc:
        logger.error("❌ MySQL connection failed: %s", exc)
        sys.exit(1)
    yield


app = FastAPI(
    title="DatâSales API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Audit logging middleware ────────────────────────────────────────────────
@app.middleware("http")
async def audit_log(request: Request, call_next):
    response = await call_next(request)
    # Log write operations and auth events (skip health/docs/static)
    method = request.method
    path = request.url.path
    if method in ("POST", "PATCH", "PUT", "DELETE") or path.startswith("/auth"):
        user_id = request.headers.get("x-user-id", "anon")  # set by dep below
        logger.info(
            "AUDIT %s %s → %s | user=%s | ip=%s",
            method,
            path,
            response.status_code,
            user_id,
            request.client.host if request.client else "unknown",
        )
    return response


# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(activities.router, prefix="/activities", tags=["activities"])
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


# ── Health (SEC-11: sin detalles internos) ─────────────────────────────────
@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}
