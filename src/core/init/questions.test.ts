import { describe, it, expect, vi, beforeEach } from 'vitest';
// Ensure we use the REAL module
vi.unmock('./questions.js');
import { askInitQuestions } from './questions.js';
import prompts from 'prompts';

vi.mock('prompts');

describe('askInitQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts for overwrite if config exists', async () => {
    console.log('Running questions test case 1');
    vi.mocked(prompts).mockResolvedValueOnce({ overwrite: false });
    const result = await askInitQuestions(true, { testCommand: 'cmd', runner: 'other' });
    expect(result).toEqual({ overwrite: false });
  });

  it('skips prompts if config does not exist', async () => {
    console.log('Running questions test case 2');
    vi.mocked(prompts).mockResolvedValueOnce({ 
      testCommand: 'npm test',
      runner: 'other',
      configureCoverage: false,
      enableStackGuard: true,
      requiredDeps: ['typescript'],
      setupHusky: true,
      hooks: ['pre-commit'],
      setupGithubAction: true,
      updateGitIgnore: true
    });
    
    const result = await askInitQuestions(false, { testCommand: 'cmd', runner: 'other' });
    expect(result.enableStackGuard).toBe(true);
  });

  it('validates prompt definitions', async () => {
    await askInitQuestions(false, { testCommand: 'cmd', runner: 'other' });
    const calls = vi.mocked(prompts).mock.calls;
    const questionsArray = calls[calls.length - 1][0] as any[];
    
    // Find requiredDeps question format
    const reqDeps = questionsArray.find(q => q.name === 'requiredDeps');
    expect(reqDeps.format(['a', 'b'])).toEqual(['a', 'b']);

    // Find hooks question type
    const hooks = questionsArray.find(q => q.name === 'hooks');
    expect(hooks.type(true)).toBe('multiselect');
    expect(hooks.type(false)).toBe(null);

    // Find configureCoverage question type
    const coverage = questionsArray.find(q => q.name === 'configureCoverage');
    expect(coverage.type('vitest')).toBe('confirm');
    expect(coverage.type('jest')).toBe('confirm');
    expect(coverage.type('other')).toBe(null);

    // Find generateHtml question type
    const html = questionsArray.find(q => q.name === 'generateHtml');
    expect(html.type).toBe('confirm');
  });

  it('sets correct runner initial value based on defaults', async () => {
    // Vitest (0)
    await askInitQuestions(false, { testCommand: 'cmd', runner: 'vitest' });
    const calls1 = vi.mocked(prompts).mock.lastCall![0] as any[];
    const runner1 = calls1.find(q => q.name === 'runner');
    expect(runner1.initial).toBe(0);

    // Jest (1)
    await askInitQuestions(false, { testCommand: 'cmd', runner: 'jest' });
    const calls2 = vi.mocked(prompts).mock.lastCall![0] as any[];
    const runner2 = calls2.find(q => q.name === 'runner');
    expect(runner2.initial).toBe(1);

    // Other (2)
    await askInitQuestions(false, { testCommand: 'cmd', runner: 'other' });
    const calls3 = vi.mocked(prompts).mock.lastCall![0] as any[];
    const runner3 = calls3.find(q => q.name === 'runner');
    expect(runner3.initial).toBe(2);
  });
});
