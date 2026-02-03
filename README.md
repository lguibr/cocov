# Cocov: The Code Coverage Guard
<div align="center">
  <img src="assets/logo.png" alt="Cocov Logo" width="150" />
</div>

[![CI Security & Quality](https://github.com/daicer/cocov/actions/workflows/ci.yml/badge.svg)](https://github.com/daicer/cocov/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/cocov?style=flat-square)](https://www.npmjs.com/package/cocov)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- Dogfooding Badges -->
![Lines](badges/badge-lines.svg)
![Statements](badges/badge-statements.svg)
![Branches](badges/badge-branches.svg)
![Functions](badges/badge-functions.svg)

Cocov 🚀
  <p><b>Covering your poop.</b></p>
</div>

**Cocov** is not just a gatekeeper; it's an intelligence tool for your codebase. It visualizes coverage velocity, identifies "Rot Areas", and gamifies quality improvement through rich dashboards and historical trend analysis.

## ✨ Features

- **📊 HTML Dashboard**: Generate rich, interactive dashboards with `cocov html`.
- **📈 Trend Analysis**: Track coverage velocity over time with `cocov trends` (History tracked in `.cocov/history.jsonl`).
- **🤖 LLM & README Ready**: Generate Markdown reports with **Mermaid.js** charts using `cocov markdown`.
- **💉 Auto-Injection**: Automatically update your `README.md` via CI/CD with `cocov markdown --inject README.md`.
- **🛡️ Regression Guard**: Prevent coverage drops with `cocov run`.
- **⚡ SOTA CI/CD**: Scaffold GitHub Actions and Husky hooks instantly with `cocov init`.

## 📦 Installation

```bash
npm install -g cocov
# or use via npx
npx cocov init
```

## 🚀 Quick Start

### 1. Initialize
Run `cocov init` to scaffold your configuration, git hooks, and CI pipelines.
```bash
npx cocov init
```

### 2. Run Tests & Track History
Wrap your test command with `cocov run`. This will run your tests, capture coverage, and append it to your local history.
```bash
npx cocov run "npm test"
```

### 3. Generate Reports
**HTML Dashboard:**
```bash
npx cocov html
# Opens cocov-report.html
```

**Markdown Report (for CI/LLMs):**
```bash
npx cocov markdown
# Output: cocov-summary.md
```

**Inject into README:**
Add markers to your `README.md`:
```markdown
<!-- cocov-start -->
<!-- cocov-end -->
```
Then run:
```bash
npx cocov markdown --inject README.md
```

## 🛠️ Configuration

`cocov.json` example:
```json
{
  "total": 0,
  "stack": {
    "required": ["typescript", "react"],
    "forbidden": []
  }
}
```

## 🤖 CI/CD Integration

Cocov is designed for **GitHub Actions**. Use `cocov init` to generate a workflow:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
  - run: npm ci
  - run: npx cocov run "npm test"
```

## License

ISC
