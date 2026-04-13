let budgetsData = [];
let deleteId = null;

// ================= LOAD =================
async function loadBudgets() {
    const res = await fetch("/api/budgets");
    const data = await res.json();

    budgetsData = data;

    renderBudgets(data);
    renderOverallProgress(data);
}

// ================= OVERALL =================
function renderOverallProgress(data) {
    let totalSpent = 0;
    let totalLimit = 0;

    data.forEach(b => {
        totalSpent += Number(b.spent) || 0;
        totalLimit += Number(b.limit_amount) || 0;
    });

    let percent = totalLimit ? (totalSpent / totalLimit) * 100 : 0;
    percent = Math.min(percent, 100);

    const bar = document.getElementById("overallProgressBar");

    bar.style.width = percent + "%";
    bar.classList.add("progress-bar-large");
    bar.innerText = `Overall: $${totalSpent} / $${totalLimit} (${percent.toFixed(0)}%)`;
}

// ================= CARD =================
function renderBudgets(data) {
    const container = document.getElementById("budgetContainer");
    container.innerHTML = "";

    data.forEach(b => {
        let color = "bg-success";
        let statusText = "Safe";

        if (b.status === "warning") {
            color = "bg-warning";
            statusText = "Near Limit";
        } else if (b.status === "exceeded") {
            color = "bg-danger";
            statusText = "Exceeded";
        }

        let spent = Number(b.spent) || 0;
        let limit = Number(b.limit_amount) || 0;
        let percent = limit ? (spent / limit) * 100 : 0;
        percent = Math.min(percent, 100);

        container.innerHTML += `
        <div class="card p-4 shadow-sm rounded-4" style="min-width:360px;">

            <!-- TITLE -->
            <h5 class="fw-bold text-center mb-3">${b.name}</h5>

            ${field("Category", b.category)}
            ${field("Budget Limit", `$${b.limit_amount}`)}
            ${field("Amount Spent", `$${b.spent}`)}
            ${field("Remaining", `$${b.remaining}`)}
            ${field("Period", formatRange(b.start_date, b.end_date))}

            <!-- PROGRESS -->
            <div class="mb-3">
                <small class="text-muted">Progress</small>
                <div class="progress mt-1" style="height:32px; border-radius:8px;">
                    <div class="progress-bar ${color} d-flex align-items-center justify-content-center fw-semibold"
                        style="width:${percent}%; font-size:1rem;">
                        ${spent} / ${limit} (${Math.round(percent)}%)
                    </div>
                </div>
            </div>

            <!-- STATUS -->
            <div class="mb-2">
                <small class="text-muted">Status</small>
                <div class="fw-semibold">${b.status_icon} ${statusText}</div>
            </div>

            <!-- ACTIONS -->
            <div class="d-flex justify-content-between mt-3">
                <button class="btn btn btn-primary px-3 py-2 me-1" onclick="editBudget(${b.id})" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-danger px-3 py-2" onclick="showDeleteBudgetModal(${b.id})" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>`;
    });
}

// ================= FIELD =================
function field(label, value) {
    return `
    <div class="mb-3">
        <small class="text-muted">${label}</small>
        <div class="budget-field-box mt-1">
            ${value}
        </div>
    </div>`;
}

// ================= AUTO-UPDATE =================
async function addExpense(formId) {
    const form = document.getElementById(formId);
    const data = new FormData(form);

    // Submit the expense to your existing /expenses/add route
    await fetch("/expenses/add", {
        method: "POST",
        body: data
    });

    // Reload budgets from backend to reflect new expense
    const res = await fetch("/api/budgets");
    budgetsData = await res.json();

    // Re-render all budget cards and overall progress
    renderBudgets(budgetsData);
    renderOverallProgress(budgetsData);

    // Reset the form and default dates
    form.reset();
    setDefaultDates();
}

