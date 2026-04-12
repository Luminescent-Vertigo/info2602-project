document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeSwitch");
    const root = document.documentElement;

    // =========================
    // 1. LOAD THEME
    // =========================
    let theme =
        localStorage.getItem("theme") ||
        root.getAttribute("data-theme") ||
        "light";

    root.setAttribute("data-theme", theme);

    // sync toggle state
    if (toggle) {
        toggle.checked = theme === "dark";

        // =========================
        // 2. HANDLE TOGGLE
        // =========================
        toggle.addEventListener("change", async () => {
            const newTheme = toggle.checked ? "dark" : "light";

            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);

            notifyThemeChange();

            await fetch("/toggle-theme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // optional feedback
            showToast(
                "info",
                "Theme Updated",
                `Switched to ${newTheme} mode`
            );
        });
    }
});


// =========================
// THEME HELPER (charts etc.)
// =========================
function getTheme() {
    const styles = getComputedStyle(document.documentElement);

    return {
        chartText: styles.getPropertyValue('--text').trim(),
        chartGrid: styles.getPropertyValue('--border').trim(),
        chartLegend: styles.getPropertyValue('--text-secondary').trim(),
        chartBg: styles.getPropertyValue('--card').trim()
    };
}


// =========================
// EVENT BUS
// =========================
function notifyThemeChange() {
    window.dispatchEvent(new Event("themeChanged"));
}


// =========================
// SAFE TOAST FUNCTION (FIXED)
// =========================
function showToast(type = "info", title = "", message = "") {
    const toastEl = document.getElementById("appToast");
    if (!toastEl) return;

    const titleEl = document.getElementById("toastTitle");
    const bodyEl = document.getElementById("toastContent");

    toastEl.classList.remove(
        "text-bg-success",
        "text-bg-danger",
        "text-bg-warning",
        "text-bg-info"
    );

    const valid = ["success", "danger", "warning", "info"];
    toastEl.classList.add(`text-bg-${valid.includes(type) ? type : "info"}`);

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = message;

    bootstrap.Toast.getOrCreateInstance(toastEl).show();
}
