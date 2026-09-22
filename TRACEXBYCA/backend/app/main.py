from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import get_settings
from app.database import SessionLocal
from app.services.graph_service import sync_graph
from app.services.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.seed_on_start:
        db = SessionLocal()
        try:
            seed_if_empty(db)
            sync_graph(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title="Dark Web Threat Intelligence MVP",
    description="Synthetic investigator platform for SIH PS 26151. No live collection.",
    version="1.0.0",
    lifespan=lifespan,
)

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

settings = get_settings()
cors_origins = settings.cors_list
allow_all = "*" in cors_origins or not cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else cors_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal service error."})


app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "mode": "production"}


# Serve built frontend static files if present (for single-service deployment on Render / Railway)
dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if dist_dir.exists() and (dist_dir / "index.html").exists():
    if (dist_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(dist_dir / "index.html"))
