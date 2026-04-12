let dashboardData = null;

let expenseChart = null;
let monthlyChart = null;

function getTheme() {
    const styles = getComputedStyle(document.documentElement);

    return {
        chartBg: styles.getPropertyValue('--chart-bg').trim(),
        chartText: styles.getPropertyValue('--chart-text').trim(),
        chartGrid: styles.getPropertyValue('--chart-grid').trim(),
        chartLegend: styles.getPropertyValue('--chart-legend').trim()
    };
}

// ================= LOAD DASHBOARD =================
async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    dashboardData = await res.json();

    renderSummary(dashboardData.summary);
    renderCharts(dashboardData.charts);
    renderAlerts(dashboardData.alerts);
    renderInsights(dashboardData.insights);

    window.dashboardData = dashboardData;
}

window.onload = loadDashboard;


// ================= SUMMARY =================
function renderSummary(summary) {
    document.getElementById("totalIncome").innerText = "$" + summary.total_income;
    document.getElementById("totalExpenses").innerText = "$" + summary.total_expenses;
    document.getElementById("remainingBalance").innerText = "$" + summary.remaining_balance;
    document.getElementById("burnRate").innerText = "$" + summary.burn_rate;
}


// ================= CHARTS =================
function renderCharts(charts) {

    const theme = getTheme();

    if (expenseChart) expenseChart.destroy();


    // ===== PIE CHART =====
    expenseChart = Highcharts.chart('expensePie', {
        chart: { type: 'pie' , backgroundColor: theme.chartBg},
        title: { text: '' },
        tooltip: {
            pointFormat: '{series.name}: <b>${point.y:.2f}</b>'
        },
        plotOptions: {
            pie: {
                dataLabels: {
                    style: {
                        color: theme.chartText
                    }
                }
            }
        },
        legend: {
            itemStyle: {
                color: theme.chartLegend
            }
        },
        series: [{
            name: 'Expenses',
            data: charts.expense_pie
        }],
        credits: { enabled: false },
    });

    // ===== BAR CHART =====
    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = Highcharts.chart('monthlyBar', {
        chart: { type: 'column', backgroundColor: theme.chartBg},
        title: { text: '' },
        xAxis: {
            categories: charts.monthly.categories,
            labels: {
                style: { color: theme.chartText }
            },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
        },
        yAxis: {
            title: {
                text: 'Amount ($)',
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
        series: [
            {
                name: 'Income',
                data: charts.monthly.income
            },
            {
                name: 'Expenses',
                data: charts.monthly.expenses
            }
        ],
        credits: { enabled: false },
    });
}


// ================= ALERTS =================
function renderAlerts(alerts) {
    const container = document.getElementById("alertsContainer");
    container.innerHTML = "";

    if (!alerts || alerts.length === 0) {
        container.innerHTML = `<p class="text-muted">No alerts 🎉</p>`;
        return;
    }

    alerts.forEach(alert => {
        container.innerHTML += `
            <div class="alert alert-warning py-2 px-3 mb-2">
                ${alert}
            </div>
        `;
    });
}


// ================= INSIGHTS =================
function renderInsights(insights) {
    const container = document.getElementById("insightsContainer");
    container.innerHTML = "";

    if (!insights || insights.length === 0) {
        container.innerHTML = `<p class="text-muted">No insights yet</p>`;
        return;
    }

    insights.forEach(insight => {
        container.innerHTML += `
            <div class="mb-2">
                💡 ${insight}
            </div>
        `;
    });
}

window.addEventListener("themeChanged", () => {
    if (!dashboardData) return;
    renderCharts(dashboardData.charts);
});