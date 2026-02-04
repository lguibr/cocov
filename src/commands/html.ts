import chalk from 'chalk';
import { generateHtmlReport } from '../core/html/runner.js';

export async function htmlAction(): Promise<void> {
  try {
    await generateHtmlReport(process.cwd());
  } catch (error) {
    // Error logged by runner, just exit
    process.exit(1);
  }
}
