# 🛑 02. The TypeScript Imperative (The Blood Oath)

> [!CRITICAL]
> **YOU ARE BLIND WITHOUT TYPES.**
> TypeScript is not a suggestion. It is the **LAW**.
> You **MUST** adhere to strict typing.

## 1. The Strictness Mandate

1.  **No `any`**: `any` is **FORBIDDEN**. Use `unknown` with narrowing if necessary.
2.  **No Implicit Any**: All parameters must be typed.
3.  **Return Types**: Exported functions **MUST** have explicit return types.

## 2. The "No Hallucination" Pact

-   **FORBIDDEN**: "I think this library does X..."
-   **REQUIRED**: Check the `@types` or source code.
-   **ENFORCEMENT**: If `tsc` fails, you have **FAILED**.

## 3. The Path to Truth

-   **Configuration**: `tsconfig.json` defines the rules.
-   **Verification**: Run `npm run build` (which runs `tsc`) to prove correctness.

> **When in doubt, CHECK THE TYPE DEFINITIONS.**

## 4. Dependencies

-   **Rule**: `package.json` is the source of truth.
-   **Imports**: Do not import packages that are not in `dependencies` or `devDependencies`.
-   **Types**: Ensure `@types/` packages are installed for all dependencies.
