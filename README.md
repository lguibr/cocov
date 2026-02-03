# 🛡️ Cocov
> **The Code Coverage Regression Guard**  
> *Zero-tolerance policy for coverage drops in critical systems.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-purple.svg)](https://npmjs.com/package/cocov)
[![Coverage](https://img.shields.io/badge/coverage-90%25-success.svg)](./coverage/index.html)
[![Iron Gates](https://img.shields.io/badge/protocol-IRON_GATES-red.svg)](./STRONG_GATE.md)

Cocov is not just a reporter; it's a **Compliance Engine**. It enforces strict coverage baselines, prevents merge regressions via `husky` hooks, and generates audit-ready artifacts in Markdown and HTML.

## 📐 Architecture
Cocov operates as a strict middleware between your test runner (Vitest/Jest) and your git history.

```mermaid
graph TD
    A[Test Runner (Vitest)] -->|Coverage JSON| B(Cocov Engine)
    B -->|Compare| C{Baseline Check}
    D[Baseline (.cocov/config.json)] --> C
    C -->|Regression| E[FAIL 🛑]
    C -->|Improvement| F[UPDATE ✅]
    C -->|Stable| G[PASS ✅]
    
    subgraph Outputs
        B --> H[HTML Dashboard]
        B --> I[Markdown Summary]
        B --> J[Console Report]
        B --> K[SVG Badges]
    end
```

## ✨ Features

- **📉 Regression Guard**: Automatically detects if coverage drops below the master baseline.
- **Strict Diff Mode**: Enforces 100% coverage on *changed lines only* (PR mode).
- **📊 SOTA Reporting**: High-fidelity HTML dashboards and GitHub-ready Markdown summaries.
- **🤖 LLM Friendly**: Outputs are structured for AI context ingestion.
- **🛡️ Stack Guard**: Enforces standard dependency validation (e.g. no rogue libs).

## 🚀 Quick Start

Initialize Cocov in your project:
```bash
npx cocov init
```
*Sets up `.cocov`, `husky` hooks, and CI workflows automatically.*

Run the guard:
```bash
npm run cocov
```

## 🛠️ Configuration
Stored in `.cocov/config.json` or `cocov.json`.

```json
{
  "thresholds": {
    "lines": 90,
    "functions": 90,
    "branches": 90
  },
  "git": {
    "enforceClean": true
  }
}
```

## 📄 License
MIT © 2026
