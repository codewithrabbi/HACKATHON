"""Actions API routes."""
from fastapi import APIRouter
from database.db import query, execute

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.get("")
async def get_actions():
    """Get all recommended actions."""
    rows = query(
        """SELECT * FROM actions
        ORDER BY
            CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
            is_completed ASC,
            created_at DESC"""
    )
    return {"actions": rows}


@router.post("/{action_id}/complete")
async def complete_action(action_id: int):
    """Mark an action as completed."""
    affected = execute("UPDATE actions SET is_completed = 1 WHERE id = ?", (action_id,))
    if affected:
        return {"success": True, "message": "Action marked as completed"}
    return {"success": False, "message": "Action not found"}


@router.post("/{action_id}/reopen")
async def reopen_action(action_id: int):
    """Reopen a completed action."""
    affected = execute("UPDATE actions SET is_completed = 0 WHERE id = ?", (action_id,))
    if affected:
        return {"success": True, "message": "Action reopened"}
    return {"success": False, "message": "Action not found"}
