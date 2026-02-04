import chalk from 'chalk';
import { readBaseline, readCurrentCoverage } from '../core/coverage/reader.js';
import { HistoryManager } from '../history.js';
import { StackGuard } from '../stack-guard.js';
import { runTestCommand } from '../executor.js';
import { runDiffCheck } from '../core/logic/diff-runner.js';
import { handleBaselineCheck } from '../core/logic/baseline-handler.js';
import { verifyCoverageFreshness } from '../core/integrity.js';
import { enforceThresholds, ThresholdError } from '../core/logic/threshold-gate.js';
import { generateHtmlReport } from '../core/html/runner.js';
import fs from 'fs-extra';
import path from 'path';

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
    
    // Use configured threshold or default to 0 (disabled)
    enforceThresholds(current, baseline);

    // Generate HTML report if enabled
    const configPath = path.join(cwd, 'cocov.json');
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJSON(configPath);
      if (config.html?.enabled) {
        await generateHtmlReport(cwd);
      }
    }

    await handleBaselineCheck(cwd, current, baseline, options, historyManager);
  } catch (error: unknown) {
    if (error instanceof ThresholdError) {
      console.error(chalk.red(`\n🛑 ${error.message} (Min ${error.threshold}%):`));
      error.violations.forEach(v => console.error(chalk.red(`  x ${v}`)));
    } else if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red(`Error: Unknown error`));
    }
    process.exit(1);
  }
}
