import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectReadmeAction } from './inject-readme.js';
import fs from 'fs-extra';
import prompts from 'prompts';
import { readCurrentCoverage, readBaseline } from '@/core/coverage/reader.js';
import { loadCocovConfig } from '@/config-loader.js';

vi.mock('fs-extra');
vi.mock('prompts');
vi.mock('@/core/coverage/reader.js');
vi.mock('@/config-loader.js');

describe('injectReadmeAction', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();

    // Default successful mocks
    vi.mocked(readCurrentCoverage).mockResolvedValue({
        total: {
            lines: { pct: 80, total: 100, covered: 80, skipped: 0 },
            statements: { pct: 80, total: 100, covered: 80, skipped: 0 },
            functions: { pct: 80, total: 100, covered: 80, skipped: 0 },
            branches: { pct: 80, total: 100, covered: 80, skipped: 0 }
        }
    } as any);
    vi.mocked(readBaseline).mockResolvedValue(null);
    vi.mocked(loadCocovConfig).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts if README.md does not exist', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);
    await injectReadmeAction();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find README.md'));
  });

  it('injects new badges with dynamic Shields.io URLs', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/lines-80.svg'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/branches-80.svg'),
        'utf-8'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('README.md updated'));
  });

    it('skips injection if user denies confirmation', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: false });

    await injectReadmeAction();

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
  });

  it('prepends badges if no H1 found', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Just some text\nNo header here.');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    const callArgs = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = callArgs[1] as string;
    expect(writtenContent.startsWith('<!-- COCOV_BADGES_START -->')).toBe(true);
  });

  it('injects diff badges if baseline exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });
    
    vi.mocked(readBaseline).mockResolvedValue({
        total: {
            lines: { pct: 70, total: 100, covered: 70, skipped: 0 },
            statements: { pct: 70, total: 100, covered: 70, skipped: 0 },
            functions: { pct: 70, total: 100, covered: 70, skipped: 0 },
            branches: { pct: 70, total: 100, covered: 70, skipped: 0 },
        }
    } as any);

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/lines-diff-10.svg'),
        'utf-8'
    );
  });

  it('updates existing badges correctly', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    const existingContent = `
# My Project
<!-- COCOV_BADGES_START -->
Old Badges
<!-- COCOV_BADGES_END -->
Description
    `.trim();
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);

    // Change coverage to 95%
    vi.mocked(readCurrentCoverage).mockResolvedValue({
        total: {
            lines: { pct: 95, total: 100, covered: 95, skipped: 0 },
            statements: { pct: 95, total: 100, covered: 95, skipped: 0 },
            functions: { pct: 95, total: 100, covered: 95, skipped: 0 },
            branches: { pct: 95, total: 100, covered: 95, skipped: 0 }
        }
    } as any);

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.not.stringContaining('Old Badges'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/lines-95.svg'),
        'utf-8'
    );
  });

  it('clamps values to available assets', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# Test');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });
    
    // Test > 100 coverage and < -100 diff
    vi.mocked(readCurrentCoverage).mockResolvedValue({
        total: {
            lines: { pct: 105, total: 100, covered: 105, skipped: 0 },
            statements: { pct: 105, total: 100, covered: 105, skipped: 0 },
            functions: { pct: 105, total: 100, covered: 105, skipped: 0 },
            branches: { pct: 105, total: 100, covered: 105, skipped: 0 }
        }
    } as any);
    
     vi.mocked(readBaseline).mockResolvedValue({
        total: {
            lines: { pct: 250, total: 100, covered: 250, skipped: 0 }, // Resulting diff will be -145
        }
    } as any);

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('lines-100.svg'), // Clamped 105 -> 100
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('lines-diff--100.svg'), // Clamped -145 -> -100
        'utf-8'
    );
  });
});
