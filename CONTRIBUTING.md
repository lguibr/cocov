# Contributing to Cocov

First off, thanks for taking the time to contribute! ❤️

Cocov is a **Free and Open Source (FOS)** project. We welcome contributions from everyone.

## 📐 Architecture
Cocov uses a tiered architecture:
1. **Core**: Logic for reading coverage, diffing, and baseline management (`src/core`).
2. **Commands**: CLI entry points (`src/commands`).
3. **Reporters**: HTML/Markdown generators (`src/core/html`, `src/markdown`).

## 🛠️ Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Tests**:
   ```bash
   npm test
   ```
3. **Build**:
   ```bash
   npm run build
   ```

## 🧪 Testing Policy
- **Coverage**: We enforce **90% coverage**. If your PR drops coverage, it will be rejected (ironic, right?).
- **Unit Tests**: Use `vitest`.
- **E2E**: We use a `dogfooding` approach where Cocov tests itself.

## 🎨 Code Style
- **Linting**: No `any`. Strict TypeScript.
- **Formatting**: Prettier is enforced.

## 🤝 Pull Requests
1. Fork the repo.
2. Create a branch (`feat/amazing-feature`).
3. Commit your changes.
4. Open a PR.

> **Note**: We love "Disgraced" badges and SOTA documentation. If you improve the UI, you're a hero.
