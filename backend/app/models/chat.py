"""Chat request/response schemas."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for AI chat."""

    question: str = Field(..., description="User question about the database")
    context: str | None = Field(default=None, description="Additional context for the AI")


class ChatResponse(BaseModel):
    """Response schema for AI chat."""

    answer: str = Field(..., description="AI response to the user question")