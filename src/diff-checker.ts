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

  async checkDiffCoverage(detailedCoverage: Record<string, any>): Promise<DiffResult[]> {
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

        for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) {
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
