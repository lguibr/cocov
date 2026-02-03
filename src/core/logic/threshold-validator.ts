import { TotalCoverage, CoverageMetric } from '../../types.js';

export interface ThresholdResult {
  pass: boolean;
  violations: string[];
}

/**
 * Validates that every file in the coverage report meets the minimum percentage.
 * 
 * @param coverage - The TotalCoverage object containing per-file summaries
 * @param minPct - The minimum mandatory percentage (e.g. 90)
 * @returns {ThresholdResult} Pass/Fail and list of specific violations
 */
export function validatePerFileThresholds(coverage: TotalCoverage, minPct: number): ThresholdResult {
  const violations: string[] = [];
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;

  for (const [filePath, summary] of Object.entries(coverage)) {
    if (filePath === 'total') continue;

    const shortName = filePath.split('/').pop() || filePath; // simplified name for report

    for (const metric of metrics) {
      const value = summary[metric];
      if (value.pct < minPct) {
        violations.push(
          `${shortName}: ${metric} coverage is ${value.pct}% (required: ${minPct}%)`
        );
      }
    }
  }

  return {
    pass: violations.length === 0,
    violations
  };
}
