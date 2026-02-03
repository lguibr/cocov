# 🧠 Cocov Core Architecture

The `src/core` directory contains the business logic and essential engines of Cocov. It is structurally separated to ensure clean boundaries between data retrieval, processing logic, and output generation.

## 📂 Structure

- **`coverage/`**: **The Data Layer**. Responsible for reading raw coverage data (JSON summaries, Istanbul reports) and writing baseline configurations. It abstracts the filesystem and data formats.
- **`logic/`**: **The Business Logic**. Contains the decision-making engines. `baseline-handler` decides if a build passes or fails based on history. `diff-runner` executes the "Strict Mode" checks on changed files.
- **`badges/`**: **The Visuals**. A standalone SVG generation engine. It calculates coordinates and colors to generate high-fidelity badges without external dependencies (like shields.io).
- **`html/`**: **The Report**. Generators for the interactive HTML dashboard.
- **`init/`**: **The Setup**. Scaffolding logic for `cocov init`.
- **`integrity.ts`**: Verifies that coverage data is fresh and hasn't been tampered with.

## 🔄 Core Data Flow

1. **Input**: `CLI` invokes a command.
2. **Read**: `coverage/reader` loads current metrics + baseline.
3. **Process**: `logic/baseline-handler` compares them using `logic/comparator`.
4. **Decision**:
   - If regression -> Exit 1.
   - If improvement -> Update baseline (via `coverage/writer`) -> Exit 0.
   - If unchanged -> Exit 0.
5. **Output**: `reporter` prints verification tables.

## 🛡️ Design Principles

- **Zero-Config-First**: It should work without a config file if possible (falling back to defaults).
- **Filesystem Abstraction**: Core logic shouldn't know *where* files are, just *that* they exist. (Note: Current implementation still has some path coupling in `reader.ts`).
- **Strict Typing**: All coverage data must match the `TotalCoverage` or `DetailedCoverage` interfaces.
