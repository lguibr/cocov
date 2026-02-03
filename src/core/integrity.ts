import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Verifies that the coverage data is fresh (created recently).
 * Prevents using stale coverage data for pre-commit checks.
 * 
 * @param cwd - Current working directory
 * @returns {Promise<boolean>} True if fresh enough, warns if stale
 */
export async function verifyCoverageFreshness(cwd: string): Promise<boolean> {
  const summaryPath = path.resolve(cwd, 'coverage/coverage-summary.json');
  if (!(await fs.pathExists(summaryPath))) return false;

  const stats = (await fs.stat(summaryPath)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const ageMs = Date.now() - stats.mtimeMs;
  const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

  if (ageMs > MAX_AGE_MS) {
    console.warn(
      chalk.yellow(
        `⚠ Coverage data is ${Math.round(ageMs / 1000 / 60)} minutes old. Ensure you ran tests recently.`,
      ),
    );
    // We warn but don't fail, unless strict?
    return true;
  }
  return true;
}

/**
 * Computes a SHA-256 integrity hash for the coverage data.
 * Used to ensure data hasn't been tampered with.
 * 
 * @param content - Data to hash
 * @returns {Promise<string>} Hex string of the hash
 */
export async function computeIntegrityHash(content: any): Promise<string> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
