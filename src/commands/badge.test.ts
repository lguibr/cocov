import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badgeAction } from './badge.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { generateBadgeSvg } from '@/core/badges/generator.js';
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
    vi.mocked(generateBadgeSvg).mockReturnValue('<svg></svg>');
  });

  it('generates lines badge by default', async () => {
    await badgeAction({});
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'lines');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg></svg>');
  });

  it('generates specific badge type', async () => {
    await badgeAction({ type: 'branches' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'branches');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-branches.svg', '<svg></svg>');
  });

  it('generates unified badge', async () => {
    await badgeAction({ type: 'unified' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(expect.anything(), 'unified');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unified.svg', '<svg></svg>');
  });

  it('generates all badges', async () => {
    await badgeAction({ type: 'all' });
    expect(fs.outputFile).toHaveBeenCalledTimes(4);
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg></svg>');
  });

  it('handles output option', async () => {
    await badgeAction({ output: 'custom.svg' });
    expect(fs.outputFile).toHaveBeenCalledWith('custom.svg', '<svg></svg>');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('fail'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await badgeAction({});
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
