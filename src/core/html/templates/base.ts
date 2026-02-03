export const htmlTemplate = (historyData: string, currentData: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cocov Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h1 { margin-top: 0; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { color: #666; }
        .chart-container { height: 300px; width: 100%; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Cocov Intelligence Dashboard</h1>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value" id="lines-val">0%</div>
                    <div class="metric-label">Lines</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="statements-val">0%</div>
                    <div class="metric-label">Statements</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="functions-val">0%</div>
                    <div class="metric-label">Functions</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="branches-val">0%</div>
                    <div class="metric-label">Branches</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Coverage Trends</h2>
            <canvas id="trendChart"></canvas>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const history = ${historyData};
        const current = ${currentData};

        // Render Metrics
        document.getElementById('lines-val').innerText = current.total.lines.pct + '%';
        document.getElementById('statements-val').innerText = current.total.statements.pct + '%';
        document.getElementById('functions-val').innerText = current.total.functions.pct + '%';
        document.getElementById('branches-val').innerText = current.total.branches.pct + '%';

        // Render Trends
        const ctx = document.getElementById('trendChart').getContext('2d');
        const timestamps = history.map(h => new Date(h.timestamp).toLocaleDateString() + ' ' + new Date(h.timestamp).toLocaleTimeString());
        const dataLines = history.map(h => h.metrics.lines.pct);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Lines Coverage',
                    data: dataLines,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
</body>
</html>
`;
