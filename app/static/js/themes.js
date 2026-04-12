document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("themeSwitch");
    const root = document.documentElement;

    if (!toggle) return;

    // =========================
    // 1. LOAD THEME (priority system)
    // =========================
    let theme =
        localStorage.getItem("theme") ||
        root.getAttribute("data-theme") ||
        "light";

    root.setAttribute("data-theme", theme);

    // sync toggle state
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
    });
});

function getTheme() {
    const styles = getComputedStyle(document.documentElement);

    return {
        chartText: styles.getPropertyValue('--text').trim(),
        chartGrid: styles.getPropertyValue('--border').trim(),
        chartLegend: styles.getPropertyValue('--text-secondary').trim(),
        chartBg: styles.getPropertyValue('--card').trim()
    };
}

// NEW: broadcast theme change event
function notifyThemeChange() {
    window.dispatchEvent(new Event("themeChanged"));
}