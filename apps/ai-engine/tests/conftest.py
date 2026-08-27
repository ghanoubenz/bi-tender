import os

import pytest

os.environ.setdefault("ENGINE_DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("ENGINE_GATEWAY_MODE", "mock")
os.environ.setdefault("ENGINE_SERVICE_TOKENS", "test-token")


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient

    from engine.db import base
    from engine.main import app

    # Reset DB engine between tests (in-memory sqlite is per-connection; use a
    # shared-cache URL so background threads see the same DB).
    base._engine = None
    base._session_factory = None
    os.environ["ENGINE_DATABASE_URL"] = "sqlite:///file:testdb?mode=memory&cache=shared&uri=true"
    from engine.config import get_settings

    get_settings.cache_clear()
    with TestClient(app) as c:
        yield c
    base._engine = None
    base._session_factory = None


AUTH = {"Authorization": "Bearer test-token", "X-Tenant-ID": "tenant-a"}
