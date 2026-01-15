# Symptom Triage and Care Navigator

The **Symptom Triage and Care Navigator** is an intelligent, web-based healthcare assistant that performs **early symptom assessment and medical triage** through a conversational chatbot interface.  
It mimics **doctor-style clinical reasoning** by asking relevant follow-up questions, checking medical red flags, and providing actionable guidance based on symptom severity.

## Key Features

-**Doctor-like Conversational Flow**
  - Dynamically asks follow-up questions based on initial symptoms
  - Uses symptom clusters for intelligent questioning

-**Medical Triage Classification**
  - Categorizes cases into **LOW, MODERATE, or CRITICAL**
  - Based on symptom likelihood and red-flag scoring

-**Home Care Guidance (LOW Risk)**
  - Provides evidence-based self-care remedies
  - Advises monitoring and warning signs

-**Warning Alerts (MODERATE Risk)**
  - Displays danger signs requiring medical attention
  - Encourages timely doctor consultation

-**Emergency Handling (CRITICAL Risk)**
  - Automatically simulates emergency appointment booking
  - Sends a **real-time email alert** with hospital and doctor details

-**Session-Based Chat History**
  - Each chat maintains its own conversation and state
  - Supports multiple chats in the same session

-**Explainable & Rule-Based**
  - No black-box ML models
  - Transparent, dataset-driven medical logic

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript 

### Backend
- Python
- Flask
- Flask-CORS
- SMTP (Email alerts)

### Data
- JSON-based medical datasets:
  - Symptoms
  - Symptom clusters
  - Diseases
  - Red flags
  - Self-care guidelines
  - Triage rules

---

## Project Structure

symptom_triage_and_care_navigator/
│
├── backend/
│ ├── app.py
│ ├── pro.py
│ ├── email_service.py
│ ├── email_templates.py
│ ├── diseases.json
│ ├── symptoms_only.json
│ ├── symptom_clusters.json
│ ├── red_flags.json
│ ├── self_care_guidelines.json
│ └── triage_guidelines.json
│
├── frontend/
│ ├── index.html
│ ├── chat.js
│ ├── styles.css
│ ├── style.css
│ ├── for.jpg
│
└── README.md


---

## How to Run the Project (Step-by-Step)

### Prerequisites

Make sure you have:
- Python **3.8 or above**
- Internet connection (for email alerts)
- A Gmail account with **App Password enabled** (for CRITICAL alerts)

Install required Python packages:
```bash
pip install flask flask-cors

# Configure Email Alerts (CRITICAL cases)

Open backend/email_service.py and update:

sender_email = "your_email@gmail.com"
app_password = "your_gmail_app_password"
receiver_email = "recipient_email@gmail.com"


''Use Gmail App Password, not your real Gmail password.''

#### Start the Backend Server

From the project root:

cd backend
python app.py


You should see:

Running on http://127.0.0.1:5000
 Open the Frontend

Open any browser and go to:

http://127.0.0.1:5000


The chatbot interface will load automatically.
How the Chatbot Works

User enters symptoms (e.g., “I have fever and cough”)

Bot asks relevant follow-up questions

Red flags are checked for likely diseases

Triage level is determined:

LOW → Home care remedies

MODERATE → Warning signs & doctor advice

CRITICAL → Emergency alert + email sent

Final guidance is displayed clearly to the user

 Important Notes

This system is not a replacement for a doctor

Designed for early assessment and guidance

Ideal for academic projects, demos, and prototypes
