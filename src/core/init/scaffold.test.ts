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

  it('creates .cocov/config.json without stack if disabled', async () => {
    const cwd = '/cwd';
    await scaffoldConfig(cwd, { enableStackGuard: false });

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(cwd, '.cocov', 'config.json'),
      expect.objectContaining({ stack: undefined }),
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

  it('configures pre-push hook', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-push'] });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('pre-push'),
        expect.stringContaining('npm run build'),
        expect.anything()
    );
  });

  it('handles errors gracefully', async () => {
    vi.mocked(execa).mockRejectedValue(new Error('Husky fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Husky fail'));
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(execa).mockRejectedValue('String Error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('String Error'));
  });

  it('skips unknown hooks', async () => {
    await setupHusky(cwd, { setupHusky: true, hooks: ['unknown-hook'] });
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.appendFile).not.toHaveBeenCalled();
  });


  it('appends to hook if it exists but missing cocov', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile as any).mockResolvedValue('#!/bin/sh\nPrevious Hook');
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('pre-commit'),
        expect.stringContaining('cocov'),
    );
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
    vi.mocked(fs.readFile as any).mockResolvedValue('node_modules\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      expect.stringContaining('.cocov')
    );
  });

  it('skips appending if entry already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(fs.readFile as any).mockResolvedValue('node_modules\n.cocov\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    vi.mocked(fs.pathExists as any).mockRejectedValue(new Error('FS Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('FS Error'));
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(fs.pathExists as any).mockRejectedValue('String FS Error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('String FS Error'));
  });
});

describe('setupGithub idempotency', () => {
   it('skips if workflow already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    await setupGithub('/cwd', { setupGithubAction: true });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
