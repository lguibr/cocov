# 🏗️ Cocov Initialization & Scaffolding

The `src/core/init` directory manages the onboarding experience. It is designed to be "Opinionated but Flexible".

## 🛠️ Scaffolding Strategy

### 1. `scaffold.ts`
The worker module. It performs the filesystem mutations:
- Creates `.cocov/config.json`.
- Injects hooks.
- Updates `.gitignore`.

### 2. Husky Integration
We enforce a **Hardened Workflow** by default:
- **pre-commit**: Runs `cocov run --diff --dry-run`.
  - *Why?* Prevents committing code that isn't covered. Fast check.
- **pre-push**: Runs `cocov run` (Full Suite).
  - *Why?* Updates the baseline and ensures no overall regression.

### 3. CI/CD
Generates a Github Action workflow that mirrors the local logic.
- **Strategy**: "Test Local, Verify Remote". The local `.cocov` config is the source of truth, but CI runs the verification again to catch environment differences.

## 🧠 Philosophy
- **Hidden Config**: prefer `.cocov/` over root file pollution.
- **Guard Rails**: The init process assumes you *want* protection, so it enables strict hooks by default unless opted out.
