let chats = [];
let currentChatId = null;

/* =========================
   CHAT MANAGEMENT
========================= */

function newChat() {
  const id = Date.now();

  chats.push({
    id,
    title: "Triage - " + new Date().toLocaleTimeString(),
    messages: [],
    sessionId: null
  });

  currentChatId = id;
  renderChatHistory();
  renderChat();

  addBotMessage("👋 Hi! Describe your symptoms to start triage.");
}

function selectChat(id) {
  currentChatId = id;
  renderChat();
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);

  if (currentChatId === id) {
    currentChatId = null;
    document.getElementById("chatBox").innerHTML = "";
  }

  renderChatHistory();
}

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
  appendMessage(text, "user");

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
    console.log("Backend response:", data);

    typing.remove();
    chat.sessionId = data.session_id;

    /* 🔹 Bot message */
    if (data.message) {
      appendMessage(data.message, "bot");
    }

    /* 🔹 Final triage */
    if (data.triage) {
      let msg = `🩺 Triage Level: ${data.triage.level}
${data.triage.message}`;

      if (data.triage.remedies) {
        msg += "\n\n🏠 Home Care Instructions:\n";
        data.triage.remedies.forEach(r => {
          msg += "• " + r + "\n";
        });
      }

      if (data.triage.warning_signs) {
        msg += "\n⚠️ Watch out for these warning signs:\n";
        data.triage.warning_signs.forEach(w => {
          msg += "• " + w + "\n";
        });
      }

      appendMessage(msg, "bot");
    }

  } catch (err) {
    typing.remove();
    appendMessage("⚠️ Server error. Please try again.", "bot");
    console.error(err);
  }
}

/* =========================
   MESSAGE UI
========================= */

function appendMessage(text, sender, save = true) {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");

  msg.className = sender === "user" ? "user-msg" : "bot-msg";
  msg.innerText = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (save && currentChatId) {
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ sender, text });
  }

  return msg;
}

function addBotMessage(text) {
  appendMessage(text, "bot");
}

/* =========================
   ENTER KEY SUPPORT ✅
========================= */

document.getElementById("userInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* =========================
   AUTO START FIRST CHAT
========================= */

newChat();
