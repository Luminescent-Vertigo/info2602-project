let expensesData = [];
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
async function loadExpenses() {
    const res = await fetch("/api/expenses");
    expensesData = await res.json();
    currentPage = 1;
    applyFilters(); // render table
}

// ================= RENDER TABLE =================
function renderTable(data) {
    const table = document.getElementById("expenses-table");
    table.innerHTML = "";

    // pagination slice
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = data.slice(start, start + rowsPerPage);

    paginated.forEach(exp => {
        let badgeColor = "secondary";
        switch(exp.category.toLowerCase()) {
            case "food": badgeColor = "success"; break;
            case "housing": badgeColor = "primary"; break;
            case "dining": badgeColor = "danger"; break;
            case "other": badgeColor = "warning"; break;
        }

        table.innerHTML += `
        <tr id="expense-${exp.id}" 
            data-amount="${exp.amount}" 
            data-category="${exp.category}" 
            data-date="${exp.date}" 
            data-comment="${exp.comment || ''}">
            <td><input type="checkbox" class="expense-checkbox" value="${exp.id}"></td>
            <td>${formatDateForDisplay(exp.date)}</td>
            <td>${exp.name}</td>
            <td><span class="badge bg-${badgeColor}">${exp.category}</span></td>
            <td>$${exp.amount}</td>
            <td>${exp.comment || '-'}</td>
            <td>
                <button class="btn btn-outline-primary px-3 py-2 me-1" onclick="populateExpenseEditModal(${exp.id})" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-outline-danger px-3 py-2" onclick="showDeleteExpenseModal(${exp.id})" title="Delete">
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

    let filtered = expensesData;
    if(category) filtered = filtered.filter(e => e.category === category);
    if(startDate) filtered = filtered.filter(e => e.date >= startDate);
    if(endDate) filtered = filtered.filter(e => e.date <= endDate);
    if(search) filtered = filtered.filter(e => e.name.toLowerCase().includes(search));

    if(resetPage) currentPage = 1;
    renderTable(filtered);
}

// ================= EDIT MODAL =================
function populateExpenseEditModal(id) {
    currentEditId = id;
    const exp = expensesData.find(e => e.id === id);
    if(!exp) return;

    document.getElementById("editAmount").value = exp.amount;
    document.getElementById("editCategory").value = exp.category;
    document.getElementById("editDate").value = formatDateForInput(exp.date);
    document.getElementById("editComment").value = exp.comment;
    document.getElementById("editCustomCategory").value = exp.category === "Other" ? exp.category : "";

    toggleEditOther();
    new bootstrap.Modal(document.getElementById("editExpenseModal")).show();
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
    const idx = expensesData.findIndex(e => e.id === currentEditId);
    if(idx>-1){
        expensesData[idx].amount = amount;
        expensesData[idx].category = category;
        expensesData[idx].date = date;
        expensesData[idx].comment = comment;
    }

    bootstrap.Modal.getInstance(document.getElementById("editExpenseModal")).hide();
    applyFilters(); // refresh table

    await fetch(`/api/expenses/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ amount, category, date, comment })
    });
}

// ================= DELETE MODALS =================
function showDeleteExpenseModal(id){
    currentDeleteId = id;
    new bootstrap.Modal(document.getElementById("deleteExpenseModal")).show();
}

async function confirmDelete(){
    await fetch(`/api/expenses/${currentDeleteId}`, { method:'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById("deleteExpenseModal")).hide();
    loadExpenses();
}

function showBulkDeleteExpenseModal(){
    const selected = Array.from(document.querySelectorAll('input.expense-checkbox:checked')).map(cb=>cb.value);
    if(!selected.length) return alert("No expenses selected.");
    currentBulkDeleteIds = selected;
    new bootstrap.Modal(document.getElementById("bulkDeleteExpenseModal")).show();
}

async function confirmBulkDelete(){
    await Promise.all(currentBulkDeleteIds.map(id =>
        fetch(`/api/expenses/${id}`, { method:'DELETE' })
    ));
    bootstrap.Modal.getInstance(document.getElementById("bulkDeleteExpenseModal")).hide();
    loadExpenses();
}

// ================= SELECT ALL =================
function toggleAll(){
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('input.expense-checkbox').forEach(cb=>cb.checked = checked);
}

// ================= INITIAL LOAD =================
async function initExpensesPage() {
    await loadExpenses();
}

window.onload = initExpensesPage;