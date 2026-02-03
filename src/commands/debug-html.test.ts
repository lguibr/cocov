import { describe, it, vi, beforeEach } from 'vitest';
import { htmlAction } from './html.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { TotalCoverage } from '@/types.js';

vi.mock('@/history.js');
vi.mock('@/core/coverage/reader.js');
vi.mock('@/core/html/generator.js');
vi.mock('fs-extra', () => ({
  default: {
    writeFile: vi.fn(),
    ensureDir: vi.fn(),
    pathExists: vi.fn().mockResolvedValue(false),
  },
}));

import { HistoryManager } from '@/history.js';
import { HtmlGenerator } from '@/core/html/generator.js';

describe('Debug HTML', () => {
  beforeEach(() => {
    // Reset HistoryManager mock
    vi.mocked(HistoryManager).mockImplementation(() => ({
      readHistory: vi.fn().mockReturnValue([]),
    } as never));

    // Reset HtmlGenerator mock
    vi.mocked(HtmlGenerator).mockImplementation(() => ({
      generate: vi.fn().mockReturnValue('<html></html>'),
    } as never));
  });

  it('runs html action', async () => {
    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as unknown as TotalCoverage);
    console.log('Running HTML Action...');
    await htmlAction();
    console.log('Done HTML Action');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('HTML fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    await htmlAction();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error generating HTML report'), expect.anything());
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
