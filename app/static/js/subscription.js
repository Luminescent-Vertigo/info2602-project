let subscriptionsData = [];
let currentEditId = null;
let currentDeleteId = null;
let currentBulkDeleteIds = [];
let monthlyChart = null;
let paymentChart = null;
let currentPage = 1;
let rowsPerPage = 8;

// ================= CHART THEME =================
function getTheme() {
    const styles = getComputedStyle(document.documentElement);

    return {
        chartBg: styles.getPropertyValue('--chart-bg').trim(),
        chartText: styles.getPropertyValue('--chart-text').trim(),
        chartGrid: styles.getPropertyValue('--chart-grid').trim(),
        chartLegend: styles.getPropertyValue('--chart-legend').trim()
    };
}

// ---------------- Date Formatting ----------------
function formatDateForDisplay(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format date for <input type="date"> (yyyy-mm-dd)
function formatDateForInput(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ================= LOAD DATA =================
async function loadSubscriptions() {
    try {
        const res = await fetch("/api/subscriptions");

        if (!res.ok) {
            throw new Error("API error");
        }

        const data = await res.json();

        console.log("subscriptions:", data);

        subscriptionsData = data || [];

        currentPage = 1;

        renderMonthlyCostChart(subscriptionsData);
        renderUpcomingPaymentsChart(subscriptionsData);
        applyFilters();

    } catch (err) {
        console.error("Failed to load subscriptions:", err);
        document.getElementById("subscriptions-table").innerHTML =
            `<tr><td colspan="8">Failed to load data</td></tr>`;
    }
}

// ================= RENDER TABLE =================
function renderTable(data) {
    const table = document.getElementById("subscriptions-table");
    table.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const paginated = data.slice(start, start + rowsPerPage);

    paginated.forEach(sub => {
        const display = getDisplayStatus(sub);

        table.innerHTML += `
        <tr id="sub-${sub.id}"
            data-name="${sub.name}"
            data-cost="${sub.cost}"
            data-cycle="${sub.billing_cycle}"
            data-date="${sub.next_payment_date}">

            <td><input type="checkbox" class="sub-checkbox" value="${sub.id}"></td>
            <td>${sub.name}</td>
            <td>$${sub.cost}</td>
            <td>${sub.billing_cycle}</td>
            <td>${formatDateForDisplay(sub.next_payment_date)}
                <div class="text-muted small">
                    ${getCycleLabel(sub.next_payment_date)}
                </div>
            </td>
            <td>$${Number(sub.monthly_equivalent || 0).toFixed(2)}</td>
            <td><span class="badge bg-${display.color}">${display.label}</span></td>
            <td>
                <button class="btn btn-outline-primary px-3 py-2 me-1" onclick="populateEditModal(${sub.id})" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn btn-outline-danger px-3 py-2" onclick="showDeleteSubscriptionModal(${sub.id})" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                <button class="btn btn-success px-3 py-2" onclick="markPaid(${sub.id})" title="Pay">
                    <span class="material-symbols-outlined">payment</span>
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

    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1});return false;">&laquo;</a>
             </li>`;

    const maxVisible = 5;
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

    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1});return false;">&raquo;</a>
             </li>`;

    html += `</ul></nav>`;
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    applyFilters(false);
}

function changeRowsPerPage(value){
    rowsPerPage = parseInt(value);
    currentPage = 1;
    applyFilters(false);
}


// ================= FILTERS & SEARCH =================
function applyFilters(resetPage = true) {
    const statusEl = document.getElementById("filter-status");
    const billingEl = document.getElementById("filter-billing");
    const cycleRangeEl = document.getElementById("filter-cycle-range");
    const searchEl = document.getElementById("search-name");

    const status = statusEl ? statusEl.value : "";
    const billing = billingEl ? billingEl.value : "";
    const cycleRange = cycleRangeEl ? cycleRangeEl.value : "";
    const search = searchEl ? searchEl.value.toLowerCase() : "";

    let filtered = subscriptionsData;

    if (status) {
        filtered = filtered.filter(s => s.status === status);
    }

    if (billing) {
        filtered = filtered.filter(s => s.billing_cycle === billing);
    }

    if (cycleRange) {
        const [start, end] = cycleRange.split("|");

        filtered = filtered.filter(s => {
            const date = new Date(s.next_payment_date);
            return date >= new Date(start) && date <= new Date(end);
        });
    }

    if (search) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search)
        );
    }

    if (resetPage) currentPage = 1;
    renderTable(filtered);
}


// ================= COMPUTED FIELDS =================

function getCycleLabel(dateStr) {  
    const date = new Date(dateStr);  

    const start = new Date(date.getFullYear(), date.getMonth(), 1);  
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);  

    return `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} - ${end.getDate()}`;  
}

async function markPaid(id) {
    try {
        const res = await fetch(`/api/subscriptions/${id}/pay`, {
            method: "POST"
        });

        if (!res.ok) throw new Error("Failed to mark paid");

        showToast("Payment recorded");
        // reload fresh data from backend
        await loadSubscriptions();

    } catch (err) {
        console.error(err);
        alert("Failed to update payment status");
    }
}

function calculateMonthly(cost, cycle) {
    cost = parseFloat(cost) || 0;

    if (cycle === "monthly") return cost;
    if (cycle === "yearly") return cost / 12;

    return 0;
}

function calculateStatus(dateInput, isPaid) {
    if (isPaid) return "paid";

    if (!dateInput) return "active";

    const today = new Date();
    const paymentDate = new Date(dateInput);

    const diffDays = (paymentDate - today) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "due";
    return "active";
}

function loadCycleRanges() {
    const select = document.getElementById("filter-cycle-range");
    if (!select) return;

    select.innerHTML = `<option value="">Cycle Range</option>`;

    const year = new Date().getFullYear();

    const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    for (let m = 0; m < 12; m++) {

        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 0);

        const startISO = start.toISOString();
        const endISO = end.toISOString();

        const label = `${months[m]} ${start.getDate()} - ${end.getDate()}`;

        const option = document.createElement("option");
        option.value = `${startISO}|${endISO}`;
        option.textContent = label;

        select.appendChild(option);
    }
}

function getDisplayStatus(sub) {
    const now = new Date();

    // show paid only for a short time (e.g. 5 minutes)
    if (sub.last_paid_date) {
        const paid = new Date(sub.last_paid_date);
        const diffMinutes = (now - paid) / (1000 * 60);

        if (diffMinutes <= 5) {
            return { label: "Paid ✔", color: "success" };
        }
    }

    const next = new Date(sub.next_payment_date);
    const diffDays = (next - now) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
        return { label: "Overdue ⚠", color: "danger" };
    }

    if (diffDays <= 7) {
        return { label: "Due", color: "warning" };
    }

    return { label: "Active", color: "primary" };
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = 9999;
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}


// ================= EDIT MODAL =================
function populateEditModal(id) {
    currentEditId = id;
    const sub = subscriptionsData.find(s => s.id === id);
    if(!sub) return;

    document.getElementById("editName").value = sub.name;
    document.getElementById("editCost").value = sub.cost;
    document.getElementById("editCycle").value = sub.billing_cycle;
    document.getElementById("editDate").value = formatDateForInput(sub.next_payment_date);

    new bootstrap.Modal(document.getElementById("editSubscriptionModal")).show();
}


async function saveEdit() {
    const name = document.getElementById("editName").value;
    const cost = parseFloat(document.getElementById("editCost").value);
    const billing_cycle = document.getElementById("editCycle").value;
    const next_payment_date = document.getElementById("editDate").value;

    await fetch(`/api/subscriptions/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            name,
            cost,
            billing_cycle,
            next_payment_date
        })
    });

    // update local state AFTER success
    const idx = subscriptionsData.findIndex(s => s.id === currentEditId);

    if (idx > -1) {
        subscriptionsData[idx].name = name;
        subscriptionsData[idx].cost = cost;
        subscriptionsData[idx].billing_cycle = billing_cycle;
        subscriptionsData[idx].next_payment_date = next_payment_date;

        // recompute derived fields
        subscriptionsData[idx].monthly_equivalent =
            calculateMonthly(cost, billing_cycle);

        subscriptionsData[idx].status =
            calculateStatus(next_payment_date, subscriptionsData[idx].is_paid);
    }

    bootstrap.Modal.getInstance(
        document.getElementById("editSubscriptionModal")
    ).hide();

    // single source of truth render
    applyFilters();
}

