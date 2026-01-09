from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid

from pro import triage_step

app = Flask(__name__)
CORS(app)

# =========================
# IN-MEMORY SESSION STORE
# =========================
SESSIONS = {}

def create_new_state():
    return {
        "stage": "collect",      # collect → followup → redflag → done
        "symptoms": set(),
        "followups": [],
        "candidates": [],
        "redflags": [],
        "score": 0,
        "last_question": None,
        "last_redflag": None
    }

# =========================
# HEALTH CHECK
# =========================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "Backend running",
        "message": "Open frontend/index.html to start"
    })

# =========================
# CHAT ENDPOINT
# =========================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()
    session_id = data.get("session_id")

    if not session_id or session_id not in SESSIONS:
        session_id = str(uuid.uuid4())
        SESSIONS[session_id] = create_new_state()

    state = SESSIONS[session_id]

    response = triage_step(user_message, state)

    # ⚠️ DO NOT MODIFY STATE
    # Convert only for response if needed

    return jsonify({
        "session_id": session_id,
        "message": response.get("message"),
        "options": response.get("options"),
        "triage": response.get("triage")
    })


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )

