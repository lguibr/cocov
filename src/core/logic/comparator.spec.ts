import { describe, it, expect } from 'vitest';
import { Comparator } from '@/comparator.js';
import { TotalCoverage, CoverageMetric } from '@/types.js';

describe('Comparator Exhaustive Spec', () => {
  const comparator = new Comparator();

  // meaningful boundary values
  const values = [0, 1, 49, 50, 51, 79, 80, 81, 99, 100];
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;

  // Use test.each to generate individual tests clearly
  const cases = [];
  for (const metric of metrics) {
    for (const prev of values) {
      for (const curr of values) {
        cases.push({ metric, prev, curr });
      }
    }
  }

  it.each(cases)('Metric $metric: $prev% -> $curr%', ({ metric, prev, curr }) => {
    const previous = createCoverage({ [metric]: prev });
    const current = createCoverage({ [metric]: curr });

    const result = comparator.compare(current.total, previous.total);
    const diff = curr - prev;

    if (diff < 0) {
      expect(result.isRegression).toBe(true);
      expect(result.metrics[metric].diff).toBe(diff);
      expect(result.improved).toBe(false);
    } else if (diff > 0) {
      expect(result.improved).toBe(true);
      expect(result.isRegression).toBe(false);
      expect(result.metrics[metric].diff).toBe(diff);
    } else {
      expect(result.isRegression).toBe(false);
      expect(result.improved).toBe(false);
      expect(result.metrics[metric].diff).toBe(0);
    }
  });

  function createCoverage(overrides: any): TotalCoverage { // eslint-disable-line @typescript-eslint/no-explicit-any
    const defaults = { total: 100, covered: 80, skipped: 0, pct: 80 };
    const merge = (key: string): CoverageMetric => ({
      ...defaults,
      ...(overrides[key] !== undefined ? { pct: overrides[key] } : {}),
    });
    return {
      total: {
        lines: merge('lines'),
        statements: merge('statements'),
        functions: merge('functions'),
        branches: merge('branches'),
      },
    };
  }
});
