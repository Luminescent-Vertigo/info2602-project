let analyticsData = null;
let emptyChart = null;
let incVsExpChart = null;
let catPieChart = null;
let weeklySpendChart = null;
let monthlyCompChart = null;


document.addEventListener("DOMContentLoaded", function () {
    loadAnalytics();
});

function getTheme() {
    const styles = getComputedStyle(document.documentElement);

    return {
        chartBg: styles.getPropertyValue('--chart-bg').trim(),
        chartText: styles.getPropertyValue('--chart-text').trim(),
        chartGrid: styles.getPropertyValue('--chart-grid').trim(),
        chartLegend: styles.getPropertyValue('--chart-legend').trim()
    };
}


function populateMonths() {
    const monthSelect = document.getElementById("monthFilter");

    if (!monthSelect) return;

    const months = [
        "01","02","03","04","05","06",
        "07","08","09","10","11","12"
    ];

    const labels = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    monthSelect.innerHTML = `<option value="">All Months</option>`;

    months.forEach((m, i) => {
        const option = document.createElement("option");
        option.value = m;
        option.textContent = labels[i];
        monthSelect.appendChild(option);
    });
}

function loadAnalytics(useFilters = true) {

    let month = "";
    let start = "";
    let end = "";

    if (useFilters) {
        month = document.getElementById("monthFilter")?.value;
        start = document.getElementById("startDate")?.value;
        end = document.getElementById("endDate")?.value;
    }

    let url = "/api/analytics";
    const params = [];

    if (month) params.push(`month=${month}`);
    if (start) params.push(`start=${start}`);
    if (end) params.push(`end=${end}`);

    if (params.length > 0) {
        url += "?" + params.join("&");
    }

    console.log("URL:", url);
    console.log("Filters:", { month, start, end });

    // destroy existing charts first
    if (incVsExpChart) incVsExpChart.destroy();
    if (weeklySpendChart) weeklySpendChart.destroy();
    if (monthlyCompChart) monthlyCompChart.destroy();
    if (catPieChart) catPieChart.destroy();

    // then show loading text
    ["lineChart","weeklyChart","monthlyChart","categoryPie"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "Loading...";
    });

    fetch(url)
        .then(res => res.json())
        .then(data => {

            analyticsData = data;

            console.log("Weekly:", data.charts.weekly);
            console.log("Burn rate:", data.summary.burn_rate);

            // ======================
            // SUMMARY CARDS
            // ======================
            setMoney("totalIncome", data.summary.total_income);
            setMoney("totalExpenses", data.summary.total_expenses);
            setMoney("netBalance", data.summary.net);
            setMoney("subscriptions", data.summary.subscriptions);

            const summary = data?.summary || {};
            console.log("SUMMARY:", data.summary);

            const burn = summary.burn_rate ?? 0;
            const income = summary.total_income ?? 0;

            // correct placement
            const daily = burn.toFixed(2);
            const percent = income > 0
                ? ((burn / income) * 100).toFixed(1)
                : 0;

            let burnText = `$${daily}/day (${percent}% of income)`;

            // fallback message
            if (burn === 0 && income === 0) {
                burnText = "No income or expense data";
            }

            document.getElementById("burnRateText").innerText = burnText;

            // ======================
            // INSIGHTS
            // ======================
            renderInsights(data.insights);

            // ======================
            // CHARTS
            // ======================
            const charts = data.charts || {};

            // LINE + BAR
            if (charts.monthly?.categories?.length) {
                renderLineChart(charts.monthly);
                renderBarChart(charts.monthly);
            } else {
                renderEmptyChart("lineChart", "No data");
                renderEmptyChart("monthlyChart", "No data");
            }

            // PIE
            if (charts.category_pie && charts.category_pie.length > 0) {
                renderPieChart(charts.category_pie);
            } else {
                renderEmptyChart("categoryPie", "No category data");
            }

            // WEEKLY  
            const weekly = charts.weekly;

            // 🔍 Debug (keep this)
            console.log("Weekly:", weekly);

            if (!weekly || !Array.isArray(weekly.categories) || weekly.categories.length === 0) {
                renderEmptyChart("weeklyChart", "No data for selected range");
            } else {
                renderWeeklyChart({
                    categories: weekly.categories,
                    data: weekly.data || []
                });
            }

            /* renderWeeklyChart({
                categories: categories,
                data: weeklyData
            }); */
        })
        .catch(err => {
            console.error("Analytics load error:", err);
        });
}

// ======================
// HELPERS
// ======================
function setMoney(id, value) {
    document.getElementById(id).innerText =
        "$" + Number(value || 0).toLocaleString();
}

