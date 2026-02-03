import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function verifyCoverageFreshness(cwd: string): Promise<boolean> {
  const summaryPath = path.resolve(cwd, 'coverage/coverage-summary.json');
  if (!(await fs.pathExists(summaryPath))) return false;

  const stats = await fs.stat(summaryPath);
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

export async function computeIntegrityHash(content: any): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
