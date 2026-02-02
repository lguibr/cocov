# 🛑 05. Documentation Strategy

> [!IMPORTANT]
> **Colocation is King. Separation of Concerns is Law.**

## 1. The Structure: "One Module, One Manual"

Every complex directory **SHOULD** contain a `README.md` if the logic is non-trivial.

## 2. JSDoc (The Code Navigator)

-   **Purpose**: Explains Inputs, Outputs, and Code Flow.
-   **Requirement**: Exported members must be documented.

**Example JSDoc:**

```typescript
/**
 * Compares two coverage reports and determines if there is a regression.
 *
 * @param {CoverageSummary} current - The new coverage data.
 * @param {CoverageSummary} baseline - The baseline coverage data.
 * @returns {ComparisonResult} The result of the comparison.
 */
```
