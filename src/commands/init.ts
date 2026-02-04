import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { askInitQuestions, InitDefaults } from '@/core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from '@/core/init/scaffold.js';

export async function runInit(): Promise<void> {
  console.log(
    chalk.cyan(`
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
  `),
  );
  console.log(chalk.bold.cyan('\n🚀 Welcome to Cocov: The Code Coverage Gate\n'));

  const cwd = process.cwd();
  const configPath = path.join(cwd, 'cocov.json');
  const exists = await fs.pathExists(configPath);

  const defaults = await detectTestDefaults(cwd);
  const answers = await askInitQuestions(exists, defaults);

  // Handle cancellation/overwrite check
  if (exists && answers.overwrite === false) {
    console.log(chalk.yellow('Skipping configuration setup.'));
    return;
  }

  // Handle cancellation of questions
  if (answers.enableStackGuard === undefined && answers.overwrite !== false) {
    // If user Ctrl+C'd prompts
    return;
  }

  await scaffoldConfig(cwd, answers);
  await setupHusky(cwd, answers);
  await setupGithub(cwd, answers);
  await updateGitIgnore(cwd, answers);

  console.log(chalk.cyan(`
      ✨ Cocov Configuration Complete! ✨
  `));

  console.log(chalk.white(`
  Next Steps:
  
  1. Review your configuration:
     ${chalk.cyan('cat .cocov/config.json')}

  2. Run your first coverage check:
     ${chalk.cyan('npx cocov run')}

  3. (Optional) Visualize your coverage history:
     ${chalk.cyan('npx cocov history')}

  For more documentation, visit:
  ${chalk.underline.blue('https://github.com/lguibr/cocov')}
  `));

  console.log(chalk.green(`
       _..._
     .'     '.
    /  _   _  \\
    | (o)_(o) |
    |   (_)   |   Protection Active!
    /    _    \\
   /    | |    \\
  (____/   \\____)
  `));
}

async function detectTestDefaults(cwd: string): Promise<InitDefaults> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!await fs.pathExists(pkgPath)) {
    return { testCommand: 'npm test', runner: 'other' };
  }

  try {
    const pkg = await fs.readJSON(pkgPath);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const scripts = pkg.scripts || {};

    let runner: 'vitest' | 'jest' | 'other' = 'other';
    if (deps['vitest']) runner = 'vitest';
    else if (deps['jest']) runner = 'jest';

    let testCommand = 'npm test';
    
    // Smart command detection
    if (scripts.test) {
        testCommand = 'npm test';
    } else {
        if (runner === 'vitest') testCommand = 'npx vitest run';
        else if (runner === 'jest') testCommand = 'npx jest';
    }

    return { testCommand, runner };
  } catch {
    return { testCommand: 'npm test', runner: 'other' };
  }
}
