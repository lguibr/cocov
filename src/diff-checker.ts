import path from 'path';
import { getChangedLines } from './git-utils.js';

export interface DiffResult {
  file: string;
  changedLines: number[];
  uncoveredLines: number[];
}

export class DiffChecker {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  /**
   * Checks coverage for only the lines changed in the current git diff.
   * Maps git diff ranges to istanbul statement maps to determine if changed code is covered.
   * 
   * @param detailedCoverage - The file-by-file coverage data (coverage-final.json)
   * @returns {Promise<DiffResult[]>} A list of files with uncovered changed lines
   */
  async checkDiffCoverage(detailedCoverage: Record<string, any>): Promise<DiffResult[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const changedFiles = await getChangedLines(this.cwd);
    const results: DiffResult[] = [];

    for (const [relativePath, lines] of Object.entries(changedFiles)) {
      const absPath = path.resolve(this.cwd, relativePath);
      const fileCov = detailedCoverage[absPath];

      if (!fileCov) {
        continue;
      }

      const uncovered: number[] = [];

      for (const line of lines) {
        let covered = false;
        let statementFound = false;

        for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (line >= range.start.line && line <= range.end.line) {
            statementFound = true;
            if (fileCov.s[id] > 0) {
              covered = true;
              break;
            }
          }
        }

        if (statementFound && !covered) {
          uncovered.push(line);
        }
      }

      if (uncovered.length > 0) {
        results.push({
          file: relativePath,
          changedLines: lines,
          uncoveredLines: uncovered,
        });
      }
    }

    return results;
  }
}
