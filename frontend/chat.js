let chats = [];
let currentChatId = null;

/* =========================
   AUTH CHECK
========================= */
const userId = localStorage.getItem("user_id");
if (!userId) {
  alert("Please login first");
  window.location.href = "login.html";
}

/* =========================
   CHAT MANAGEMENT
========================= */

async function newChat() {
  const title = "Triage - " + new Date().toLocaleTimeString();

  const res = await fetch("http://127.0.0.1:5000/api/chat/save-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title })
  });

  const data = await res.json();

  const chat = {
    id: data.chat_id,
    title,
    messages: [],
    sessionId: null   // 🔑 backend triage session
  };

  chats.unshift(chat);
  currentChatId = chat.id;

  renderChatHistory();

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";

  // ✅ UI-only welcome (NOT saved)
  appendMessage("👋 Hi! Describe your symptoms to start triage.", "bot", false);
}

function selectChat(id) {
  currentChatId = id;
  renderChat();
}

async function deleteChat(id) {
  await fetch(`http://127.0.0.1:5000/api/chat/delete/${id}`, {
    method: "DELETE"
  });

  chats = chats.filter(c => c.id !== id);

  if (currentChatId === id) {
    currentChatId = null;
    document.getElementById("chatBox").innerHTML = "";
  }

  renderChatHistory();
}

/* =========================
   RENDER UI
========================= */

function renderChatHistory() {
  const chatHistory = document.getElementById("chatHistory");
  chatHistory.innerHTML = "";

  chats.forEach(chat => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.innerText = chat.title;
    span.onclick = () => selectChat(chat.id);

    const del = document.createElement("span");
    del.innerText = "🗑️";
    del.className = "delete-chat";
    del.onclick = e => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    li.appendChild(span);
    li.appendChild(del);
    chatHistory.appendChild(li);
  });
}

function renderChat() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";

  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  if (chat.messages.length === 0) {
    appendMessage("👋 Hi! Describe your symptoms to start triage.", "bot", false);
    return;
  }

  chat.messages.forEach(m => {
    appendMessage(m.text, m.sender, false);
  });
}

/* =========================
   MESSAGE HANDLING
========================= */

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text || !currentChatId) return;

  input.value = "";
  appendMessage(text, "user", true);

  const typing = appendMessage("Processing your symptoms...", "bot", false);

  try {
    const chat = chats.find(c => c.id === currentChatId);

    const res = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: chat.sessionId,
        message: text
      })
    });

    const data = await res.json();
    typing.remove();

    // 🔑 SET ONCE — DO NOT OVERWRITE
    if (!chat.sessionId) {
      chat.sessionId = data.session_id;
    }

    if (data.message) {
      appendMessage(data.message, "bot", true);
    }

    if (data.triage) {
      let msg = `🩺 Triage Level: ${data.triage.level}\n${data.triage.message}`;
      if (data.triage.level === "CRITICAL") {
    showCriticalMap();
  }
      if (data.triage.remedies) {
        msg += "\n\n🏠 Home Care Instructions:\n";
        data.triage.remedies.forEach(r => msg += "• " + r + "\n");
      }

      if (data.triage.warning_signs) {
        msg += "\n⚠️ Watch out for these warning signs:\n";
        data.triage.warning_signs.forEach(w => msg += "• " + w + "\n");
      }

      appendMessage(msg, "bot", true);
    }

  } catch {
    typing.remove();
    appendMessage("⚠️ Server error. Please try again.", "bot", false);
  }
}

/* =========================
   MESSAGE UI + DB SAVE
========================= */

function appendMessage(text, sender, save) {
  const chatBox = document.getElementById("chatBox");

  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-msg" : "bot-msg";
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save && currentChatId) {
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ sender, text });

    fetch("http://127.0.0.1:5000/api/chat/save-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: currentChatId, sender, text })
    });
  }

  return msg;
}

/* =========================
   ENTER KEY SUPPORT
========================= */
document.getElementById("userInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* =========================
   LOAD HISTORY ON LOGIN
========================= */
async function loadHistory() {
  const res = await fetch(`http://127.0.0.1:5000/api/chat/history/${userId}`);
  const data = await res.json();

  chats = data.map(chat => ({
    id: chat.id,
    title: chat.title,
    messages: chat.messages || [],
    sessionId: null   // 🔑 backend session resumes on first message
  }));

  renderChatHistory();

  if (chats.length > 0) {
    currentChatId = chats[0].id;
    renderChat();
  } else {
    await newChat();
  }
}
let mapInitialized = false;

function showCriticalMap() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const container = document.getElementById("mapContainer");
      container.style.display = "block";

      if (!mapInitialized) {
        const map = L.map("map").setView([lat, lon], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap"
        }).addTo(map);

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup("📍 Your current location")
          .openPopup();

        mapInitialized = true;
      }
    },
    () => {
      alert("Location access denied.");
    }
  );
}

/* =========================
   START APP
========================= */
loadHistory();
