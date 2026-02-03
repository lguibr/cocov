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
    const result = await askInitQuestions(true);
    expect(result).toEqual({ overwrite: false });
  });

  it('skips prompts if config does not exist', async () => {
    console.log('Running questions test case 2');
    vi.mocked(prompts).mockResolvedValueOnce({ 
      enableStackGuard: true,
      requiredDeps: ['typescript'],
      setupHusky: true,
      hooks: ['pre-commit'],
      setupGithubAction: true,
      updateGitIgnore: true
    });
    
    const result = await askInitQuestions(false);
    expect(result.enableStackGuard).toBe(true);
  });
});
