import chalk from 'chalk';
import fs from 'fs-extra';
import { HistoryManager } from '../../history.js';
import { readCurrentCoverage, readDetailedCoverage } from '../coverage/reader.js';
import { HtmlGenerator } from './generator.js';

export async function generateHtmlReport(cwd: string): Promise<void> {
  try {
    const historyManager = new HistoryManager(cwd);
    const history = await historyManager.readHistory();
    const current = await readCurrentCoverage(cwd);
    const detailed = await readDetailedCoverage(cwd);

    const generator = new HtmlGenerator(history, current, detailed);
    const html = generator.generate();

    const outputDir = '.cocov/reports';
    await fs.ensureDir(`${cwd}/${outputDir}`);
    const outputPath = `${cwd}/${outputDir}/index.html`;
    await fs.writeFile(outputPath, html);
    console.log(chalk.green(`✔ HTML report generated at ${outputPath}`));
  } catch (error) {
    console.error(chalk.red('Error generating HTML report:'), error);
    // We don't exit here so run command can continue if html fails
    throw error; 
  }
}
