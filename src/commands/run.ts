import chalk from 'chalk';
import { readBaseline, readCurrentCoverage } from '@/core/coverage/reader.js';
import { HistoryManager } from '@/history.js';
import { StackGuard } from '@/stack-guard.js';
import { runTestCommand } from '@/executor.js';
import { runDiffCheck } from '@/core/logic/diff-runner.js';
import { handleBaselineCheck } from '@/core/logic/baseline-handler.js';
import { verifyCoverageFreshness, verifyGitStatus } from '@/core/integrity.js';
import { enforceThresholds, ThresholdError } from '@/core/logic/threshold-gate.js';
import { generateHtmlReport } from '@/core/html/runner.js';
import { loadCocovConfig } from '@/config-loader.js';
import { validateGitHistory } from '@/git-utils.js';
import fs from 'fs-extra';
import path from 'path';

interface RunOptions {
  dryRun?: boolean;
  enforceStack?: boolean;
  diff?: boolean;
  file?: string;
  ui?: boolean;
}

export async function runAction(testCommand: string, options: RunOptions): Promise<void> {
  console.log(chalk.blue(`Running test command: ${testCommand}...`));

  if (options.dryRun) {
    console.log(chalk.yellow('🚧 DRY RUN MODE: No baseline updates.'));
  }

  try {
    await verifyCoverageFreshness(process.cwd());
    await verifyGitStatus();
    await validateGitHistory();

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
    const config = await loadCocovConfig(cwd);
    if (config.html?.enabled) {
      await generateHtmlReport(cwd);
    }

    if (options.ui) {
       // Dynamic import to keep startup fast
       const { render } = await import('ink');
       const { createElement } = await import('react');
       const { Dashboard } = await import('@/ui/dashboard.js');
       const { readDetailedCoverage } = await import('@/core/coverage/reader.js');

       const detailed = await readDetailedCoverage(cwd);
       
       if (detailed) {
           console.clear(); // Clear terminal before showing dashboard
           render(createElement(Dashboard, { 
               config, 
               coverage: detailed,
               stats: {
                   total: current.total.lines.total,
                   covered: current.total.lines.covered,
                   pct: current.total.lines.pct
               }
           }));
           // Keep process alive if dashboard is interactive? 
           // For now it renders stats and exits.
       } else {
           console.warn('⚠ Detailed coverage not found, cannot render UI.');
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
