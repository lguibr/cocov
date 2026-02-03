import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInit } from './init.js';
import { askInitQuestions } from '@/core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from '@/core/init/scaffold.js';
import fs from 'fs-extra';

vi.mock('@/core/init/questions.js');
vi.mock('@/core/init/scaffold.js');
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
  },
}));

describe('runInit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: true } as never);
  });

  it('runs full init workflow', async () => {
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalled();
    expect(scaffoldConfig).toHaveBeenCalled();
    expect(setupHusky).toHaveBeenCalled();
    expect(setupGithub).toHaveBeenCalled();
    expect(updateGitIgnore).toHaveBeenCalled();
  });

  it('skips if overwrite denied', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: false } as never);
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });

  it('aborts on cancellation', async () => {
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: undefined } as never);
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });
});
