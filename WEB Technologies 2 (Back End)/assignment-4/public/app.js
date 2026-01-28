// API Base URL
const API_BASE_URL = window.location.origin + '/api';

// Global variables
let currentChart = null;
let allFieldsChart = null;

// DOM Elements
const fieldSelect = document.getElementById('fieldSelect');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const loadDataBtn = document.getElementById('loadDataBtn');
const loadMetricsBtn = document.getElementById('loadMetricsBtn');
const loadAllFieldsBtn = document.getElementById('loadAllFieldsBtn');
const clearBtn = document.getElementById('clearBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const statsPanel = document.getElementById('statsPanel');
const chartPanel = document.getElementById('chartPanel');
const allFieldsChartPanel = document.getElementById('allFieldsChartPanel');
const infoPanel = document.getElementById('infoPanel');
const dataInfo = document.getElementById('dataInfo');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInputs();
    attachEventListeners();
    loadAvailableDateRange();
});

/**
 * Initialize date inputs with default values
 */
function initializeDateInputs() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    endDateInput.value = formatDate(today);
    startDateInput.value = formatDate(thirtyDaysAgo);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Attach event listeners to buttons
 */
function attachEventListeners() {
    loadDataBtn.addEventListener('click', handleLoadData);
    loadMetricsBtn.addEventListener('click', handleLoadMetrics);
    loadAllFieldsBtn.addEventListener('click', handleLoadAllFields);
    clearBtn.addEventListener('click', handleClear);
}

/**
 * Load available date range from the API
 */