// ================= DEFAULT DATES =================
function setDefaultDates() {
    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById("addStartDate").value = firstDay.toISOString().split('T')[0];
    document.getElementById("addEndDate").value = lastDay.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatRange(start, end) {
    if (!start || !end) return "";

    const [sy, sm, sd] = start.split("-");
    const [ey, em, ed] = end.split("-");

    const s = new Date(sy, sm - 1, sd);
    const e = new Date(ey, em - 1, ed);

    const sameMonth =
        s.getMonth() === e.getMonth() &&
        s.getFullYear() === e.getFullYear();

    if (sameMonth) {
        return `${s.toLocaleDateString(undefined, { month: 'short' })} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    }

    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

// ================= MODALS =================
function openAddBudgetModal() {
    setDefaultDates();
    new bootstrap.Modal(document.getElementById("addBudgetModal")).show();
}

function openAddBudgetModal(event) {
    if (event) event.preventDefault();

    setDefaultDates();
    new bootstrap.Modal(document.getElementById("addBudgetModal")).show();
}

// ================= CATEGORY LOGIC =================
document.addEventListener("DOMContentLoaded", function () {

    const addSelect = document.getElementById("addCategorySelect");
    const addOther = document.getElementById("addOtherDiv");

    const editSelect = document.getElementById("editCategorySelect");
    const editOther = document.getElementById("editOtherDiv");

    if (addSelect) {
        addSelect.addEventListener("change", () => {
            addOther.style.display = addSelect.value === "Other" ? "block" : "none";
        });
    }

    if (editSelect) {
        editSelect.addEventListener("change", () => {
            editOther.style.display = editSelect.value === "Other" ? "block" : "none";
        });
    }

});

// ================= EDIT =================
function editBudget(id) {
    const b = budgetsData.find(x => x.id === id);

    document.getElementById("editId").value = b.id;
    document.getElementById("editName").value = b.name;
    document.getElementById("editLimit").value = b.limit_amount;
    document.getElementById("editStartDate").value = b.start_date;
    document.getElementById("editEndDate").value = b.end_date;

    const select = document.getElementById("editCategorySelect");
    const otherDiv = document.getElementById("editOtherDiv");
    const custom = document.getElementById("editCustomCategory");

    const known = ["Food","Housing","Dining","Transport"];

    if (known.includes(b.category)) {
        select.value = b.category;
        otherDiv.classList.add("d-none");
    } else {
        select.value = "Other";
        otherDiv.classList.remove("d-none");
        custom.value = b.category;
    }

    new bootstrap.Modal(document.getElementById("editBudgetModal")).show();
}

// ================= SAVE EDIT =================
async function saveEdit() {
    const id = document.getElementById("editId").value;

    const select = document.getElementById("editCategorySelect").value;
    const custom = document.getElementById("editCustomCategory").value;

    const category = select === "Other" ? custom : select;

    const formData = new FormData();
    formData.append("name", document.getElementById("editName").value);
    formData.append("category", category);
    formData.append("limit_amount", document.getElementById("editLimit").value);
    formData.append("start_date", document.getElementById("editStartDate").value);
    formData.append("end_date", document.getElementById("editEndDate").value);

    await fetch(`/api/budgets/${id}`, {
        method: "PUT",
        body: formData
    });

    bootstrap.Modal.getInstance(document.getElementById("editBudgetModal")).hide();
    loadBudgets();
}

// ================= DELETE =================
function showDeleteBudgetModal(id) {
    deleteId = id;
    new bootstrap.Modal(document.getElementById("deleteBudgetModal")).show();
}

async function confirmDelete() {
    if (!deleteId) return;

    await fetch(`/api/budgets/${deleteId}`, { method: "DELETE" });

    deleteId = null;

    bootstrap.Modal.getInstance(
        document.getElementById("deleteBudgetModal")
    ).hide();

    loadBudgets();
}

// ================= INIT =================
window.onload = loadBudgets;