function renderEmptyChart(container, message) {
    const theme = getTheme();

    //if (emptyChart) emptyChart.destroy();

    Highcharts.chart(container, {
        chart: {
            backgroundColor: theme.chartBg
        },
        title: {
            text: message,
            style: { color: theme.chartText }
        },
        series: [], 
        credits: { enabled: false }
    });
}

// ======================
// INSIGHTS
// ======================
function renderInsights(insights) {
    const container = document.getElementById("insightsContainer");
    container.innerHTML = "";

    (insights || []).forEach(text => {
        container.innerHTML += `<p class="mb-2">• ${text}</p>`;
    });
}

// ======================
// LINE CHART
// ======================
function renderLineChart(data) {
    const theme = getTheme();

    //if (incVsExpChart) incVsExpChart.destroy();

    incVsExpChart = Highcharts.chart("lineChart", {
        chart: { type: "line", backgroundColor: theme.chartBg },
        title: { text: "" },

        xAxis: { 
            categories: data.categories,
            labels: {style: { color: theme.chartText } },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
         },

        yAxis: {
            title: { 
                text: "Amount ($)",
                style: { color: theme.chartText }
            },
            labels: {
                style: { color: theme.chartText }
            },
            gridLineColor: theme.chartGrid
        },
        legend: {
            itemStyle: { color: theme.chartLegend }
        },
        series: [
            { name: "Income", data: data.income },
            { name: "Expenses", data: data.expenses }
        ],
        credits: { enabled: false }
    });
}

// ======================
// PIE
// ======================
function renderPieChart(data) {
    const theme = getTheme();

    //if (catPieChart) catPieChart.destroy();

    catPieChart = Highcharts.chart("categoryPie", {
        chart: { type: "pie", backgroundColor: theme.chartBg },
        title: { text: "" },
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
            itemStyle: { color: theme.chartLegend }
        },
        series: [{
            name: "Spending",
            colorByPoint: true,
            data: data
        }],
        credits: { enabled: false }
    });
}

// ======================
// WEEKLY CHART
// ======================
function renderWeeklyChart(data) {
    const theme = getTheme();

    //if (weeklySpendChart) weeklySpendChart.destroy();

    weeklySpendChart = Highcharts.chart("weeklyChart", {
        chart: { type: "line", backgroundColor: theme.chartBg },
        title: { text: "" },

        xAxis: {
            categories: data.categories,
            title: { text: "Week", style: { color: theme.chartText } },
            labels: { style: { color: theme.chartText } },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
        },

        yAxis: {
            title: { text: "Amount ($)", 
                style: { color: theme.chartText } 
            },
            labels: {
                style: { color: theme.chartText }
            },
            gridLineColor: theme.chartGrid
        },
        legend: {
            itemStyle: { color: theme.chartLegend }
        },
        series: [{
            name: "Weekly Spending",
            data: data.data
        }],

        credits: { enabled: false }
    });
}

// ======================
// BAR CHART
// ======================
function renderBarChart(data) {
    const theme = getTheme();

    //if (monthlyCompChart) monthlyCompChart.destroy();

    monthlyCompChart = Highcharts.chart("monthlyChart", {
        chart: { type: "column", backgroundColor: theme.chartBg },
        title: { text: "" },

        xAxis: { 
            categories: data.categories, 
            labels: { style: { color: theme.chartText } },
            lineColor: theme.chartGrid,
            tickColor: theme.chartGrid
        },


        yAxis: {
            title: { 
                text: "Amount ($)",
                style: { color: theme.chartText }
            },
            labels: {
                style: { color: theme.chartText }
            },
            gridLineColor: theme.chartGrid
        },
        legend: {
            itemStyle: { color: theme.chartLegend }
        },

        series: [
            { name: "Income", data: data.income },
            { name: "Expenses", data: data.expenses }
        ],
        credits: { enabled: false }
    });
}

window.addEventListener("themeChanged", () => {
    if (!analyticsData) return;

    const charts = analyticsData.charts || {};

    // LINE + BAR
    if (charts.monthly?.categories?.length) {
        renderLineChart(charts.monthly);
        renderBarChart(charts.monthly);
    } else {
        renderEmptyChart("lineChart", "No data");
        renderEmptyChart("monthlyChart", "No data");
    }

    // PIE
    if (charts.category_pie && charts.category_pie.length > 0) {
        renderPieChart(charts.category_pie);
    } else {
        renderEmptyChart("categoryPie", "No category data");
    }

    // WEEKLY
    const weekly = charts.weekly;

    if (!weekly || !Array.isArray(weekly.categories) || weekly.categories.length === 0) {
        renderEmptyChart("weeklyChart", "No data for selected range");
    } else {
        renderWeeklyChart({
            categories: weekly.categories,
            data: weekly.data || []
        });
    }
});