# 🛑 04. Quality Protocol (The Iron Gates)

> [!IMPORTANT]
> **No Progress without Proof.**

## 1. The Iron Gates

You cannot mark a task as "Done" until you pass the Gates.

1.  **Format**: `npm run format` (or equivalent).
2.  **Lint**: `npm run lint` (0 Errors).
3.  **Build**: `npm run build` (Must pass `tsc`).
4.  **Test**: `npm test` (Must pass).

## 2. Proactive Verification

-   **Do not wait** for the user to run these. Run them yourself after **EVERY** significant change.
-   **Fix immediately**: If Lint fails, fix it *now*. Do not continue writing logic on broken foundations.

## 3. Dependency Management

-   **Lockfile**: `package-lock.json` or `yarn.lock` is sacred. Do not delete it to "fix" issues unless corrupted.

## 4. The "Works on My Machine" ban

-   **Verify**: Run `node dist/cli.js` to verify the build artifact actually works.
