import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';

export async function runInit(): Promise<void> {
  console.log(chalk.cyan(`
                      --::=-                       
                 ::-==:::::-==::                   
               :::===::::::::===:::                
             :::-===:::::::::-===:::               
             .......=========-......:              
                  .:=   ==  ==:                    
                      .::===                       
                     ::::::--                      
                  ----:::::::::                    
                 ===========-::::                  
                =======-:::::::::                  
                  =: :::::::::::                   
  `));
  console.log(chalk.bold.cyan('\n🚀 Welcome to Cocov: The Code Coverage Gate\n'));

  // 1. Detect existing config
  const cwd = process.cwd();
  const configPath = path.join(cwd, 'cocov.json');
  const exists = await fs.pathExists(configPath);

  if (exists) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'cocov.json already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) {
      console.log(chalk.yellow('Skipping configuration setup.'));
      return;
    }
  }


  // 2. Questions
  const response = await prompts([
    {
      type: 'confirm',
      name: 'enableStackGuard',
      message: 'Enable Stack Guard? (Enforce TypeScript & Deps)',
      initial: true,
    },
    {
      type: 'multiselect',
      name: 'requiredDeps',
      message: 'Select Critical Dependencies to Enforce:',
      choices: [
        { title: 'typescript', value: 'typescript', selected: true },
        { title: 'react', value: 'react' },
        { title: 'strapi', value: '@strapi/strapi' },
        { title: 'langchain', value: 'langchain' },
      ],
      min: 0,
      format: (val: string[]): string[] => val,
    },
    {
      type: 'confirm',
      name: 'setupHusky',
      message: 'Setup Husky Git Hooks?',
      initial: true,
    },
    {
        type: (prev) => prev ? 'multiselect' : null,
        name: 'hooks',
        message: 'Select Git Hooks to Install:',
        choices: [
            { title: 'pre-commit (Quick Check)', value: 'pre-commit', selected: true },
            { title: 'pre-push (Full Validation)', value: 'pre-push', selected: true },
        ],
        min: 1
    },
    {
      type: 'confirm',
      name: 'setupGithubAction',
      message: 'Generate GitHub Actions Workflow?',
      initial: true,
    }
  ]);

  // Handle cancellation
  if (!response.enableStackGuard && response.enableStackGuard !== false) {
    return;
  }

  // 3. Write Config
  const config = {
    total: 0, // baseline start
    stack: response.enableStackGuard
      ? {
          required: response.requiredDeps || [],
          forbidden: [],
        }
      : undefined,
  };

  await fs.writeJSON(configPath, config, { spaces: 2 });
  console.log(chalk.green(`\n✔ Created ${configPath}`));

  // 4. Setup Husky
  if (response.setupHusky && response.hooks) {
    try {
      console.log(chalk.blue('Installing Husky...'));
      await execa('npm', ['install', '-D', 'husky'], { stdio: 'inherit' });
      await execa('npx', ['husky', 'init'], { stdio: 'inherit' });

      for (const hook of response.hooks) {
          const hookPath = path.join(cwd, '.husky', hook);
          let command = '';
          
          if (hook === 'pre-commit') {
              command = 'npx cocov run "npm test" --dry-run';
          } else if (hook === 'pre-push') {
              command = 'npx cocov run "npm test"';
          }

          if (await fs.pathExists(hookPath)) {
            const content = await fs.readFile(hookPath, 'utf-8');
            if (!content.includes('cocov')) {
              await fs.appendFile(hookPath, `\n# Cocov Guard\n${command}\n`);
              console.log(chalk.green(`✔ Added cocov to ${hook} hook`));
            } else {
              console.log(chalk.gray(`✔ Cocov already in ${hook} hook`));
            }
          } else {
            await fs.writeFile(hookPath, `${command}\n`, { mode: 0o755 });
            console.log(chalk.green(`✔ Created ${hook} hook`));
          }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(chalk.red(`Failed to setup Husky: ${message}`));
    }
  }

  // 5. Setup GitHub Actions
  if (response.setupGithubAction) {
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

  console.log(chalk.bold.green('\n✨ Cocov setup complete!'));
}
// New Line
// Another Change
