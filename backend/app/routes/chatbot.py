from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.models import User, ChatbotConversation
from ..services.auth import get_current_user
from ..mock_ai.mock_ai_service import mock_ai

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatbotRequest(BaseModel):
    message: str


@router.post("/chat")
def chatbot_chat(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loading_steps = mock_ai.simulate_loading([
        "Loading AI Model...",
        "Processing Query...",
        "Generating Response..."
    ])

    response = mock_ai.chatbot_response(current_user.role.value, request.message)

    # Save conversation
    conversation = ChatbotConversation(
        user_id=current_user.id,
        user_role=current_user.role.value,
        message=request.message,
        response=response,
    )
    db.add(conversation)
    db.commit()

    return {
        "loading_steps": loading_steps,
        "response": response,
        "conversation_id": conversation.id,
    }


@router.get("/history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(ChatbotConversation).filter(
        ChatbotConversation.user_id == current_user.id
    ).order_by(ChatbotConversation.created_at.desc()).limit(20).all()

    return {
        "conversations": [{
            "id": c.id,
            "message": c.message,
            "response": c.response,
            "created_at": str(c.created_at),
        } for c in conversations]
    }