import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showBanner } from './banner.js';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

vi.mock('fs-extra');

describe('banner', () => {
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

  it('prints ascii art from file if it exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('ASCII ART CONTENT');

    await showBanner();

    expect(fs.pathExists).toHaveBeenCalled();
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('assets/ascii-art.txt'), 'utf-8');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ASCII ART CONTENT'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });

  it('prints inline fallback if file does not exist', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);

    await showBanner();

    expect(fs.pathExists).toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
    // Check for inline content (part of it)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('.....:.'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });

  it('handles errors gracefully', async () => {
    vi.mocked(fs.pathExists as any).mockRejectedValue(new Error('FS Error'));

    await showBanner();

    // Should still print welcome message even if art fails
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });
});
