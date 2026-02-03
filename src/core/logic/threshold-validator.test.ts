import { describe, it, expect } from 'vitest';
import { validatePerFileThresholds } from './threshold-validator.js';
import { TotalCoverage } from '../../types.js';

describe('validatePerFileThresholds', () => {
  it('passes if all files meet min percentages', () => {
    const coverage: any = {
      total: {},
      'src/a.ts': { lines: { pct: 90 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
      'src/b.ts': { lines: { pct: 95 }, statements: { pct: 95 }, functions: { pct: 100 }, branches: { pct: 100 } },
    };
    
    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails if any metric is below threshold', () => {
    const coverage: any = {
      total: {},
    'src/a.ts': { lines: { pct: 89 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
    };
    
    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(false);
    expect(result.violations).toContain('a.ts: lines coverage is 89% (required: 90%)');
  });

  it('fails multiple files', () => {
    const coverage: any = {
      total: {},
      'src/a.ts': { lines: { pct: 50 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
      'src/b.ts': { lines: { pct: 90 }, statements: { pct: 40 }, functions: { pct: 90 }, branches: { pct: 90 } },
    };

    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});
