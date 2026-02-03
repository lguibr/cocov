
import prompts from 'prompts';

export interface InitAnswers {
    overwrite?: boolean;
    enableStackGuard?: boolean;
    requiredDeps?: string[];
    setupHusky?: boolean;
    hooks?: string[];
    setupGithubAction?: boolean;
}

export async function askInitQuestions(configExists: boolean): Promise<InitAnswers> {
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
}
