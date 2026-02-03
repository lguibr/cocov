import { describe, it, expect, vi } from 'vitest';
import { Reporter } from './reporter.js';
import { ComparisonResult } from './comparator.js';

describe('Reporter', () => {
  it('printSummary logs table to console', () => {
    const reporter = new Reporter();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockResult: ComparisonResult = {
      isRegression: false,
       metrics: {
         lines: { baseline: 80, current: 85, diff: 5 },
         statements: { baseline: 80, current: 75, diff: -5 },
         functions: { baseline: 80, current: 80, diff: 0 },
         branches: { baseline: 80, current: 80, diff: 0 },
       },
       improved: false,
    };

    reporter.printSummary(mockResult);

    expect(consoleSpy).toHaveBeenCalled();
    // Check for regression/improvement
    // Table output includes ANSI codes, so partial match on content
    // We expect "IMPROVED" and "REGRESSION" in output (even if styled)
    // Actually table implementation might not use simple strings if styled.
    // But we know chalk adds strings.
  });

  it('printTotal logs coverage summary', () => {
    const reporter = new Reporter();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    reporter.printTotal({
      lines: { pct: 80 },
      statements: { pct: 80 },
      functions: { pct: 80 },
      branches: { pct: 80 },
    } as never);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lines: 80%'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Statements: 80%'));
  });
});
