document.addEventListener("DOMContentLoaded", function () {

    const btn = document.getElementById("aiToggleBtn");
    const popup = document.getElementById("aiChatPopup");
    const close = document.getElementById("closeChat");

    if (!btn || !popup) return;

    btn.addEventListener("click", () => {
        popup.style.display = "block";
    });

    if (close) {
        close.addEventListener("click", () => {
            popup.style.display = "none";
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatBox = document.getElementById("chatBox");

    // ✅ CRITICAL FIX
    if (!input || !sendBtn || !chatBox) {
        console.log("AI chat not on this page → skipping send logic");
        return;
    }

    function appendMessage(text, sender) {
        const div = document.createElement("div");
        div.classList.add("mb-2", "d-flex");

        if (sender === "user") {
            div.classList.add("justify-content-end");
            div.innerHTML = `
                <div class="chat-bubble user-bubble">
                    ${text}
                </div>
            `;
        } else {
            div.classList.add("justify-content-start");
            div.innerHTML = `
                <div class="chat-bubble bot-bubble">
                    ${text}
                </div>
            `;
        }

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;

        appendMessage(message, "user");
        input.value = "";

        try {
            const res = await fetch("/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            const data = await res.json();
            appendMessage(data.response || "No response", "bot");

        } catch (err) {
            console.error(err);
            appendMessage("Error connecting to AI", "bot");
        }
    }

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });
});