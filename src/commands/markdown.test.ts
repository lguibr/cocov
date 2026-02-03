import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markdownAction } from './markdown.js';
import { HistoryManager } from '@/history.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { MarkdownGenerator } from '@/markdown-generator.js';
import { injectIntoFile } from '@/injector.js';
import fs from 'fs-extra';

vi.mock('../history.js');
vi.mock('../core/coverage/reader.js');
vi.mock('../markdown-generator.js');
vi.mock('../injector.js');
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('markdownAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(HistoryManager).mockImplementation(() => ({
      readHistory: vi.fn().mockResolvedValue([]),
    } as never));

    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as never);
    
    vi.mocked(MarkdownGenerator).mockImplementation(() => ({
      generate: vi.fn().mockReturnValue('# Report'),
    } as never));

    vi.mocked(injectIntoFile).mockResolvedValue(true);
  });

  it('generates markdown file', async () => {
    await markdownAction({});
    expect(fs.writeFile).toHaveBeenCalledWith('.cocov/reports/summary.md', '# Report');
  });

  it('injects into README when option provided', async () => {
    await markdownAction({ inject: 'README.md' });
    expect(injectIntoFile).toHaveBeenCalledWith('README.md', '# Report');
  });

  it('logs warning if injection fails', async () => {
    vi.mocked(injectIntoFile).mockResolvedValue(false);
    const consoleSpy = vi.spyOn(console, 'log');
    await markdownAction({ inject: 'README.md' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find injection markers'));
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('fail'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await markdownAction({});
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
