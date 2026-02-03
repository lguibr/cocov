import { Command } from 'commander';
import chalk from 'chalk';
import { runInit } from './commands/init.js';

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
  .action(async (cmd, options) => {
    const { runAction } = await import('./commands/run.js');
    await runAction(cmd, options);
  });

// HTML Report Command
program
  .command('html')
  .description('Generate HTML report')
  .action(async () => {
    const { htmlAction } = await import('./commands/html.js');
    await htmlAction();
  });

// Markdown Report Command
program
  .command('markdown')
  .description('Generate Markdown report')
  .option('--inject <file>', 'Inject report into a markdown file (e.g. README.md)')
  .action(async (options) => {
    const { markdownAction } = await import('./commands/markdown.js');
    await markdownAction(options);
  });

// Badge Command
program
  .command('badge')
  .description('Generate coverage SVG badge')
  .option('-o, --output <file>', 'Output file path')
  .option('--type <type>', 'Badge type (lines, branches, functions, statements, logo, all)', 'lines')
  .option('--logo', 'Generate logo badge')
  .action(async (options) => {
    const { badgeAction } = await import('./commands/badge.js');
    await badgeAction(options);
  });

program.parse();
