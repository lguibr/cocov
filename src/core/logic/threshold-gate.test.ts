
import { describe, it, expect, vi } from 'vitest';
import { enforceThresholds, ThresholdError } from './threshold-gate';
import * as validator from './threshold-validator';

vi.mock('./threshold-validator');

describe('enforceThresholds', () => {
    it('should pass if threshold is 0 (default)', () => {
        const current: any = { total: {} };
        const baseline: any = { threshold: 0 };
        enforceThresholds(current, baseline);
        expect(validator.validatePerFileThresholds).not.toHaveBeenCalled();
    });

    it('should pass if threshold is met', () => {
        const current: any = { total: {} };
        const baseline: any = { threshold: 80 };
        vi.mocked(validator.validatePerFileThresholds).mockReturnValue({ pass: true, violations: [] });

        enforceThresholds(current, baseline);

        expect(validator.validatePerFileThresholds).toHaveBeenCalledWith(current, 80);
    });

    it('should throw ThresholdError if threshold is not met', () => {
        const current: any = { total: {} };
        const baseline: any = { threshold: 90 };
        vi.mocked(validator.validatePerFileThresholds).mockReturnValue({ 
            pass: false, 
            violations: ['violation'] 
        });

        try {
            enforceThresholds(current, baseline);
            expect.fail('Should have thrown');
        } catch (e: any) {
            expect(e).toBeInstanceOf(ThresholdError);
            expect(e.violations).toEqual(['violation']);
            expect(e.threshold).toBe(90);
        }
    });
});
