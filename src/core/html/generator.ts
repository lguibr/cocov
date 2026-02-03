import { HistoryEntry, TotalCoverage } from '@/types.js';
import { htmlTemplate } from './templates/base.js';

export class HtmlGenerator {
  private history: HistoryEntry[];
  private current: TotalCoverage;

  constructor(history: HistoryEntry[], current: TotalCoverage) {
    this.history = history;
    this.current = current;
  }

  /**
   * Generates a fully interactive HTML report using the base template.
   * Injects history and current coverage data as JSON into the HTML.
   * 
   * @returns {string} Complete HTML string
   */
  generate(): string {
    const historyData = JSON.stringify(this.history);
    const currentData = JSON.stringify(this.current);
    return htmlTemplate(historyData, currentData);
  }
}
