
import chalk from 'chalk';
import { TotalCoverage, CocovFile } from '../../types.js';
import { validatePerFileThresholds } from './threshold-validator.js';

export class ThresholdError extends Error {
    constructor(public violations: string[], public threshold: number) {
        super('Per-File Coverage Threshold Failed');
        this.name = 'ThresholdError';
    }
}

export function enforceThresholds(current: TotalCoverage, baseline: CocovFile | null): void {
    const threshold = typeof baseline?.threshold === 'number' ? baseline.threshold : 0;
    
    if (threshold > 0) {
        const thresholdResult = validatePerFileThresholds(current, threshold);
        if (!thresholdResult.pass) {
            throw new ThresholdError(thresholdResult.violations, threshold);
        }
    }
}
