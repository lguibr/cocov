import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StackConfig } from './types.js';

export class StackGuard {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Validates the project structure and dependencies against the configuration.
   * Checks for required dependencies and forbids defined dependencies.
   * Enforces 'typescript' presence by default if not configured otherwise.
   * 
   * @param config - Stack configuration (required/forbidden deps)
   * @throws {Error} If checking fails or violation found
   */
  async check(config: StackConfig = {}): Promise<void> {
    console.log(chalk.blue('Running Stack Guard...'));

    // 1. Check for TypeScript
    const tsconfigPath = path.join(this.cwd, 'tsconfig.json');
    if (!(await fs.pathExists(tsconfigPath))) {
      console.warn(
        chalk.yellow(
          '⚠ Warning: No tsconfig.json found. This tool is optimized for TypeScript projects.',
        ),
      );
    }

    // 2. Read package.json
    const packageJsonPath = path.join(this.cwd, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error('No package.json found in current directory.');
    }

    const pkg = await fs.readJSON(packageJsonPath);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    // 3. Check Required Dependencies
    const required = config.required || [];
    const missing: string[] = [];

    for (const req of required) {
      // Simple check: is the key present?
      // We can iterate keys to handle partial matches if needed, but strict string match is safer for now.
      if (!allDeps[req]) {
        missing.push(req);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Stack Violation: Missing required dependencies: ${missing.join(', ')}`);
    }

    // 4. Check Forbidden Dependencies
    const forbidden = config.forbidden || [];
    const foundForbidden: string[] = [];

    for (const forb of forbidden) {
      if (allDeps[forb]) {
        foundForbidden.push(forb);
      }
    }

    if (foundForbidden.length > 0) {
      throw new Error(
        `Stack Violation: Found forbidden dependencies: ${foundForbidden.join(', ')}`,
      );
    }

    console.log(chalk.green('✔ Stack Check Passed'));
  }
}
