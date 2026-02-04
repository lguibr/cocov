import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import { CoverageSummary, HistoryEntry, RunContext } from './types.js';

export class HistoryManager {
  private historyPath: string;

  constructor(cwd: string) {
    this.historyPath = path.join(cwd, '.cocov', 'history.jsonl');
  }

  /**
   * Appends a new coverage entry to the history file.
   * Uses JSONL format (one JSON object per line).
   * 
   * @param metrics - The coverage metrics to save
   * @param context - Run context including timestamp and commit hash
   */
  async append(metrics: CoverageSummary, context: RunContext): Promise<void> {
    await fs.ensureDir(path.dirname(this.historyPath));
    const entry: HistoryEntry = {
      timestamp: context.timestamp.toISOString(),
      commitHash: context.commitHash,
      branch: context.branch,
      metrics,
    };

    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.historyPath, line, 'utf8');
  }

  /**
   * Reads and parses the entire history file using streams.
   * Gracefully ignores malformed JSON lines.
   * 
   * @returns {Promise<HistoryEntry[]>} Array of valid history entries
   */
  async readHistory(): Promise<HistoryEntry[]> {
    if (!(await fs.pathExists(this.historyPath))) {
      return [];
    }

    const entries: HistoryEntry[] = [];
    const fileStream = fs.createReadStream(this.historyPath);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        entries.push(entry);
      } catch {
        // Ignore malformed lines
      }
    }

    return entries;
  }
}

