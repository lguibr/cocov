# 🛑 01. The Prime Directive: CLI Usage

> [!CRITICAL]
> **YOU ARE BLIND WITHOUT THE CLI.**
> You are **FORBIDDEN** from guessing the state of the system.
> You **MUST** use the CLI to perceive the world.

## 1. The "Know-How" Loop

Before writing a single line of code, you must execute this loop:

1.  **📡 Status**: Check the environment.
    `ls -R` or `list_dir` to know where you are.
2.  **🔮 Compile**: Ensure the project is buildable.
    `npm run build` or `yarn build`.
3.  **🔍 Explore**: Read the code you are about to touch.
    `view_file` or `grep_search`.
4.  **🧠 Knowledge**: Retrieve context from `rules/` and `README.md` files.

## 2. The Verification Command

You must verifying your work using the tool itself.

**Usage:**

```bash
# Verify the build
npm run build

# Verify the CLI output (Dry Run)
node dist/cli.js --help
node dist/cli.js npm test --dry-run
```
