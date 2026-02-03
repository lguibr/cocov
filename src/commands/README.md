# ⌨️ Cocov CLI Commands

This directory contains the action handlers for the CLI. Each file corresponds to a top-level command in the entry point.

## 🚀 Commands

### `init.ts` (`cocov init`)
- **Purpose**: Scaffolds the `.cocov` directory and sets up hooks.
- **Logic**: Interactive questionnaire -> `scaffold.ts`.

### `run.ts` (`cocov run <cmd>`)
- **Purpose**: The main guard. Runs tests, checks coverage, updates baseline.
- **Options**:
  - `--diff`: Enables Strict Mode (fails on uncovered changes).
  - `--dry-run`: Checks but doesn't save baseline.
  - `--enforce-stack`: Runs the stack dependency guard.

### `badge.ts` (`cocov badge`)
- **Purpose**: Generates SVGs.
- **Options**:
  - `--type <type>`: `lines`, `branches`, `unified`, etc.
  - `--output <file>`: Output path.

### `html.ts` (`cocov html`)
- **Purpose**: Generates the interactive HTML dashboard.
- **Logic**: Injects `history.jsonl` into the Handlebars template.

### `markdown.ts` (`cocov markdown`)
- **Purpose**: Generates reports for PR comments or README injection.
- **Options**:
  - `--inject <file>`: Looks for `<!-- cocov-start -->` markers.

## 🏗️ Architecture
All commands follow the **"Action Pattern"**:
- `cli.ts` parses arguments.
- `commands/<cmd>.ts` exports an `action` function.
- Logic is delegated to `src/core/` modules. Commands should NOT contain business rules.