async function loadAvailableDateRange() {
    try {
        const response = await fetch(`${API_BASE_URL}/measurements/date-range`);
        if (response.ok) {
            const data = await response.json();
            startDateInput.min = data.minDate;
            startDateInput.max = data.maxDate;
            endDateInput.min = data.minDate;
            endDateInput.max = data.maxDate;
        }
    } catch (error) {
        console.error('Error loading date range:', error);
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    loadingIndicator.style.display = 'flex';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    loadingIndicator.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

/**
 * Handle Load Data button click
 */
async function handleLoadData() {
    const field = fieldSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date must be before end date');
        return;
    }

    showLoading();

    try {
        const url = `${API_BASE_URL}/measurements?field=${field}&start_date=${startDate}&end_date=${endDate}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch data');
        }

        const data = await response.json();

        if (data.length === 0) {
            showError('No data found for the selected criteria');
            hideLoading();
            return;
        }

        displayTimeSeriesChart(data, field);
        showDataInfo(data, field);
        showSuccess(`Loaded ${data.length} data points successfully!`);

        // Hide all fields chart if visible
        allFieldsChartPanel.style.display = 'none';

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Handle Load Metrics button click
 */
async function handleLoadMetrics() {
    const field = fieldSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date must be before end date');
        return;
    }

    showLoading();

    try {
        const url = `${API_BASE_URL}/measurements/metrics?field=${field}&start_date=${startDate}&end_date=${endDate}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch metrics');
        }

        const metrics = await response.json();
        displayMetrics(metrics);
        showSuccess('Metrics loaded successfully!');

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Handle Load All Fields button click
 */
async function handleLoadAllFields() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
        showError('Please select both start and end dates');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        showError('Start date must be before end date');
        return;
    }

    showLoading();

    try {
        const url = `${API_BASE_URL}/measurements/all-fields?start_date=${startDate}&end_date=${endDate}`;
        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch data');
        }

        const data = await response.json();

        if (data.length === 0) {
            showError('No data found for the selected criteria');
            hideLoading();
            return;
        }

        displayAllFieldsChart(data);
        showDataInfo(data, 'all fields');
        showSuccess(`Loaded ${data.length} data points for all fields!`);

        // Hide single field chart and stats if visible
        chartPanel.style.display = 'none';
        statsPanel.style.display = 'none';

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Handle Clear button click
 */
function handleClear() {
    // Destroy existing charts
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    if (allFieldsChart) {
        allFieldsChart.destroy();
        allFieldsChart = null;
    }

    // Hide panels
    chartPanel.style.display = 'none';
    allFieldsChartPanel.style.display = 'none';
    statsPanel.style.display = 'none';
    infoPanel.style.display = 'none';
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Reset inputs
    initializeDateInputs();
    fieldSelect.selectedIndex = 0;

    showSuccess('Dashboard cleared!');
}

/**
 * Display time series chart for single field
 */
function displayTimeSeriesChart(data, field) {
    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('timeSeriesChart').getContext('2d');

    const labels = data.map(item => new Date(item.timestamp).toLocaleString());
    const values = data.map(item => item[field]);

    const fieldLabels = {
        field1: 'Temperature (°C)',
        field2: 'Humidity (%)',
        field3: 'CO2 (ppm)'
    };

    const fieldColors = {
        field1: 'rgba(239, 68, 68, 0.8)',
        field2: 'rgba(59, 130, 246, 0.8)',
        field3: 'rgba(16, 185, 129, 0.8)'
    };

    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: fieldLabels[field] || field,
                data: values,
                borderColor: fieldColors[field],
                backgroundColor: fieldColors[field].replace('0.8', '0.2'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: fieldLabels[field] || 'Value'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    chartPanel.style.display = 'block';
    chartPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Display chart with all fields
 */
function displayAllFieldsChart(data) {
    // Destroy existing chart
    if (allFieldsChart) {
        allFieldsChart.destroy();
    }

    const ctx = document.getElementById('allFieldsChart').getContext('2d');

    const labels = data.map(item => new Date(item.timestamp).toLocaleString());

    allFieldsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: data.map(item => item.field1),
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'y1'
                },
                {
                    label: 'Humidity (%)',
                    data: data.map(item => item.field2),
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'y2'
                },
                {
                    label: 'CO2 (ppm)',
                    data: data.map(item => item.field3),
                    borderColor: 'rgba(16, 185, 129, 0.8)',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'y3'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    grid: {
                        drawOnChartArea: true
                    }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Humidity (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y3: {
                    type: 'linear',
                    display: false,
                    position: 'right'
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    allFieldsChartPanel.style.display = 'block';
    allFieldsChartPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Display statistical metrics
 */
function displayMetrics(metrics) {
    document.getElementById('statField').textContent = metrics.field.toUpperCase();
    document.getElementById('statCount').textContent = metrics.count.toLocaleString();
    document.getElementById('statAvg').textContent = metrics.avg.toFixed(2);
    document.getElementById('statMin').textContent = metrics.min.toFixed(2);
    document.getElementById('statMax').textContent = metrics.max.toFixed(2);
    document.getElementById('statStdDev').textContent = metrics.stdDev.toFixed(2);
    document.getElementById('statRange').textContent = metrics.range.toFixed(2);

    if (metrics.dateRange) {
        document.getElementById('statDateRange').textContent =
            `${metrics.dateRange.start} to ${metrics.dateRange.end}`;
    } else {
        document.getElementById('statDateRange').textContent = 'All data';
    }

    statsPanel.style.display = 'block';
    statsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Show data information
 */
function showDataInfo(data, field) {
    const startDate = new Date(data[0].timestamp).toLocaleDateString();
    const endDate = new Date(data[data.length - 1].timestamp).toLocaleDateString();

    dataInfo.innerHTML = `
        <strong>Data Points:</strong> ${data.length}<br>
        <strong>Field:</strong> ${field}<br>
        <strong>Date Range:</strong> ${startDate} - ${endDate}<br>
        <strong>First Record:</strong> ${new Date(data[0].timestamp).toLocaleString()}<br>
        <strong>Last Record:</strong> ${new Date(data[data.length - 1].timestamp).toLocaleString()}
    `;

    infoPanel.style.display = 'block';
}

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('An unexpected error occurred. Please try again.');
});

// Log when the app is ready
console.log('Analytical Platform initialized successfully!');
console.log('API Base URL:', API_BASE_URL);
