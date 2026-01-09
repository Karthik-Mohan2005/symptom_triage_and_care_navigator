import os
import json
import re
from email_templates import build_emergency_email

# =========================
# LOAD DATA
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load(filename):
    with open(os.path.join(BASE_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)

SYMPTOMS = set(load("symptoms_only.json")["symptoms"])
CLUSTERS = load("symptom_clusters.json")
DISEASES = load("diseases.json")
RED_FLAGS = load("red_flags.json")
SELF_CARE = load("self_care_guidelines.json")
TRIAGE_GUIDELINES = load("triage_guidelines.json")

# =========================
# NLP UTILITIES
# =========================
def normalize(text):
    return re.sub(r"[^a-z\s]", "", text.lower())

def extract_symptoms(text):
    tokens = normalize(text).split()
    found = set()

    for i in range(len(tokens)):
        for j in range(i + 1, len(tokens) + 1):
            phrase = " ".join(tokens[i:j])
            if phrase in SYMPTOMS:
                found.add(phrase)

    return found

# =========================
# FOLLOW-UP GENERATION
# =========================
def build_followups(symptoms):
    followups = []

    for s in symptoms:
        for cluster_symptoms in CLUSTERS.values():
            if s in cluster_symptoms:
                for r in cluster_symptoms:
                    if r != s and r not in symptoms and r not in followups:
                        followups.append(r)

    return followups

# =========================
# DISEASE RANKING (LIKELIHOOD)
# =========================
def rank_diseases(symptoms):
    scores = {}

    for disease, disease_symptoms in DISEASES.items():
        overlap = len(symptoms & set(disease_symptoms))
        if overlap > 0:
            scores[disease] = overlap / len(disease_symptoms)

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return ranked[:2]   # top-2 likely diseases

# =========================
# RED FLAG QUEUE
# =========================
def build_redflag_queue(candidate_diseases):
    queue = []

    for disease, _ in candidate_diseases:
        for rf, weight in RED_FLAGS.get(disease, {}).items():
            queue.append((disease, rf, weight))

    return queue

# =========================
# TRIAGE FINALIZATION
# =========================
from email_service import send_critical_email

def finalize_triage(score, symptoms):
    if score >= 6:
        level = "CRITICAL"
    elif score >= 3:
        level = "MODERATE"
    else:
        level = "LOW"

    config = TRIAGE_GUIDELINES[level]

    response = {
        "level": level,
        "message": config["message"]
    }


    if level == "CRITICAL":
        email_body = build_emergency_email()
        send_critical_email(
            "karthik.mohan2210@gmail.com",
            email_body
        )

        response["message"] = (
            "🚨 CRITICAL CONDITION DETECTED\n"
            "An emergency appointment has been booked automatically.\n"
            "Please check your email for appointment details."
        )
    elif level == "LOW":
        remedies = []
        for s in symptoms:
            remedies.extend(SELF_CARE["LOW"].get(s, []))
        remedies.extend(SELF_CARE["LOW"]["general"])

        response["remedies"] = list(set(remedies))
        response["warning_signs"] = SELF_CARE["LOW"]["warning_signs"]
    elif level == "MODERATE":
        response["warning_signs"] = SELF_CARE["LOW"]["warning_signs"]

    return response



    
    # LOW → remedies + warning signs
    

    # MODERATE → warning signs onl
    

# =========================
# MAIN CHATBOT STEP
# =========================
def triage_step(user_text, state):

    response = {"message": None, "options": ["yes", "no"], "triage": None}

    # 1️⃣ COLLECT INITIAL SYMPTOMS
    if state["stage"] == "collect":
        extracted = extract_symptoms(user_text)
        state["symptoms"].update(extracted)

        state["candidates"] = rank_diseases(state["symptoms"])
        state["followups"] = build_followups(state["symptoms"])
        state["last_question"] = None
        state["stage"] = "followup"

    # 2️⃣ FOLLOW-UP
    if state["stage"] == "followup":

        if state["last_question"]:
            if user_text.lower() in ("yes", "y"):
                state["symptoms"].add(state["last_question"])
            state["last_question"] = None

        if state["followups"]:
            q = state["followups"].pop(0)
            state["last_question"] = q
            response["message"] = f"Do you also have {q}?"
            return response

        # Move to red flags
        state["redflags"] = build_redflag_queue(state["candidates"])
        state["stage"] = "redflag"

    # 3️⃣ RED FLAGS
    if state["stage"] == "redflag":

        if state.get("last_redflag"):
            if user_text.lower() in ("yes", "y"):
                state["score"] += state["last_redflag"][2]
            state["last_redflag"] = None

        if state["redflags"]:
            rf = state["redflags"].pop(0)
            state["last_redflag"] = rf
            response["message"] = f"Are you experiencing {rf[1]}?"
            return response

        state["stage"] = "done"

    # 4️⃣ FINAL TRIAGE
    if state["stage"] == "done":
        response["triage"] = finalize_triage(state["score"], state["symptoms"])
        response["message"] = "Assessment complete."
        response["options"] = None
        return response

    return response
