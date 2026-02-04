import path from 'path';
import { getChangedLines } from './git-utils.js';

export interface DiffResult {
  file: string;
  changedLines: number[];
  uncoveredLines: number[];
}

import { SmartDiffChecker } from './core/logic/smart-diff.js';
import fs from 'fs-extra';

export class DiffChecker {
  private cwd: string;
  private smartChecker: SmartDiffChecker;

  constructor(cwd: string) {
    this.cwd = cwd;
    this.smartChecker = new SmartDiffChecker();
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

      // Optimization: Create a Set of covered lines for O(1) lookup
      // Iterate through statementMap once to build the covered lines set
      const coveredLines = new Set<number>();
      for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) { // eslint-disable-line @typescript-eslint/no-explicit-any
         if (fileCov.s[id] > 0) {
            for(let i = range.start.line; i <= range.end.line; i++) {
              coveredLines.add(i);
            }
         }
      }

      // Check if changed lines are in the covered set
      // We also need to verify if the line *contains* a statement. 
      // If a line has NO statement (blank, comment), it shouldn't count as uncovered.
      // So we need a set of "executable lines" too.
      // Re-thinking: The original logic checked if a line falls within a statement range AND that statement is covered.
      
      // Let's pre-compute a map of Line Number -> Covered status
      // 0 = Not executable (no statement)
      // 1 = Uncovered statement
      // 2 = Covered statement
      const lineStatus = new Map<number, number>();

      for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) { // eslint-disable-line @typescript-eslint/no-explicit-any
          const isCovered = fileCov.s[id] > 0;
          for(let i = range.start.line; i <= range.end.line; i++) {
              const currentStatus = lineStatus.get(i) || 0;
              // If already marked as covered (2), keep it. 
              // If marked as uncovered (1), and this statement is covered, upgrade to 2.
              // If not marked (0), set to 1 or 2.
              if (currentStatus === 2) continue;
              
              if (isCovered) {
                  lineStatus.set(i, 2);
              } else if (currentStatus === 0) {
                  lineStatus.set(i, 1);
              }
          }
      }


      for (const line of lines) {
        const status = lineStatus.get(line);
        // If status is 1 (Uncovered), report it.
        // If status is undefined or 0 (No statement), ignore it.
        // If status is 2 (Covered), ignore it.
        if (status === 1) {
            const content = await fs.readFile(absPath, 'utf8');
            if (!this.smartChecker.isIgnorable(absPath, content, line)) {
               uncovered.push(line);
            }
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
