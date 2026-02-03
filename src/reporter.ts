import chalk from 'chalk';
import Table from 'cli-table3'; // Changed import style for ESM compatibility
import { ComparisonResult } from './comparator.js';
import { CoverageSummary } from './types.js';

export class Reporter {
  /**
   * Prints the comparison summary table to the console.
   * Shows baseline vs current metrics and the diff with color coding.
   * 
   * @param result - The comparison result to display
   */
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

  /**
   * Prints the absolute total coverage numbers to the console.
   * Used for quick verification of current state.
   * 
   * @param current - The current coverage summary
   */
  printTotal(current: CoverageSummary): void {
    console.log(chalk.bold('\nCurrent Coverage:'));
    console.log(`Lines: ${current.lines.pct}%`);
    console.log(`Statements: ${current.statements.pct}%`);
    console.log(`Functions: ${current.functions.pct}%`);
    console.log(`Branches: ${current.branches.pct}%`);
  }
}
