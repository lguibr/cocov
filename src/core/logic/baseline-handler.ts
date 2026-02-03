import chalk from 'chalk';
import { TotalCoverage, CocovFile } from '../../types.js';
import { writeBaseline } from '../coverage/writer.js';
import { Reporter } from '../../reporter.js';
import { Comparator } from '../../comparator.js';
import { HistoryManager } from '../../history.js';
import { getCurrentCommit, getCurrentBranch } from '../../git-utils.js';

/**
 * Core Logic: Orchestrates the comparison between current coverage and baseline.
 * - Saves history if not dry-run.
 * - Handles first-run (no baseline) scenario.
 * - Updates baseline on improvement.
 * - Exits with error code 1 on regression.
 * 
 * @param cwd - Current working directory
 * @param current - Current coverage
 * @param baseline - Loaded baseline
 * @param options - Run options (e.g. dryRun)
 * @param historyManager - History manager instance
 */
export async function handleBaselineCheck(
  cwd: string,
  current: TotalCoverage,
  baseline: CocovFile | null,
  options: { dryRun?: boolean },
  historyManager: HistoryManager,
): Promise<void> {
  if (!options.dryRun) {
    const context = {
      cwd,
      timestamp: new Date(),
      commitHash: await getCurrentCommit(),
      branch: await getCurrentBranch(),
    };
    await historyManager.append(current.total, context);
  }

  const reporter = new Reporter();
  const comparator = new Comparator();

  if (!baseline) {
    if (options.dryRun) {
      console.log(chalk.yellow('No baseline found. (Dry Run: Not saving).'));
      process.exit(0);
      return;
    }
    console.log(chalk.yellow('No baseline found. Saving current coverage as baseline.'));
    await writeBaseline(cwd, current);
    reporter.printTotal(current.total);
    process.exit(0);
    return;
  }

  // Check for invalid baseline format (e.g. user manually set total to a number)
  if (typeof baseline.total === 'number') {
      console.log(chalk.yellow('Baseline total format mismatch (found number, expected summary). Resetting baseline to valid format.'));
      await writeBaseline(cwd, current);
      return;
  }

  // Compare total summaries
  const result = comparator.compare(current.total, baseline.total);
  reporter.printSummary(result);

  if (result.isRegression) {
    console.error(chalk.red('\n✖ Coverage regression detected!'));
    process.exit(1);
  }

  if (result.improved) {
    if (options.dryRun) {
      console.log(chalk.green('\n✔ Coverage improved! (Dry Run: Baseline NOT updated).'));
    } else {
      console.log(chalk.green('\n✔ Coverage improved! Updating baseline.'));
      await writeBaseline(cwd, current);
    }
  } else {
    console.log(chalk.gray('\nCoverage unchanged.'));
  }
}
