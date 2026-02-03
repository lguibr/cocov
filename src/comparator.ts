import { CoverageSummary } from './types.js';

export interface ComparisonResult {
  isRegression: boolean;
  improved: boolean;
  metrics: {
    [key in keyof CoverageSummary]: {
      current: number;
      baseline: number;
      diff: number;
    };
  };
}

export class Comparator {
  /**
   * Compares current coverage metrics against a baseline.
   * Calculates differences for lines, statements, functions, and branches.
   * Determines if a regression occurred (negative diff) or improvement (positive diff).
   * 
   * @param current - The current run's coverage summary
   * @param baseline - The loaded baseline coverage summary
   * @returns {ComparisonResult} Object containing regression status, improvement status, and detailed metrics
   */
  compare(current: CoverageSummary, baseline: CoverageSummary): ComparisonResult {
    const keys: (keyof CoverageSummary)[] = ['lines', 'statements', 'functions', 'branches'];
    const metrics: Partial<ComparisonResult['metrics']> = {};
    let isRegression = false;
    let improved = false;

    for (const key of keys) {
      const currentPct = current[key].pct;
      const baselinePct = baseline[key].pct;
      const diff = parseFloat((currentPct - baselinePct).toFixed(2));

      metrics[key] = {
        current: currentPct,
        baseline: baselinePct,
        diff,
      };

      if (diff < 0) {
        isRegression = true;
      } else if (diff > 0) {
        improved = true;
      }
    }

    return { isRegression, improved, metrics: metrics as ComparisonResult['metrics'] };
  }
}
