import chalk from 'chalk';
import fs from 'fs-extra';
import { HistoryManager } from '@/history.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { MarkdownGenerator } from '@/markdown-generator.js';
import { injectIntoFile } from '@/injector.js';

export async function markdownAction(options: { inject?: string }) {
    try {
      const historyManager = new HistoryManager(process.cwd());
      const history = await historyManager.readHistory();
      const current = await readCurrentCoverage(process.cwd());
      
      const generator = new MarkdownGenerator(history, current);
      
      if (options.inject) {
        // Use true to generate the injection-ready content (with markers? no, we inject BETWEEN markers)
        // MarkdownGenerator.generate(true) adds markers. 
        // injectIntoFile adds content BETWEEN markers. 
        // So we need generator to NOT add markers, or script to not add markers.
        // Wait, generator.generate(true) returns: <!-- cocov-start --> REPORT <!-- cocov-end -->
        // My injector replaces between markers.
        // So if I inject what generator returns, I get:
        // <!-- cocov-start -->
        // <!-- cocov-start --> REPORT <!-- cocov-end -->
        // <!-- cocov-end -->
        // That is duplicate markers.
        
        // Let's check MarkdownGenerator again.
        // It wraps report in markers if injectMode is true.
        
        // I should probably use generate(false) which is raw report.
        const report = generator.generate(false);
        const success = await injectIntoFile(options.inject, report);
        
        if (success) {
             console.log(chalk.green(`✔ Injected report into ${options.inject}`));
        } else {
             console.log(chalk.yellow(`⚠ Could not find injection markers in ${options.inject}`));
             console.log(chalk.gray('  Add <!-- cocov-start --> and <!-- cocov-end --> to your file.'));
        }
      } else {
          // Default: Generate file
          const md = generator.generate();
          const outputPath = 'cocov-summary.md';
          await fs.writeFile(outputPath, md);
          console.log(chalk.green(`✔ Markdown report generated at ${outputPath}`));
      }
    } catch (error) {
       console.error(chalk.red('Error generating Markdown report:'), error);
       process.exit(1);
    }
}
