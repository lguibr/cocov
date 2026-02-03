# 🛑 03. Coding Standards (The Law)

> [!IMPORTANT]
> **Technical Debt is Forbidden.**

## 1. The Absolute Zero `any`

-   **Rule**: `any` is **FORBIDDEN**.
-   **Exception**: `unknown` is permitted ONLY in `catch(e)` blocks or generic constraints, but MUST be narrowed immediately.
-   **Enforcement**: If you type `any`, you must delete the file and start over.

## 2. The 200-Line Limit

-   **Rule**: Max file length is **200 lines**.
-   **Action**: At line 201, you **STOP** and Refactor.
-   **Exception**: Generated types, JSON, and highly cohesive matching logic (if absolutely necessary).

## 3. Strict Naming & Hygiene

-   **No Abbreviations**: `ctx` (❌), `context` (✅). `char` (❌), `character` (✅).
-   **Explicit Returns**: Functions **MUST** have explicit return types.
-   **No Console Logs**: `console.log` is allowed ONLY in the CLI entry point (`cli.ts`) or `Reporter` class. All other logic should return data or throw errors.

## 4. Documentation Coupling

-   **Rule**: Every exported function MUST have JSDoc.
-   **Linking**: JSDoc SHOULD link to relevant design docs or rules if complex.

## 5. Type Definitions

-   **Single Source of Truth**: Define types in `types.ts` or close to usage.
-   **Prefer `interface`**: For public APIs/Shapes.
-   **Prefer `type`**: For Unions/Intersections.
