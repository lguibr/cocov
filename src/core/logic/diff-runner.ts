import chalk from 'chalk';
import { readDetailedCoverage } from '@/core/coverage/reader.js';
import { DiffChecker } from '@/diff-checker.js';

export async function runDiffCheck(cwd: string): Promise<void> {
  console.log(chalk.blue('\n🔍 Running Diff-Aware Strict Mode...'));
  const diffChecker = new DiffChecker(cwd);
  const detailed = await readDetailedCoverage(cwd);

  if (!detailed) {
    console.warn(
      chalk.yellow(
        '⚠ Could not find detailed coverage (coverage-final.json). Skipping diff check.',
      ),
    );
    return;
  }

  const diffResults = await diffChecker.checkDiffCoverage(detailed);
  if (diffResults.length > 0) {
    console.error(chalk.red('\n🛑 Strict Mode Failed: Uncovered changes detected!'));
    diffResults.forEach((r) => {
      console.error(
        chalk.red(`  ${r.file}: Lines [${r.uncoveredLines.join(', ')}] are not covered.`),
      );
    });
    process.exit(1);
  } else {
    console.log(chalk.green('✔ Diff Strict Mode Passed: All changes covered.'));
  }
}
