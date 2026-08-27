from __future__ import annotations

from fastapi import Header, HTTPException

from engine.config import get_settings


def auth_tenant(
    authorization: str = Header(default=""),
    x_tenant_id: str = Header(default=""),
) -> str:
    """Service-token auth + explicit tenant identity on every call.

    The engine never sees end users; callers (platform, integrations) are
    responsible for their own user auth and must state the tenant explicitly.
    """
    token = authorization.removeprefix("Bearer ").strip()
    if token not in get_settings().token_set:
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "invalid service token"})
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail={"code": "missing_tenant", "message": "X-Tenant-ID header required"})
    return x_tenant_id
