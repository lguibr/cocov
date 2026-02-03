
import fs from 'fs-extra';
import path from 'path';
import { TotalCoverage, CocovFile, DetailedCoverage } from '@/types.js';

/**
 * Reads the current run's coverage summary JSON.
 * 
 * @param cwd - Current working directory
 * @param file - Path to coverage file (default: coverage/coverage-summary.json)
 * @returns {Promise<TotalCoverage>} Parsed coverage summary
 * @throws {Error} If file does not exist
 */
export async function readCurrentCoverage(cwd: string, file = 'coverage/coverage-summary.json'): Promise<TotalCoverage> {
    const summaryPath = path.resolve(cwd, file);
    if (!(await fs.pathExists(summaryPath))) {
      throw new Error(
        `Could not find coverage summary at ${summaryPath}. Did the test command generate it?`,
      );
    }
    return fs.readJSON(summaryPath);
}

/**
 * Reads the detailed final coverage report (Istanbul format).
 * Used for detailed analysis like diff-checks.
 * 
 * @param cwd - Current working directory
 * @returns {Promise<Record<string, DetailedCoverage> | null>} Parsed detailed coverage or null if missing
 */
export async function readDetailedCoverage(cwd: string): Promise<Record<string, DetailedCoverage> | null> {
    const detailedPath = path.resolve(cwd, 'coverage/coverage-final.json');
    if (await fs.pathExists(detailedPath)) {
        return fs.readJSON(detailedPath);
    }
    return null;
}

/**
 * Reads the baseline coverage config.
 * Checks .cocov/config.json first, then falls back to cocov.json.
 * 
 * @param cwd - Current working directory
 * @returns {Promise<CocovFile | null>} Parsed baseline config or null if not found
 */
export async function readBaseline(cwd: string): Promise<CocovFile | null> {
    const hiddenConfig = path.join(cwd, '.cocov', 'config.json');
    if (await fs.pathExists(hiddenConfig)) {
        return fs.readJSON(hiddenConfig);
    }
    
    // Fallback: cocov.json in root
    const rootConfig = path.join(cwd, 'cocov.json');
    if (await fs.pathExists(rootConfig)) {
        return fs.readJSON(rootConfig);
    }

    return null;
}