// ================= CHARTS =================
// Monthly Cost Bar Chart
function renderMonthlyCostChart(data) {

    const theme = getTheme();

    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = Highcharts.chart('monthlyCostChart', {
        chart: { type: 'bar' , backgroundColor: theme.chartBg},
        title: { text: '' },
        xAxis: {
            categories: data.map(s => s.name),
            title: { text: 'Subscriptions', style: { color: theme.chartText }},
            labels: {
                style: { color: theme.chartText }
            },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
        },

        yAxis: {
            title: { 
                text: 'Monthly Cost ($)',             
                style: { color: theme.chartText },
            },
            labels: {
                style: { color: theme.chartText }
            },
            gridLineColor: theme.chartGrid
        },
        legend: {
            itemStyle: {
                color: theme.chartLegend
            }
        },
        tooltip: {
            shared: true,
            valuePrefix: '$'
        },
        series: [{
            name: 'Monthly Cost',
            data: data.map(s => Number(s.monthly_equivalent || 0))//values
        }],

        credits: { enabled: false }
    });
}

// Upcoming Payments Line Chart
function groupPaymentsByMonth(data) {
    const grouped = {};

    data.forEach(sub => {
        const rawDate = sub.next_payment_date;

        if (!rawDate) return;

        const date = new Date(rawDate);
        if (isNaN(date)) return;

        const month = date.toLocaleString('default', {
            month: 'short',
            year: 'numeric'
        });

        // use monthly_equivalent instead of cost
        grouped[month] = (grouped[month] || 0) + Number(sub.monthly_equivalent || 0);
    });

    return grouped;
}

