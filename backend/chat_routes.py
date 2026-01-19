from flask import Blueprint, request, jsonify
from database import db
from models import ChatSession, ChatMessage

chat = Blueprint("chat", __name__, url_prefix="/api/chat")

# 🆕 Create new chat session
@chat.route("/save-session", methods=["POST"])
def save_session():
    data = request.json

    session = ChatSession(
        user_id=data["user_id"],
        title=data["title"]
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({"chat_id": session.id})


# 📝 Save message (FIXED)
@chat.route("/save-message", methods=["POST"])
def save_message():
    data = request.json

    msg = ChatMessage(
        chat_id=data["chat_id"],
        sender=data["sender"],
        message=data["text"]   # ✅ FIX HERE
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({"status": "saved"})


# 📜 Load chat history (FIXED)
@chat.route("/history/<int:user_id>")
def load_history(user_id):
    sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.created_at.desc()).all()

    return jsonify([
        {
            "id": s.id,
            "title": s.title,
            "messages": [
                {
                    "sender": m.sender,
                    "text": m.message   # ✅ FIX HERE
                }
                for m in s.messages
            ]
        }
        for s in sessions
    ])


# 🗑 Delete chat
@chat.route("/delete/<int:chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    ChatMessage.query.filter_by(chat_id=chat_id).delete()
    ChatSession.query.filter_by(id=chat_id).delete()
    db.session.commit()
    return jsonify({"message": "Chat deleted"})
