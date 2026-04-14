const chatBox = document.getElementById("chatBox");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

async function loadAiSummary() {
    try {
        const res = await fetch("/api/ai/summary");
        const data = await res.json();

        document.getElementById("aiIncome").innerText =
            "$" + Number(data.income || 0).toLocaleString();

        document.getElementById("aiExpense").innerText =
            "$" + Number(data.expenses || 0).toLocaleString();

        document.getElementById("aiBalance").innerText =
            "$" + Number(data.balance || 0).toLocaleString();

        document.getElementById("aiSubs").innerText =
            (data.subs_ratio || 0) + "% of income";

        const alertBox = document.getElementById("aiAlerts");
        alertBox.innerHTML = "";

        if (!data.alerts || data.alerts.length === 0) {
            alertBox.innerHTML = "<span class='text-muted'>No alerts</span>";
        } else {
            data.alerts.forEach(a => {
                alertBox.innerHTML += `<div class="text-warning small">⚠ ${a}</div>`;
            });
        }

    } catch (err) {
        console.error("AI summary load failed:", err);
    }
}


// Send message
async function sendMessage(message) {
    if (!message || message.trim() === "") return;

    appendMessage("You", message);

    input.value = "";

    try {
        const res = await fetch("/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        appendMessage("AI", data.response || "No response from AI");
    } catch (err) {
        console.error(err);
        appendMessage("AI", "Error connecting to AI service");
    }
}

// Append message
// function appendMessage(sender, text) {
//     const div = document.createElement("div");
//     div.classList.add("mb-2");

//     div.innerHTML = `<strong>${sender}:</strong> ${text}`;
//     chatBox.appendChild(div);

//     chatBox.scrollTop = chatBox.scrollHeight;
// }
// Append message
function appendMessage(sender, text) {
    const div = document.createElement("div");
    div.classList.add("mb-2");

    // Only parse as Markdown if the sender is the AI
    if (sender === "AI") {
        // marked.parse() converts Markdown (**bold**, \n) into HTML (<strong>, <br>)
        const formattedContent = marked.parse(text);
        div.innerHTML = `<strong>${sender}:</strong> <div class="ai-content">${formattedContent}</div>`;
    } else {
        // For the user, we keep it simple or escape it for security
        div.innerHTML = `<strong>${sender}:</strong> <span>${text}</span>`;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Button click
sendBtn.addEventListener("click", () => {
    sendMessage(input.value);
});

// Enter key
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage(input.value);
});

// Suggested prompts
document.querySelectorAll(".prompt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        sendMessage(btn.innerText);
    });
});

window.addEventListener("DOMContentLoaded", () => {
    loadAiSummary();
});