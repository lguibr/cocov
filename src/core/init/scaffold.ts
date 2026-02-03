import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import { InitAnswers } from './questions.js';

export async function scaffoldConfig(cwd: string, answers: InitAnswers): Promise<void> {
  const hiddenDir = path.join(cwd, '.cocov');
  await fs.ensureDir(hiddenDir);
  const configPath = path.join(hiddenDir, 'config.json');

  // Check if root exists and warn? or just ignore?
  // If root exists, migration?
  // For now, new init = .cocov

  const config = {
    total: 0,
    stack: answers.enableStackGuard
      ? {
          required: answers.requiredDeps || [],
          forbidden: [],
        }
      : undefined,
  };

  await fs.writeJSON(configPath, config, { spaces: 2 });
  console.log(chalk.green(`\n✔ Created ${configPath}`));
}

export async function setupHusky(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.setupHusky || !answers.hooks) return;

  try {
    console.log(chalk.blue('Installing Husky...'));
    await execa('npm', ['install', 'husky', '--save-dev'], { cwd });
    await execa('npx', ['husky', 'init'], { cwd });

    for (const hook of answers.hooks) {
      const hookPath = path.join(cwd, '.husky', hook);
      let command = '';

      if (hook === 'pre-commit') {
        // Pre-commit Guard
        // 1. Lint Staged (if configured) or Lint
        // 2. Diff-Aware Coverage (Strict) preventing commit of untested code
        command = `
# Pre-commit Guard
npx cocov run --diff --dry-run
`;
      } else if (hook === 'pre-push') {
        // Pre-push Guard
        // 1. Typecheck
        // 2. Full Test Suite
        // 3. Full Coverage Verification
        command = `
# Pre-push Guard
npm run build
npm test
npx cocov run
`;
      } else {
        continue;
      }

      if (await fs.pathExists(hookPath)) {
        const content = await fs.readFile(hookPath, 'utf-8');
        if (!content.includes('cocov')) {
          await fs.appendFile(hookPath, `\n${command}\n`);
          console.log(chalk.green(`✔ Injected Cocov Guard into ${hook}`));
        }
      } else {
        await fs.writeFile(hookPath, `${command}\n`, { mode: 0o755 });
        console.log(chalk.green(`✔ Created hardened ${hook} hook`));
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(`Failed to setup Husky: ${message}`));
  }
}

export async function setupGithub(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.setupGithubAction) return;

  const githubDir = path.join(cwd, '.github', 'workflows');
  await fs.ensureDir(githubDir);
  const workflowPath = path.join(githubDir, 'cocov.yml');

  const workflow = `name: Cocov CI

on:
  push:
    branches: [ "main", "master", "develop" ]
  pull_request:
    branches: [ "main", "master", "develop" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run Tests & Cocov Guard
      run: npx cocov run "npm test"
`;

  await fs.writeFile(workflowPath, workflow);
  console.log(chalk.green(`\n✔ Created GitHub Action at ${workflowPath}`));
}

export async function updateGitIgnore(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.updateGitIgnore) return;

  const gitIgnorePath = path.join(cwd, '.gitignore');
  const ignoreEntry = '.cocov';

  try {
    if (await fs.pathExists(gitIgnorePath)) {
      const content = await fs.readFile(gitIgnorePath, 'utf-8');
      if (!content.includes(ignoreEntry)) {
        await fs.appendFile(gitIgnorePath, `\n${ignoreEntry}\n`);
        console.log(chalk.green(`✔ Added ${ignoreEntry} to .gitignore`));
      } else {
        console.log(chalk.gray(`ℹ ${ignoreEntry} already in .gitignore`));
      }
    } else {
      await fs.writeFile(gitIgnorePath, `${ignoreEntry}\n`);
      console.log(chalk.green(`✔ Created .gitignore with ${ignoreEntry}`));
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(`Failed to update .gitignore: ${message}`));
  }
}
