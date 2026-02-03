# ⚙️ Cocov Core Logic

This directory contains the central nervous system of the application. These modules strictly implement the business rules for "Guard Mode" and "Diff Mode".

## 🧩 Modules

### `baseline-handler.ts` (The Guard)
This is the primary gatekeeper for the `run` command.
**Flow:**
1. Checks if a baseline exists.
   - If NO: Becomes the new baseline (unless `--dry-run`).
   - If YES: Proceeds to comparison.
2. **Comparison**: Uses `Comparator` to check `current` vs `baseline`.
3. **Regression Check**: If ANY metric (lines, statements, branches, functions) is lower than baseline -> **Fail Build (Exit 1)**.
4. **Improvement**: If metrics are higher -> **Update Baseline** (ratchet up quality).

### `diff-runner.ts` (The Strict Mode)
Handles the `--diff` flag context.
**Flow:**
1. **Git Analysis**: Asks `git-utils` for changed line numbers.
2. **Coverage Mapping**: Loads `coverage-final.json` (detailed Istanbul data).
3. **Intersection**: Checks if *any changed line* falls outside of a coverage block.
4. **Verdict**: 
   - If even 1 changed line is uncovered -> **Fail Build (Exit 1)**.
   - Ignores existing technical debt; focuses only on *new* code.

### `comparator.ts`
Pure function logic for comparing two `CoverageSummary` objects. Returns a formatted result object used by reporters.

## ⚠️ Critical Invariants
- **Never downgrade**: The baseline can only go UP.
- **Dry Run Safety**: Logic modules must respect `dryRun` options and never write to disk if set.
