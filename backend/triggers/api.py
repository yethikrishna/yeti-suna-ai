from fastapi import APIRouter, HTTPException, Depends, Body, Request
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from services.supabase import DBConnection
from utils.logger import logger
from utils.auth_utils import get_current_user_id_from_jwt

from .models import (
    TriggerCreateRequest,
    TriggerUpdateRequest,
    TriggerResponse,
    TriggerType,
)

router = APIRouter()

db: Optional[DBConnection] = None

TRIGGERS_TABLE = "triggers"
TRIGGER_RUNS_TABLE = "trigger_runs"


# ---------------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------------

def initialize(_db: DBConnection):
    global db
    db = _db
    logger.info("Initialized triggers.api with DB connection")


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

async def _get_project_and_account(user_id: str) -> Dict[str, str]:
    """Placeholder – derive account_id/project_id from user context.
    For now, returns dummy project mapping. This should be replaced once the
    app has explicit accounts/projects on the user object.
    """
    # TODO: Implement real logic.
    return {
        "account_id": user_id,
        "project_id": None,
    }


# ---------------------------------------------------------------------------
# CRUD Endpoints (Authenticated)
# ---------------------------------------------------------------------------

@router.post("/triggers", response_model=TriggerResponse)
async def create_trigger(
    trigger_data: TriggerCreateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    ids = await _get_project_and_account(user_id)

    record = {
        "id": str(uuid.uuid4()),
        "account_id": ids["account_id"],
        "project_id": ids["project_id"],
        "name": trigger_data.name,
        "description": trigger_data.description,
        "type": trigger_data.type.value,
        "config": trigger_data.config,
        "enabled": trigger_data.enabled,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "secret": str(uuid.uuid4())[:16] if trigger_data.type == TriggerType.webhook else None,
    }

    client = await db.client
    try:
        await client.table(TRIGGERS_TABLE).insert(record).execute()
    except Exception as e:
        logger.error(f"Failed to insert trigger: {e}")
        raise HTTPException(status_code=500, detail="Failed to create trigger")

    return TriggerResponse(**record)


@router.get("/triggers", response_model=List[TriggerResponse])
async def list_triggers(user_id: str = Depends(get_current_user_id_from_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    ids = await _get_project_and_account(user_id)

    client = await db.client
    try:
        res = await client.table(TRIGGERS_TABLE).select("*").eq("account_id", ids["account_id"]).execute()
    except Exception as e:
        logger.error(f"Failed to fetch triggers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch triggers")

    return [TriggerResponse(**row) for row in res.data]


@router.get("/triggers/{trigger_id}", response_model=TriggerResponse)
async def get_trigger(trigger_id: str, user_id: str = Depends(get_current_user_id_from_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    client = await db.client
    res = await client.table(TRIGGERS_TABLE).select("*").eq("id", trigger_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Trigger not found")

    # TODO: access check
    return TriggerResponse(**res.data)


@router.put("/triggers/{trigger_id}", response_model=TriggerResponse)
async def update_trigger(
    trigger_id: str,
    trigger_data: TriggerUpdateRequest,
    user_id: str = Depends(get_current_user_id_from_jwt),
):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    update_dict = {k: v for k, v in trigger_data.dict(exclude_none=True).items()}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    client = await db.client
    await client.table(TRIGGERS_TABLE).update(update_dict).eq("id", trigger_id).execute()

    res = await client.table(TRIGGERS_TABLE).select("*").eq("id", trigger_id).single().execute()
    return TriggerResponse(**res.data)


@router.delete("/triggers/{trigger_id}")
async def delete_trigger(trigger_id: str, user_id: str = Depends(get_current_user_id_from_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    client = await db.client
    await client.table(TRIGGERS_TABLE).delete().eq("id", trigger_id).execute()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Public Webhook Endpoint (Unauthenticated)
# ---------------------------------------------------------------------------

@router.post("/trigger/webhook/{trigger_id}")
async def fire_webhook_trigger(trigger_id: str, request: Request):
    if db is None:
        raise HTTPException(status_code=500, detail="Triggers subsystem not initialized")

    body_bytes = await request.body()
    headers = request.headers

    client = await db.client
    res = await client.table(TRIGGERS_TABLE).select("*").eq("id", trigger_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Trigger not found")

    trigger = res.data
    if trigger["type"] != "webhook":
        raise HTTPException(status_code=400, detail="Trigger is not of type webhook")
    if not trigger["enabled"]:
        raise HTTPException(status_code=400, detail="Trigger is disabled")

    secret_header = headers.get("X-Trigger-Secret") or headers.get("x-trigger-secret")
    if trigger.get("secret") and secret_header != trigger["secret"]:
        raise HTTPException(status_code=401, detail="Invalid trigger secret")

    # -------------------------------------------------------------------
    # Launch the agent run (simple MVP)
    # -------------------------------------------------------------------
    from run_agent_background import run_agent_background  # Local import to avoid circular

    agent_run_id = str(uuid.uuid4())
    trigger_run_id = str(uuid.uuid4())

    # TODO: For now we'll use config inside trigger to locate thread_id/project_id/prompt
    cfg = trigger.get("config", {}) or {}
    thread_id = cfg.get("thread_id")
    project_id = cfg.get("project_id")
    prompt = cfg.get("prompt", "Webhook Trigger Fired")

    if not thread_id or not project_id:
        logger.error("Trigger config missing thread_id or project_id – can't launch agent")
        raise HTTPException(status_code=400, detail="Trigger misconfigured. Requires thread_id and project_id in config.")

    # Create minimal message in thread? We defer to agent run – just send prompt param.

    # For MVP we call run_agent_background with minimal params; note we don't stream.
    run_agent_background.send(
        agent_run_id,
        thread_id,
        "trigger",  # instance_id label
        project_id,
        cfg.get("model_name", "gpt-4o-mini"),
        False,  # enable_thinking
        "low",  # reasoning_effort
        False,  # stream
        False,  # enable_context_manager
        None,  # agent_config
        False,  # is_agent_builder
        None,  # target_agent_id
    )

    # Record trigger_run row (agent_run_id will be updated later when the agent actually starts)
    try:
        await client.table(TRIGGER_RUNS_TABLE).insert(
            {
                "id": trigger_run_id,
                "trigger_id": trigger_id,
                "agent_run_id": None,  # Will be updated when agent run actually starts
                "status": "queued",
                "fired_at": datetime.now(timezone.utc).isoformat(),
                "debug_payload": {
                    "headers": dict(headers),
                    "body": body_bytes.decode("utf-8", errors="ignore"),
                    "expected_agent_run_id": agent_run_id,  # Store for reference
                },
            }
        ).execute()
    except Exception as e:
        logger.error(f"Failed to insert trigger_run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create trigger run: {str(e)}")

    return {
        "status": "queued",
        "trigger_run_id": trigger_run_id,
        "agent_run_id": agent_run_id,
    } 