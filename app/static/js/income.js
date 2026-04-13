let incomeData = [];
let currentEditId = null;
let currentDeleteId = null;
let currentBulkDeleteIds = [];

let currentPage = 1;
let rowsPerPage = 8; // make it let, not const

// ---------------- Date Formatting ----------------
function formatDateForDisplay(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format date for <input type="date"> (yyyy-mm-dd)
function formatDateForInput(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    const d = new Date(year, month - 1, day);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

// ================= LOAD DATA =================
async function loadIncome() {
    try {
        document.getElementById("income-table").innerHTML =
            `<tr><td colspan="7">Failed to load data</td></tr>`;

        const res = await fetch("/api/income");

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        incomeData = data || [];
        currentPage = 1;

        applyFilters(); // render table
    } catch (err) {
        console.error("Failed to load income:", err);

        document.getElementById("income-table").innerHTML =
            `<tr><td colspan="7">Failed to load data</td></tr>`;
    }
}

// ================= RENDER TABLE =================
function renderTable(data) {
    const table = document.getElementById("income-table");
    table.innerHTML = "";

    // pagination slice
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = data.slice(start, start + rowsPerPage);

    if (paginated.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No results found</td>
            </tr>
        `;
        return;
    }

    paginated.forEach(inc => {
        let badgeColor = "secondary";
        switch((inc.category || "").toLowerCase()) {
            case "salary": badgeColor = "success"; break;
            case "freelance": badgeColor = "primary"; break;
            case "business": badgeColor = "info"; break;
            case "other": badgeColor = "warning"; break;
        }

        table.innerHTML += `
        <tr id="income-${inc.id}" 
            data-amount="${inc.amount}" 
            data-category="${inc.category}" 
            data-date="${inc.date}" 
            data-comment="${inc.comment || ''}">
            <td><input type="checkbox" class="income-checkbox" value="${inc.id}"></td>
            <td>${formatDateForDisplay(inc.date)}</td>
            <td>${inc.name}</td>
            <td><span class="badge bg-${badgeColor}">${inc.category}</span></td>
            <td>$${Number(inc.amount).toLocaleString()}</td>
            <td>${inc.comment || '-'}</td>
            <td>
                <button class="btn btn-outline-primary px-3 py-2 me-1" onclick="populateIncomeEditModal(${inc.id})" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-outline-danger px-3 py-2" onclick="showDeleteIncomeModal(${inc.id})" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        </tr>`;
    });

    renderPagination(data.length);
}

// ================= PAGINATION =================
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const container = document.getElementById("pagination");
    if (!container) return;

    let html = `<nav><ul class="pagination justify-content-center mb-0">`;

    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1});return false;">&laquo;</a>
             </li>`;

    // Page numbers with a sliding window
    const maxVisible = 5; // max number of page buttons to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            html += `<li class="page-item">
                        <a class="page-link" href="#" onclick="changePage(${i});return false;">${i}</a>
                     </li>`;
        }
    }

    // Next button
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1});return false;">&raquo;</a>
             </li>`;

    html += `</ul></nav>`;
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    applyFilters(false); // don't reset page
}

function changeRowsPerPage(value){
    rowsPerPage = parseInt(value);
    currentPage = 1;
    applyFilters(false);
}

// ================= FILTERS & SEARCH =================
function applyFilters(resetPage = true) {
    const category = document.getElementById("filter-category").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const search = document.getElementById("search-name").value.toLowerCase();

    let filtered = incomeData;
    if (category) {
        filtered = filtered.filter(e =>
            (e.category || "").toLowerCase() === category.toLowerCase()
        );
    }
    if (startDate) {
        filtered = filtered.filter(e =>
            new Date(e.date) >= new Date(startDate)
        );
    }

    if (endDate) {
        filtered = filtered.filter(e =>
            new Date(e.date) <= new Date(endDate)
        );
    }
    if(search) filtered = filtered.filter(e => e.name.toLowerCase().includes(search));

    if(resetPage) currentPage = 1;
    renderTable(filtered);
}

// ================= EDIT MODAL =================
function populateIncomeEditModal(id) {
    currentEditId = id;
    const inc = incomeData.find(i => i.id === id);
    if(!inc) return;

    document.getElementById("editAmount").value = inc.amount;
    document.getElementById("editCategory").value = inc.category;
    document.getElementById("editDate").value = formatDateForInput(inc.date);
    document.getElementById("editComment").value = inc.comment;
    document.getElementById("editCustomCategory").value = inc.category === "Other" ? inc.category : "";

    toggleEditOther();
    new bootstrap.Modal(document.getElementById("editIncomeModal")).show();
}

function toggleEditOther() {
    const category = document.getElementById("editCategory").value;
    document.getElementById("editOtherDiv").style.display = category === "Other" ? "flex" : "none";
}

async function saveEdit() {
    const amount = document.getElementById("editAmount").value;
    let category = document.getElementById("editCategory").value;
    const customCategory = document.getElementById("editCustomCategory").value;
    const date = document.getElementById("editDate").value;
    const comment = document.getElementById("editComment").value;

    if(category === "Other" && customCategory.trim()) category = customCategory.trim();

    // optimistic UI update
    const idx = incomeData.findIndex(i => i.id === currentEditId);
    if(idx>-1){
        incomeData[idx].amount = amount;
        incomeData[idx].category = category;
        incomeData[idx].date = date;
        incomeData[idx].comment = comment;
    }

    bootstrap.Modal.getInstance(document.getElementById("editIncomeModal")).hide();
    applyFilters(); // refresh table

    await fetch(`/api/income/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ amount, category, date, comment })
    });
}

// ================= DELETE MODALS =================
function showDeleteIncomeModal(id){
    currentDeleteId = id;
    new bootstrap.Modal(document.getElementById("deleteIncomeModal")).show();
}

async function confirmDelete(){
    await fetch(`/api/income/${currentDeleteId}`, { method:'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById("deleteIncomeModal")).hide();
    loadIncome();
}

function showBulkDeleteIncomeModal(){
    const selected = Array.from(document.querySelectorAll('input.income-checkbox:checked')).map(cb=>cb.value);
    if(!selected.length) return alert("No income items selected.");
    currentBulkDeleteIds = selected;
    new bootstrap.Modal(document.getElementById("bulkDeleteIncomeModal")).show();
}

async function confirmBulkDelete(){
    await Promise.all(currentBulkDeleteIds.map(id =>
        fetch(`/api/income/${id}`, { method:'DELETE' })
    ));
    bootstrap.Modal.getInstance(document.getElementById("bulkDeleteIncomeModal")).hide();
    loadIncome();
}

// ================= SELECT ALL =================
function toggleAll(){
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('input.income-checkbox').forEach(cb=>cb.checked = checked);
}

// ================= INITIAL LOAD =================
window.onload = loadIncome;

window.addEventListener("themeChanged", () => {
    if (!incomeData.length) return;

    applyFilters(false); // re-render table
});