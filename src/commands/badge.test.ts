import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badgeAction } from './badge.js';
import { readCurrentCoverage, readBaseline } from '@/core/coverage/reader.js';
import { generateBadgeSvg, generateDiffBadge } from '@/core/badges/generator.js';
import fs from 'fs-extra';

vi.mock('@/core/coverage/reader.js');
vi.mock('@/core/badges/generator.js');
vi.mock('fs-extra', () => ({
  default: {
    outputFile: vi.fn(),
  },
}));

describe('badgeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: {
        lines: { pct: 80 },
        statements: { pct: 80 },
        functions: { pct: 80 },
        branches: { pct: 80 },
      },
    } as never);
    vi.mocked(readBaseline).mockResolvedValue({
      total: {
        lines: { pct: 70 },
        statements: { pct: 70 },
        functions: { pct: 70 },
        branches: { pct: 70 },
      },
    } as never);
    vi.mocked(generateBadgeSvg).mockReturnValue('<svg>badge</svg>');
    vi.mocked(generateDiffBadge).mockReturnValue('<svg>diff</svg>');
  });

  it('generates lines badge by default', async () => {
    await badgeAction({});
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'lines');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg>badge</svg>');
  });

  it('generates specific badge type', async () => {
    await badgeAction({ type: 'branches' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'branches');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-branches.svg', '<svg>badge</svg>');
  });

  it('generates unified badge', async () => {
    await badgeAction({ type: 'unified' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(expect.anything(), 'unified');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unified.svg', '<svg>badge</svg>');
  });

  it('generates diff badge', async () => {
    await badgeAction({ type: 'diff-lines' });
    expect(readBaseline).toHaveBeenCalled();
    expect(generateDiffBadge).toHaveBeenCalledWith(10, 'lines', expect.anything());
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-diff-lines.svg', '<svg>diff</svg>');
  });
  
  it('generates diff badge with no baseline (warns)', async () => {
    vi.mocked(readBaseline).mockResolvedValue(null as never);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await badgeAction({ type: 'diff-lines' });
    
    expect(consoleSpy).toHaveBeenCalled();
    // Should default to 0 diff
    expect(generateDiffBadge).toHaveBeenCalledWith(0, 'lines', expect.anything());
  });

  it('generates all badges', async () => {
    await badgeAction({ type: 'all' });
    // 4 standard + 1 unified + 4 diff = 9 total
    expect(fs.outputFile).toHaveBeenCalledTimes(9);
    
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg>badge</svg>');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unified.svg', '<svg>badge</svg>');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-diff-lines.svg', '<svg>diff</svg>');
  });

  it('handles output option for single badge', async () => {
    await badgeAction({ output: 'custom.svg' });
    expect(fs.outputFile).toHaveBeenCalledWith('custom.svg', '<svg>badge</svg>');
  });

  it('handles output option for unified badge', async () => {
      await badgeAction({ type: 'unified', output: 'custom-u.svg' });
      expect(fs.outputFile).toHaveBeenCalledWith('custom-u.svg', '<svg>badge</svg>');
  });

  it('handles output option for all badges (prefix)', async () => {
      await badgeAction({ type: 'all', output: 'custom.svg' });
      // output should be replaced e.g. custom-lines.svg
      expect(fs.outputFile).toHaveBeenCalledWith('custom-lines.svg', '<svg>badge</svg>');
      expect(fs.outputFile).toHaveBeenCalledWith('custom-diff-lines.svg', '<svg>diff</svg>');
      expect(fs.outputFile).toHaveBeenCalledWith('custom-unified.svg', '<svg>badge</svg>');
  });

  it('generates logo badge', async () => {
    await badgeAction({ type: 'logo' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(0, 'logo');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-logo.svg', '<svg>badge</svg>');
  });

  it('defaults to lines for unknown type', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await badgeAction({ type: 'unknown' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown badge type 'unknown'"));
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'lines'); // 80 is lines pct mock
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unknown.svg', '<svg>badge</svg>');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('fail'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await badgeAction({});
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
