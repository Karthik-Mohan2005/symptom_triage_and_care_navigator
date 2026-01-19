from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid

from database import db
from auth_routes import auth
from pro import triage_step
from chat_routes import chat

app = Flask(__name__)
app.secret_key = "carebot-secret-key"   # 🔑 REQUIRED
CORS(app, supports_credentials=True)
app.register_blueprint(chat, url_prefix="/api/chat")


# 🔐 Database config (SQLite for now)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///carebot.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
app.register_blueprint(auth)

with app.app_context():
    db.create_all()

SESSIONS = {}

def create_new_state():
    return {
        "stage": "collect",
        "symptoms": set(),
        "followups": [],
        "candidates": [],
        "redflags": [],
        "score": 0,
        "last_question": None,
        "last_redflag": None
    }

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id")

        if not session_id or session_id not in SESSIONS:
            session_id = str(uuid.uuid4())
            SESSIONS[session_id] = create_new_state()

        state = SESSIONS[session_id]
        response = triage_step(user_message, state)

        return jsonify({
            "session_id": session_id,
            "message": response.get("message"),
            "options": response.get("options"),
            "triage": response.get("triage")
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({
            "message": "Internal server error",
            "triage": None
        }), 500

if __name__ == "__main__":
    app.run(debug=True)
