from __future__ import annotations

import json
import logging
from typing import Any

from engine.config import get_settings
from engine.gateway.router import Task, model_for

log = logging.getLogger(__name__)


class GatewayError(RuntimeError):
    pass


def structured_completion(
    *,
    task: Task,
    system: str,
    user: str,
    json_schema: dict[str, Any],
    tenant_id: str,
    job_id: str | None = None,
    max_retries: int = 2,
) -> dict[str, Any]:
    """One LLM call, routed by task, returning schema-validated JSON.

    Every call is metered per tenant (UsageRecord). PRODUCT_CONTRACT rule 6
    (private-processing tenants) is enforced HERE and nowhere else: when tenant
    AI profiles land, this function checks the tenant policy before any
    external provider call.
    """
    if get_settings().gateway_mode != "live":
        raise GatewayError("gateway_mode is not 'live'; extraction should use the rule-based path")

    try:
        import litellm
    except ImportError as exc:  # [live] extra not installed
        raise GatewayError("litellm not installed; install tender-ai-engine[live]") from exc

    model = model_for(task)
    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            resp = litellm.completion(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "result", "schema": json_schema},
                },
                num_retries=1,
            )
            _record_usage(tenant_id=tenant_id, job_id=job_id, task=task, model=model, resp=resp)
            return json.loads(resp.choices[0].message.content)
        except Exception as exc:  # noqa: BLE001 — retried, then surfaced as GatewayError
            last_err = exc
            log.warning("gateway call failed (attempt %s/%s): %s", attempt + 1, max_retries + 1, exc)
    raise GatewayError(f"gateway call failed after retries: {last_err}")


def _record_usage(*, tenant_id: str, job_id: str | None, task: Task, model: str, resp: Any) -> None:
    from engine.db.base import session_scope
    from engine.db.models import UsageRecord

    usage = getattr(resp, "usage", None)
    cost = 0.0
    try:
        import litellm

        cost = litellm.completion_cost(completion_response=resp) or 0.0
    except Exception:  # cost lookup is best-effort
        pass
    with session_scope() as db:
        db.add(
            UsageRecord(
                tenant_id=tenant_id,
                job_id=job_id,
                task=task.value,
                model=model,
                input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
                output_tokens=getattr(usage, "completion_tokens", 0) or 0,
                cost_usd=cost,
            )
        )
