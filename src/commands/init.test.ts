import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInit } from './init.js';
import { askInitQuestions } from '@/core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from '@/core/init/scaffold.js';
import fs from 'fs-extra';

vi.mock('@/core/init/questions.js');
vi.mock('@/core/init/scaffold.js');

vi.mock('fs-extra', () => {
  const mockFs = {
    pathExists: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    readFile: vi.fn(),
  };
  return {
    default: mockFs,
    ...mockFs,
  };
});

describe('runInit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.readJSON).mockResolvedValue({});
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: true } as never);
  });

  it('runs full init workflow', async () => {
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(false, expect.objectContaining({ testCommand: 'npm test' }));
    expect(scaffoldConfig).toHaveBeenCalled();
    expect(setupHusky).toHaveBeenCalled();
    expect(setupGithub).toHaveBeenCalled();
    expect(updateGitIgnore).toHaveBeenCalled();
  });

  it('detects defaults when package.json missing', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    // mock readJSON should not be called, but just in case
    vi.mocked(fs.readJSON).mockResolvedValue({});
    
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(
        false, 
        expect.objectContaining({ testCommand: 'npm test', runner: 'other' })
    );
  });

  it('detects defaults with error reading package.json', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readJSON).mockRejectedValue(new Error('Read error'));
    
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(
        true, 
        expect.objectContaining({ testCommand: 'npm test', runner: 'other' })
    );
  });

  it('detects vitest runner', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue({
        dependencies: { vitest: '^1.0.0' }
    });
    
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(
        true, 
        expect.objectContaining({ testCommand: 'npx vitest run', runner: 'vitest' })
    );
  });

  it('detects jest runner', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue({
        devDependencies: { jest: '^29.0.0' }
    });
    
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(
        true, 
        expect.objectContaining({ testCommand: 'npx jest', runner: 'jest' })
    );
  });

  it('prefers existing test script', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readJSON).mockResolvedValue({
        dependencies: { vitest: '^1.0.0' },
        scripts: { test: 'custom test' }
    });
    
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalledWith(
        true, 
        expect.objectContaining({ testCommand: 'npm test', runner: 'vitest' })
    );
  });

  it('aborts on cancellation', async () => {
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: undefined } as never);
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });

  it('skips if overwrite denied', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    // @ts-ignore
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: false });
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });
});
