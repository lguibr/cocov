import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectReadmeAction } from './inject-readme.js';
import fs from 'fs-extra';
import { badgeAction } from './badge.js';
import prompts from 'prompts';

vi.mock('fs-extra');
vi.mock('./badge.js');
vi.mock('prompts');

describe('injectReadmeAction', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts if README.md does not exist', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);
    await injectReadmeAction();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find README.md'));
  });

  it('injects new badges if no markers found (confirmation yes)', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/cocov-badge-unified.svg'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('My Project'), // Integrity check
        'utf-8'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('README.md updated'));
  });

    it('skips injection if user denies confirmation', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: false });

    await injectReadmeAction();

    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' }); // Still generates badges
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
  });

  it('prepends badges if no H1 found (new injection)', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Just some text\nNo header here.');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('<!-- COCOV_BADGES_START -->\n[![Cocov Unified]'),
        'utf-8'
    );
     // Should be at the start
    const callArgs = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = callArgs[1] as string;
    expect(writtenContent.startsWith('<!-- COCOV_BADGES_START -->')).toBe(true);
  });

  it('injects after existing badge cluster', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# Title\n![License](https://img.shields.io/license)\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('![License](https://img.shields.io/license)\n<!-- COCOV_BADGES_START -->'),
        'utf-8'
    );
  });

  it('ignores badge cluster if too far down', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    // Create a large file padding to force regex loop break
    const padding = 'a'.repeat(2500);
    vi.mocked(fs.readFile).mockResolvedValue(`# Title\n\n${padding}\n![License](https://img.shields.io/license)\nDescription`);
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    // Should behave as if no badge cluster found (inject after title)
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('# Title\n\n<!-- COCOV_BADGES_START -->'),
        'utf-8'
    );
  });

  it('updates existing badges if markers found', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    const existingContent = `
# My Project
<!-- COCOV_BADGES_START -->
Old Badges
<!-- COCOV_BADGES_END -->
Description
    `.trim();
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);

    await injectReadmeAction();
    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('<!-- COCOV_BADGES_START -->'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.not.stringContaining('Old Badges'), // Should be replaced
        'utf-8'
    );
     expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Updating existing'));
  });
});
