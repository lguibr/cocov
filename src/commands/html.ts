
import chalk from 'chalk';
import fs from 'fs-extra';
import { HistoryManager } from '../history.js';
import { CoverageManager } from '../coverage.js';
import { HtmlGenerator } from '../html-generator.js';

export async function htmlAction() {
    try {
      const historyManager = new HistoryManager(process.cwd());
      const history = await historyManager.readHistory();
      const manager = new CoverageManager(process.cwd());
      const current = await manager.readCurrentCoverage();
      
      const generator = new HtmlGenerator(history, current);
      const html = generator.generate();
      
      const outputPath = 'cocov-report.html';
      await fs.writeFile(outputPath, html);
      console.log(chalk.green(`✔ HTML report generated at ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('Error generating HTML report:'), error);
      process.exit(1);
    }
}
