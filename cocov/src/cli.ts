import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra'; // Added fs-extra import
import path from 'path';
import { runTestCommand } from './executor.js';
import { CoverageManager } from './coverage.js';
import { Comparator } from './comparator.js';
import { Reporter } from './reporter.js';
import { StackGuard } from './stack-guard.js';
import { runInit } from './commands/init.js';
import { HistoryManager } from './history.js';
import { HtmlGenerator } from './html-generator.js';
import { MarkdownGenerator } from './markdown-generator.js';
import { DiffChecker } from './diff-checker.js';
import { getCurrentCommit, getCurrentBranch } from './git-utils.js';

const program = new Command();

program.name('cocov').description('Code coverage regression guard').version('1.0.0');

// Init Command
program
  .command('init')
  .description('Initialize cocov configuration and hooks')
  .action(async () => {
    try {
      await runInit();
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(chalk.red(`Init failed: ${e.message}`));
      } else {
        console.error(chalk.red(`Init failed: Unknown error`));
      }
      process.exit(1);
    }
  });


// Run Command (Default)
program
  .command('run', { isDefault: true })
  .description('Run tests and check coverage')
  .argument('<testCommand>', 'Test command to run (e.g., "npm test")')
  .option('--enforce-stack', 'Enforce stack requirements defined in cocov file')
  .option('--dry-run', 'Simulate checks but do not update baseline')
  .option('-f, --file <file>', 'Path to custom coverage file')
  .option('--diff', 'Enforce 100% coverage on changed lines (Strict Mode)')
  .action(async (testCommand, options) => {
    console.log(chalk.blue(`Running test command: ${testCommand}...`));

    if (options.dryRun) {
      console.log(chalk.yellow('🚧 DRY RUN MODE: No baseline updates.'));
    }

    try {
      const manager = new CoverageManager(process.cwd(), options.file);
      const historyManager = new HistoryManager(process.cwd());
      
      const baseline = await manager.readBaseline();

      if (options.enforceStack && baseline?.stack) {
        const guard = new StackGuard(process.cwd());
        await guard.check(baseline.stack);
      }

      await runTestCommand(testCommand);

      const current = await manager.readCurrentCoverage();
      const reporter = new Reporter();
      const comparator = new Comparator();

      // Diff Check (The Governor)
      if (options.diff) {
          console.log(chalk.blue('\n🔍 Running Diff-Aware Strict Mode...'));
          const diffChecker = new DiffChecker(process.cwd());
          const detailed = await manager.readDetailedCoverage();
          
          if (!detailed) {
              console.warn(chalk.yellow('⚠ Could not find detailed coverage (coverage-final.json). Skipping diff check.'));
          } else {
              const diffResults = await diffChecker.checkDiffCoverage(detailed);
              if (diffResults.length > 0) {
                  console.error(chalk.red('\n🛑 Strict Mode Failed: Uncovered changes detected!'));
                  diffResults.forEach(r => {
                      console.error(chalk.red(`  ${r.file}: Lines [${r.uncoveredLines.join(', ')}] are not covered.`));
                  });
                  process.exit(1);
              } else {
                  console.log(chalk.green('✔ Diff Strict Mode Passed: All changes covered.'));
              }
          }
      }

      // Record History
      if (!options.dryRun) {
        const context = {
            cwd: process.cwd(),
            timestamp: new Date(),
            commitHash: await getCurrentCommit(),
            branch: await getCurrentBranch()
        };
        await historyManager.append(current.total, context);
      }

      if (!baseline) {
        if (options.dryRun) {
          console.log(chalk.yellow('No baseline found. (Dry Run: Not saving).'));
          process.exit(0);
        }
        console.log(chalk.yellow('No baseline found. Saving current coverage as baseline.'));
        await manager.writeBaseline(current);
        reporter.printTotal(current.total);
        process.exit(0);
      }

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
          await manager.writeBaseline(current);
        }
      } else {
        console.log(chalk.gray('\nCoverage unchanged.'));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      } else {
        console.error(chalk.red(`Error: Unknown error`));
      }
      process.exit(1);
    }
  });

// HTML Report Command
program
  .command('html')
  .description('Generate HTML dashboard')
  .option('-o, --output <file>', 'Output file path', 'cocov-report.html')
  .action(async (options) => {
    try {
        const historyManager = new HistoryManager(process.cwd());
        const manager = new CoverageManager(process.cwd());
        
        const history = await historyManager.readHistory();
        const current = await manager.readCurrentCoverage();

        const generator = new HtmlGenerator(history, current);
        const html = generator.generate();

        await fs.outputFile(options.output, html);
        console.log(chalk.green(`\n✔ HTML Dashboard generated at ${options.output}`));
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(chalk.red(`Failed to generate HTML: ${e.message}`));
        }
        process.exit(1);
    }
  });


// Markdown Report Command
program
  .command('markdown')
  .description('Generate Markdown report with Mermaid charts')
  .option('-o, --output <file>', 'Output file path', 'cocov-summary.md')
  .option('--inject <file>', 'Inject report into existing markdown file (between <!-- cocov-start --> and <!-- cocov-end -->)')
  .action(async (options) => {
    try {
        const historyManager = new HistoryManager(process.cwd());
        const manager = new CoverageManager(process.cwd());
        
        const history = await historyManager.readHistory();
        const current = await manager.readCurrentCoverage();

        const generator = new MarkdownGenerator(history, current);

        if (options.inject) {
            const injectPath = path.resolve(options.inject);
            if (!(await fs.pathExists(injectPath))) {
                console.error(chalk.red(`Injection file not found: ${injectPath}`));
                process.exit(1);
            }
            
            const content = await fs.readFile(injectPath, 'utf8');
            const report = generator.generate(true);
            
            const startMarker = '<!-- cocov-start -->';
            const endMarker = '<!-- cocov-end -->';
            
            const startIndex = content.indexOf(startMarker);
            const endIndex = content.indexOf(endMarker);
            
            if (startIndex === -1 || endIndex === -1) {
                console.error(chalk.red('Could not find <!-- cocov-start --> or <!-- cocov-end --> markers in file.'));
                process.exit(1);
            }
            
            const newContent = content.substring(0, startIndex) + report + content.substring(endIndex + endMarker.length);
            await fs.writeFile(injectPath, newContent);
            console.log(chalk.green(`\n✔ Injected report into ${options.inject}`));
            
        } else {
            const md = generator.generate(false);
            await fs.outputFile(options.output, md);
            console.log(chalk.green(`\n✔ Markdown Report generated at ${options.output}`));
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(chalk.red(`Failed to generate Markdown: ${e.message}`));
        }
        process.exit(1);
    }
  });

program.parse();
