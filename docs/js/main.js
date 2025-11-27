async function fetchDataAndRenderChart() {
    const sheetId = '2PACX-1vQ-Dy_54CZsn92P8-bLwcPLwlBNckYe8do8Um21aLFIaof3jfN8G7V_FMHnc1b3Rb7vc5mNhUOqBuQD';
    const gid = '0'; // New GID for the published sheet
    const csvUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${gid}&single=true&output=csv`;

    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        
        // Parse CSV using PapaParse (NO HEADERS)
        const result = Papa.parse(csvText, {
            header: false, // Important: Data has no headers
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const rows = result.data;
        
        const labels = [];
        const dataPoints = [];
        
        // 1. Extract all valid data first
        const parsedData = [];
        rows.forEach(row => {
            const unixTime = row[0];
            const val = row[1];
            if (unixTime && val !== null && val !== undefined) {
                parsedData.push({
                    date: new Date(unixTime * 1000),
                    value: val,
                    timestamp: unixTime * 1000
                });
            }
        });

        if (parsedData.length === 0) {
             console.warn("No valid data found.");
             return;
        }

        // 2. Find the latest timestamp in the dataset
        // We assume data might not be sorted, so we find the max.
        const latestTimestamp = Math.max(...parsedData.map(d => d.timestamp));
        const twentyFourHoursAgo = latestTimestamp - (24 * 60 * 60 * 1000);

        // Calculate Stats
        calculateStats(parsedData, latestTimestamp);

        // 3. Filter based on the LATEST data point, not "now"
        parsedData.forEach(d => {
            if (d.timestamp >= twentyFourHoursAgo) {
                labels.push(d.date);
                dataPoints.push(d.value);
            }
        });
        
        // 4. Sort by date (just in case CSV isn't sorted)
        // Chart.js works best with sorted time data
        const combined = labels.map((l, i) => ({ label: l, data: dataPoints[i] }));
        combined.sort((a, b) => a.label - b.label);
        
        const sortedLabels = combined.map(c => c.label);
        const sortedData = combined.map(c => c.data);

        renderChart(sortedLabels, sortedData);

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('chart-container').innerHTML = '<p style="color:red; text-align:center;">Error loading graph data.</p>';
    }
}

function calculateStats(data, latestTimestamp) {
    // NEW LOGIC: "Arrivals" based on positive deltas.
    // If count goes 4 -> 5, that's +1 visitor.
    // If count goes 5 -> 4, that's 0 new visitors (someone left).
    // We also calculate Peak (Max) for the 24h period.

    let est24h = 0;
    let peak24h = 0;
    let est7d = 0;
    let estTotal = 0;

    const oneDay = 24 * 60 * 60 * 1000;
    
    // Sort data by time ascending (oldest first) to calculate deltas correctly
    // (The main logic sorts for chart, but let's ensure we have a sorted copy here)
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    let prevVal = 0;

    sortedData.forEach(d => {
        const age = latestTimestamp - d.timestamp;
        const val = d.value;

        // 1. Calculate "New Arrivals" (Delta)
        // If this is the very first point, assume 'val' visitors arrived (or 0? Let's use val to start)
        // Actually, for a "Total", starting at 0 is safer, but if the first sample is 100, we missed those 100 arrivals.
        // Let's assume delta = val for the first point, or max(0, val - prevVal).
        
        let delta = 0;
        if (val > prevVal) {
            delta = val - prevVal;
        }
        prevVal = val; // Update for next loop

        // 2. Add to totals based on age
        estTotal += delta;
        if (age <= 7 * oneDay) est7d += delta;
        if (age <= oneDay) {
            est24h += delta;
            // 3. Track Peak for 24h
            if (val > peak24h) peak24h = val;
        }
    });

    // Update DOM
    document.getElementById('stat-24h').innerText = est24h.toLocaleString();
    document.getElementById('stat-peak').innerText = peak24h.toLocaleString(); // Peak
    document.getElementById('stat-7d').innerText = est7d.toLocaleString();
    document.getElementById('stat-total').innerText = estTotal.toLocaleString();
}

function renderChart(labels, data) {
    const ctx = document.getElementById('visitorChart').getContext('2d');
    
    // Blue Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 176, 255, 0.8)'); // Sky Blue at top
    gradient.addColorStop(1, 'rgba(0, 176, 255, 0.2)'); // Lighter Sky Blue at bottom

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // Date objects
            datasets: [{
                label: 'Visitors Detected',
                data: data,
                borderColor: '#00b0ff', // Sky Blue
                backgroundColor: gradient,
                borderWidth: 1, // Thinner line
                pointRadius: 0, 
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false // Hide legend for clean look
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#a0a0a0',
                    borderColor: '#333',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    grid: {
                        display: false,
                        borderColor: '#333'
                    },
                    ticks: {
                        color: '#a0a0a0',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: '#333',
                        borderDash: [5, 5]
                    },
                    ticks: {
                        color: '#a0a0a0',
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

// Init
document.addEventListener('DOMContentLoaded', fetchDataAndRenderChart);
