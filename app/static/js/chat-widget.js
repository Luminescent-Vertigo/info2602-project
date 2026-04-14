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

    if (!input || !sendBtn || !chatBox) {
        console.log("AI chat not on this page → skipping send logic");
        return;
    }

    function appendMessage(sender, text) {
        const div = document.createElement("div");
        div.classList.add("mb-3", "p-2"); // Added margin for better spacing between bubbles

        if (sender === "AI") {
            // Use marked.parse to convert Markdown to HTML
            const formattedContent = marked.parse(text);
            div.innerHTML = `
                <div class="small text-primary"><strong>${sender}</strong></div>
                <div class="ai-content mt-1">${formattedContent}</div>
            `;
        } else {
            div.innerHTML = `
                <div class="small text-secondary"><strong>You</strong></div>
                <div class="user-content mt-1">${text}</div>
            `;
        }

        const chatBox = document.getElementById("chatBox");
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
}


    async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    // Fixed: (Sender, Text)
    appendMessage("You", message); 
    input.value = "";

    try {
        const res = await fetch("/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: message,
                current_page: window.location.pathname 
            })
        });

        const data = await res.json();
        
        // Fixed: Use "AI" specifically if your function checks for if (sender === "AI")
        appendMessage("AI", data.response || "No response");

    } catch (err) {
        console.error(err);
        appendMessage("AI", "Error connecting to AI");
    }
}

    sendBtn.addEventListener("click", sendMessage);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });
});