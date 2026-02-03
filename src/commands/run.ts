import chalk from 'chalk';
import { readBaseline, readCurrentCoverage } from '../core/coverage/reader.js';
import { HistoryManager } from '../history.js';
import { StackGuard } from '../stack-guard.js';
import { runTestCommand } from '../executor.js';
import { runDiffCheck } from '../core/logic/diff-runner.js';
import { handleBaselineCheck } from '../core/logic/baseline-handler.js';
import { verifyCoverageFreshness } from '../core/integrity.js';

interface RunOptions {
  dryRun?: boolean;
  enforceStack?: boolean;
  diff?: boolean;
  file?: string;
}

export async function runAction(testCommand: string, options: RunOptions): Promise<void> {
  console.log(chalk.blue(`Running test command: ${testCommand}...`));

  if (options.dryRun) {
    console.log(chalk.yellow('🚧 DRY RUN MODE: No baseline updates.'));
  }

  try {
    await verifyCoverageFreshness(process.cwd());

    const historyManager = new HistoryManager(process.cwd());
    const cwd = process.cwd();

    const baseline = await readBaseline(cwd);

    if (options.enforceStack && baseline?.stack) {
      const guard = new StackGuard(cwd);
      await guard.check(baseline.stack);
    }

    await runTestCommand(testCommand);

    if (options.diff) {
      await runDiffCheck(cwd);
    }

    const current = await readCurrentCoverage(cwd, options.file);

    await handleBaselineCheck(cwd, current, baseline, options, historyManager);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red(`Error: Unknown error`));
    }
    process.exit(1);
  }
}
