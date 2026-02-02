# 🛑 06. Testing Mandate

> [!IMPORTANT]
> **Speed, Isolation, and Mocking.**

## 1. Speed Limit

-   **Tests**: Must run fast.
-   **Action**: Refactor slow tests.

## 2. Strict Mocking

-   **External Interactions**: Filesystem and Child Process executions SHOULD be mocked in unit tests unless testing the integration explicitly.
-   **Tools**: Use `vitest` mocking capabilities.

## 3. Hostile Testing

-   **Happy Path is not enough**.
-   Test **Missing Files**.
-   Test **Invalid JSON**.
-   Test **Process Failures** (setup commands failing).

## 4. The "No Test, No Code" Rule

-   If you write a helper function, you MUST write a unit test for it.
-   If you fix a bug, you MUST write a regression test.
