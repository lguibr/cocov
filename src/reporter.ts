import chalk from 'chalk';
import Table from 'cli-table3'; // Changed import style for ESM compatibility
import { ComparisonResult } from './comparator.js';
import { CoverageSummary } from './types.js';

export class Reporter {
  printSummary(result: ComparisonResult): void {
    const table = new Table({
      head: ['Metric', 'Baseline', 'Current', 'Diff', 'Status'],
      style: { head: ['cyan'] },
    });

    const keys = Object.keys(result.metrics) as (keyof CoverageSummary)[];

    keys.forEach((key) => {
      const m = result.metrics[key];
      let status = '';
      let diffStr = '';

      if (m.diff < 0) {
        status = chalk.red('REGRESSION');
        diffStr = chalk.red(`${m.diff}%`);
      } else if (m.diff > 0) {
        status = chalk.green('IMPROVED');
        diffStr = chalk.green(`+${m.diff}%`);
      } else {
        status = chalk.gray('UNCHANGED');
        diffStr = chalk.gray('0%');
      }

      table.push([
        key.charAt(0).toUpperCase() + key.slice(1),
        `${m.baseline}%`,
        `${m.current}%`,
        diffStr,
        status,
      ]);
    });

    console.log(table.toString());
  }

  printTotal(current: CoverageSummary): void {
    console.log(chalk.bold('\nCurrent Coverage:'));
    console.log(`Lines: ${current.lines.pct}%`);
    console.log(`Statements: ${current.statements.pct}%`);
    console.log(`Functions: ${current.functions.pct}%`);
    console.log(`Branches: ${current.branches.pct}%`);
  }
}
