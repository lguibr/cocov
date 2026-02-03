import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from './scaffold.js';
import fs from 'fs-extra';
import { execa } from 'execa';
import path from 'path';

vi.mock('fs-extra');
vi.mock('execa', () => ({ execa: vi.fn() }));

describe('scaffoldConfig', () => {
  it('creates .cocov/config.json', async () => {
    const cwd = '/cwd';
    await scaffoldConfig(cwd, { enableStackGuard: true });

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(cwd, '.cocov', 'config.json'),
      expect.objectContaining({ stack: { required: [], forbidden: [] } }),
      expect.anything(),
    );
  });
});

describe('setupHusky', () => {
  const cwd = '/cwd';
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips if not selected', async () => {
    await setupHusky(cwd, { setupHusky: false });
    expect(execa).not.toHaveBeenCalled();
  });

  it('installs and inits husky', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(execa).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['install', 'husky']),
      expect.anything(),
    );
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['husky', 'init']),
      expect.anything(),
    );
    expect(fs.writeFile).toHaveBeenCalled();
  });
});

describe('setupGithub', () => {
  it('skips if not selected', async () => {
    vi.clearAllMocks(); // Ensure clean state
    await setupGithub('/cwd', { setupGithubAction: false });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('creates workflow file', async () => {
    await setupGithub('/cwd', { setupGithubAction: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('cocov.yml'),
      expect.stringContaining('name: Cocov CI'),
    );
  });
});

describe('updateGitIgnore', () => {
  it('skips if not selected', async () => {
    vi.clearAllMocks();
    await updateGitIgnore('/cwd', { updateGitIgnore: false });
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.appendFile).not.toHaveBeenCalled();
  });

  it('creates .gitignore if missing', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      expect.stringContaining('.cocov')
    );
  });

  it('appends to .gitignore if exists but missing entry', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(fs.readFile).mockResolvedValue('node_modules\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      expect.stringContaining('.cocov')
    );
  });

  it('skips appending if entry already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(fs.readFile).mockResolvedValue('node_modules\n.cocov\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).not.toHaveBeenCalled();
  });
});

describe('setupGithub idempotency', () => {
   it('skips if workflow already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    await setupGithub('/cwd', { setupGithubAction: true });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
