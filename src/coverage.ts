import fs from 'fs-extra';
import path from 'path';
import { TotalCoverage, CocovFile } from './types.js';

export class CoverageManager {
  private cwd: string;
  private coverageSummaryPath: string;
  private cocovPath: string;

  constructor(
    cwd: string = process.cwd(),
    coverageFile: string = 'coverage/coverage-summary.json',
  ) {
    this.cwd = cwd;
    this.coverageSummaryPath = path.resolve(cwd, coverageFile);
    this.cocovPath = path.join(cwd, 'cocov');
  }

  async readCurrentCoverage(): Promise<TotalCoverage> {
    // Try detailed first for diff features
    const detailedPath = path.resolve(this.cwd, 'coverage/coverage-final.json');
    if (await fs.pathExists(detailedPath)) {
        await fs.readJSON(detailedPath); // Ensure it's readable, but don't assign if not used here
    }

    if (!(await fs.pathExists(this.coverageSummaryPath))) {
      throw new Error(
        `Could not find coverage summary at ${this.coverageSummaryPath}. Did the test command generate it?`,
      );
    }
    const summary = await fs.readJSON(this.coverageSummaryPath);
    // Attach detailed if it exists (using a dirty cast or extending the type)
    // For now, we return summary. Usage of detailed will be essentially a separate read in DiffChecker.
    return summary;
  }

  async readDetailedCoverage(): Promise<Record<string, any> | null> {
      const detailedPath = path.resolve(this.cwd, 'coverage/coverage-final.json');
      if (await fs.pathExists(detailedPath)) {
          return fs.readJSON(detailedPath);
      }
      return null;
  }

  async readBaseline(): Promise<CocovFile | null> {
    if (!(await fs.pathExists(this.cocovPath))) {
      return null;
    }
    return fs.readJSON(this.cocovPath);
  }

  async writeBaseline(data: Partial<CocovFile>): Promise<void> {
    // Merge with existing if possible to preserve other config
    let existing = {};
    if (await fs.pathExists(this.cocovPath)) {
      existing = await fs.readJSON(this.cocovPath);
    }

    const newData = { ...existing, ...data };
    await fs.writeJSON(this.cocovPath, newData, { spaces: 2 });
  }
}
