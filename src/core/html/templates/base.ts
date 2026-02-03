export const htmlTemplate = (historyData: string, currentData: string, detailedData: string = '{}'): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cocov Intelligence</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg: #0f1115;
            --surface: #181b21;
            --surface-glass: rgba(24, 27, 33, 0.7);
            --primary: #6366f1;
            --secondary: #ec4899;
            --accent: #8b5cf6;
            --success: #22c55e;
            --warning: #eab308;
            --error: #ef4444;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --border: #2d3139;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            /* Subtle grid background */
            background-image: linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: -1px -1px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Glassmorphism Cards */
        .card {
            background: var(--surface-glass);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            border-color: var(--primary);
        }

        /* Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        h1, h2, h3 { margin: 0; font-weight: 600; }
        
        .logo {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.5rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Grid Layout */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        /* Metrics */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        @media (max-width: 768px) {
            .metrics-grid { grid-template-columns: 1fr 1fr; }
        }

        .metric {
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0.5rem 0;
            font-family: 'JetBrains Mono', monospace;
        }

        .metric-label {
            color: var(--text-dim);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.1em;
        }

        /* Chart */
        .chart-container {
            position: relative;
            height: 400px;
            width: 100%;
        }

        /* Tables */
        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        th {
            cursor: pointer;
            color: var(--text-dim);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
        }

        th:hover { color: var(--text-main); }

        .file-path {
            font-family: 'JetBrains Mono', monospace;
            color: var(--primary);
        }

        .progress-bar {
            height: 6px;
            background: var(--surface);
            border-radius: 3px;
            overflow: hidden;
            width: 100px;
        }

        .progress-fill {
            height: 100%;
            border-radius: 3px;
        }

        /* Search */
        .search-bar {
            width: 100%;
            padding: 0.75rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            margin-bottom: 1rem;
        }

        .search-bar:focus {
            outline: none;
            border-color: var(--primary);
        }

        /* Utility */
        .text-green { color: var(--success); }
        .text-yellow { color: var(--warning); }
        .text-red { color: var(--error); }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">COCOV INTELLIGENCE</div>
            <div style="color: var(--text-dim); font-size: 0.9rem;">v2.0</div>
        </header>

        <!-- Overview Cards -->
        <div class="metrics-grid">
            <div class="card metric">
                <div class="metric-label">Lines</div>
                <div class="metric-value" id="lines-val">--%</div>
                <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="lines-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Statements</div>
                <div class="metric-value" id="statements-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="statements-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Functions</div>
                <div class="metric-value" id="functions-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="functions-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Branches</div>
                <div class="metric-value" id="branches-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="branches-bar"></div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Velocity & Trends</h2>
                    <span style="font-size: 0.8rem; color: var(--text-dim);">Scroll to zoom</span>
                </div>
                <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </div>

        <!-- File Explorer -->
        <div class="card">
            <h2>File Explorer</h2>
            <input type="text" id="fileSearch" class="search-bar" placeholder="Search files..." style="margin-top: 1rem;">
            <div class="table-container">
                <table id="fileTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable(0)">File</th>
                            <th onclick="sortTable(1)">Lines</th>
                            <th onclick="sortTable(2)">Statements</th>
                            <th onclick="sortTable(3)">Funcs</th>
                            <th onclick="sortTable(4)">Branches</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <!-- Injected via JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Scripts: Chart.js + Zoom Plugin -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>

    <script>
        const history = ${historyData};
        const current = ${currentData};
        const detailed = ${detailedData};

        // --- Utils ---
        const getColor = (pct) => pct >= 90 ? '#22c55e' : (pct >= 80 ? '#eab308' : '#ef4444');
        
        // --- Render Metrics ---
        // Lines
        const lnPct = current.total.lines.pct;
        document.getElementById('lines-val').innerText = lnPct + '%';
        document.getElementById('lines-val').style.color = getColor(lnPct);
        document.getElementById('lines-bar').style.backgroundColor = getColor(lnPct);
        document.getElementById('lines-bar').style.width = lnPct + '%';

        // Statements
        const stPct = current.total.statements.pct;
        document.getElementById('statements-val').innerText = stPct + '%';
        document.getElementById('statements-val').style.color = getColor(stPct);
        document.getElementById('statements-bar').style.backgroundColor = getColor(stPct);
        document.getElementById('statements-bar').style.width = stPct + '%';
        
        // Functions
        const fnPct = current.total.functions.pct;
        document.getElementById('functions-val').innerText = fnPct + '%';
        document.getElementById('functions-val').style.color = getColor(fnPct);
        document.getElementById('functions-bar').style.backgroundColor = getColor(fnPct);
        document.getElementById('functions-bar').style.width = fnPct + '%';
        
        // Branches
        const brPct = current.total.branches.pct;
        document.getElementById('branches-val').innerText = brPct + '%';
        document.getElementById('branches-val').style.color = getColor(brPct);
        document.getElementById('branches-bar').style.backgroundColor = getColor(brPct);
        document.getElementById('branches-bar').style.width = brPct + '%';

        // --- Render Charts ---
        const ctx = document.getElementById('trendChart').getContext('2d');
        const timestamps = history.map(h => new Date(h.timestamp).toLocaleDateString());
        const dataLines = history.map(h => h.metrics.lines.pct);
        
        // Gradient for Line Chart
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // primary
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Lines Coverage',
                    data: dataLines,
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#2d3139' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: '#2d3139' }, ticks: { color: '#94a3b8' }, min: 0, max: 100 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#181b21',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: '#2d3139',
                        borderWidth: 1
                    },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                }
            }
        });

        // --- Render Table ---
        const tbody = document.getElementById('tableBody');
        const rows = Object.entries(detailed || {}).map(([path, data]) => {
            // Istanbul coverage-final.json structure is complex. 
            // We usually need a summarizer to get pct from this. 
            // However, we passed detailedJSON which is raw istanbul. Without parsing logic, we can't easily get PCT.
            // Wait, we need the SUMMARY per file, not detailed line hits.
            // If detailed is just coverage-final.json, we need to calculate pct.
            // For simplicity in this template version, we'll try to calculate simplified coverage or mock if complex parsing is needed client-side.
            
            // Actually, usually tools generate a per-file summary too. 
            // If we don't have it, we can calculate lines covered / total.
            
            const lines = Object.values(data.s);
            const totalLines = lines.length;
            const coveredLines = lines.filter(c => c > 0).length;
            const pct = totalLines === 0 ? 100 : Math.round((coveredLines / totalLines) * 100);
            
            // Simplified for now (only lines)
            return {
                path: path.replace(process.cwd?.() || '', '').replace(/^\\/|\\\\/g, ''), // Rel path
                lines: pct,
                // Mocking others for lightweight calc or we need more robust backend summarization
                stmts: pct, 
                funcs: 0, // Placeholder
                br: 0     // Placeholder
            };
        });

        function renderTable(filter = '') {
            tbody.innerHTML = '';
            rows.filter(r => r.path.toLowerCase().includes(filter.toLowerCase())).forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td><span class="file-path">\${r.path}</span></td>
                    <td style="color: \${getColor(r.lines)}">\${r.lines}%</td>
                    <td class="text-dim">-</td>
                    <td class="text-dim">-</td>
                    <td class="text-dim">-</td>
                \`;
                tbody.appendChild(tr);
            });
            if(rows.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-dim);">No detailed file data available (Run with coverage enabled)</td></tr>';
            }
        }

        renderTable();

        document.getElementById('fileSearch').addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
        
    </script>
</body>
</html>
`;
