import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { askInitQuestions } from '../core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub } from '../core/init/scaffold.js';

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

  const answers = await askInitQuestions(exists);

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

  console.log(chalk.bold.green('\n✨ Cocov setup complete!'));
}
