from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.memory import router as memory_router


def create_app() -> FastAPI:
    app = FastAPI(title="Recollect Memory Intelligence Layer")
    app.include_router(health_router)
    app.include_router(memory_router)
    return app