function renderUpcomingPaymentsChart(data) {
    const theme = getTheme();
    const grouped = groupPaymentsByMonth(data);

    const sorted = Object.entries(grouped).sort(
        (a, b) => new Date(a[0]) - new Date(b[0])
    );

    const categories = sorted.map(x => x[0]);
    const values = sorted.map(x => x[1]);

    if (paymentChart) paymentChart.destroy();


    paymentChart = Highcharts.chart('upcomingPaymentsChart', {
        chart: {
            type: 'line',
            backgroundColor: theme.chartBg
        },

        title: { text: '' },

        xAxis: {
            categories,
            title: { 
                text: 'Month',
                style: { color: theme.chartText }
            },
            labels: {
                style: { color: theme.chartText }
            },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
        },

        yAxis: {
            title: { 
                text: 'Total Monthly Spend ($)',
                style: { color: theme.chartText } 
            },
            labels: {
                style: { color: theme.chartText }
            },
            gridLineColor: theme.chartGrid
        },
        legend: {
            itemStyle: {
                color: theme.chartLegend
            }
        },
        series: [{
            name: 'Upcoming Payments',
            data: values
        }],

        credits: { enabled: false }
    });
}

// ================= DELETE =================
function showDeleteSubscriptionModal(id){
    currentDeleteId = id;
    new bootstrap.Modal(document.getElementById("deleteSubscriptionModal")).show();
}

async function confirmDelete(){
    await fetch(`/api/subscriptions/${currentDeleteId}`, { method:'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById("deleteSubscriptionModal")).hide();
    loadSubscriptions();
}


// ================= BULK DELETE =================
function showBulkDeleteSubscriptionsModal(){
    const selected = Array.from(document.querySelectorAll('.sub-checkbox:checked')).map(cb => cb.value);
    if(!selected.length) return alert("No subscriptions selected.");

    currentBulkDeleteIds = selected;
    new bootstrap.Modal(document.getElementById("bulkDeleteSubscriptionModal")).show();
}

async function confirmBulkDelete(){
    await Promise.all(currentBulkDeleteIds.map(id =>
        fetch(`/api/subscriptions/${id}`, { method:'DELETE' })
    ));
    bootstrap.Modal.getInstance(document.getElementById("bulkDeleteSubscriptionModal")).hide();
    loadSubscriptions();
}


// ================= SELECT ALL =================
function toggleAll(){
    const checked = document.getElementById('selectAll').checked;
    document.querySelectorAll('.sub-checkbox').forEach(cb => cb.checked = checked);
}


// ================= INIT =================
async function initSubscriptionsPage() {
    await loadSubscriptions();
    loadCycleRanges();
}

window.onload = initSubscriptionsPage;

window.addEventListener("themeChanged", () => {
    if (!subscriptionsData.length) return;

    renderMonthlyCostChart(subscriptionsData);
    renderUpcomingPaymentsChart(subscriptionsData);
});