
import { describe, it, expect, vi } from 'vitest';
import { enforceThresholds } from './threshold-gate.js';
import { validatePerFileThresholds } from './threshold-validator.js';
import { TotalCoverage } from '../../types.js';

describe('Threshold Coverage', () => {
    describe('enforceThresholds', () => {
        it('handles null baseline gracefully (defaults to 0)', () => {
            const coverage = {
                total: { lines: { pct: 100 } }
            } as any;
            // Should not throw
            enforceThresholds(coverage, null);
        });

        it('handles undefined threshold in baseline (defaults to 0)', () => {
             const coverage = {
                total: { lines: { pct: 100 } }
            } as any;
            enforceThresholds(coverage, { threshold: undefined } as any);
        });
    });

    describe('validatePerFileThresholds', () => {
        it('handles file paths with no slashes (fallback name)', () => {
            const coverage: TotalCoverage = {
                'simple.ts': {
                    lines: { pct: 50 },
                    statements: { pct: 50 },
                    functions: { pct: 50 },
                    branches: { pct: 50 }
                }
            } as any;
            
            const result = validatePerFileThresholds(coverage, 80);
            expect(result.pass).toBe(false);
            expect(result.violations[0]).toContain('simple.ts: lines coverage');
        });

        it('handles empty file path split (edge case)', () => {
             const coverage: TotalCoverage = {
                '': {
                    lines: { pct: 50 },
                    statements: { pct: 50 },
                    functions: { pct: 50 },
                    branches: { pct: 50 }
                }
            } as any;
            
            const result = validatePerFileThresholds(coverage, 80);
            expect(result.pass).toBe(false);
            // Should fall back to empty string or handle it
        });
    });
});
