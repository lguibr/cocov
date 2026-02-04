import prompts from 'prompts';

export interface InitAnswers {
  overwrite?: boolean;
  enableStackGuard?: boolean;
  requiredDeps?: string[];
  setupHusky?: boolean;
  hooks?: string[];
  setupGithubAction?: boolean;
  updateGitIgnore?: boolean;
  testCommand?: string;
  runner?: 'vitest' | 'jest' | 'other';
  configureCoverage?: boolean;
  generateHtml?: boolean;
}

export interface InitDefaults {
  testCommand: string;
  runner: 'vitest' | 'jest' | 'other';
}

export async function askInitQuestions(configExists: boolean, defaults: InitDefaults): Promise<InitAnswers> {
  console.log('DEBUG: askInitQuestions executing');
  if (configExists) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'cocov.json already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) return { overwrite: false };
  }

  return prompts([
    {
      type: 'text',
      name: 'testCommand',
      message: 'Test Command (to run tests):',
      initial: defaults.testCommand,
    },
    {
      type: 'select',
      name: 'runner',
      message: 'Test Runner:',
      choices: [
        { title: 'Vitest', value: 'vitest' },
        { title: 'Jest', value: 'jest' },
        { title: 'Other', value: 'other' },
      ],
      initial: defaults.runner === 'vitest' ? 0 : defaults.runner === 'jest' ? 1 : 2,
    },
    {
      type: (prev) => (['vitest', 'jest'].includes(prev) ? 'confirm' : null),
      name: 'configureCoverage',
      message: 'Configure coverage reporting (json-summary)?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'generateHtml',
      message: 'Generate HTML report on run?',
      initial: true,
    },
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
      type: (prev) => (prev ? 'multiselect' : null),
      name: 'hooks',
      message: 'Select Git Hooks to Install:',
      choices: [
        { title: 'pre-commit (Quick Check)', value: 'pre-commit', selected: true },
        { title: 'pre-push (Full Validation)', value: 'pre-push', selected: true },
      ],
      min: 1,
    },
    {
      type: 'confirm',
      name: 'setupGithubAction',
      message: 'Generate GitHub Actions Workflow?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'updateGitIgnore',
      message: 'Add .cocov to .gitignore?',
      initial: true,
    },
  ]);
}
