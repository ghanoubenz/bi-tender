from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from engine.api import documents, jobs, tenders
from engine.db.base import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Tender AI Engine",
    version="0.1.0",
    description="Standalone tender intelligence API. Evidence-first; platform-independent.",
    lifespan=lifespan,
)

app.include_router(tenders.router)
app.include_router(jobs.router)
app.include_router(documents.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "tender-ai-engine"}
