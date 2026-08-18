"""Chat API routes with SSE streaming."""
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent.engine import chat_stream

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    history: list = []


@router.post("")
async def chat(req: ChatRequest):
    """AI Copilot chat endpoint with streaming SSE response."""
    return StreamingResponse(
        chat_stream(req.message, req.history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/suggested")
async def suggested_questions():
    """Get suggested questions for the AI Copilot."""
    return {
        "questions": [
            {"text": "Why did Product A sales decline?", "icon": "trending-down"},
            {"text": "Which products are at risk of stockout?", "icon": "alert-triangle"},
            {"text": "What's our revenue forecast for next month?", "icon": "bar-chart-2"},
            {"text": "Analyze supplier performance and risks", "icon": "truck"},
            {"text": "Compare this month's sales to last month", "icon": "git-compare"},
            {"text": "What are the top 5 products by profit margin?", "icon": "award"},
        ]
    }
