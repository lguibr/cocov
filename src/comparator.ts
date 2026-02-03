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
