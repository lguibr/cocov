import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiffChecker } from '../../diff-checker.js';
import * as git from '../../git-utils.js';
import path from 'path';

vi.mock('../../git-utils.js');

describe('DiffChecker', () => {
  const cwd = '/test';
  const checker = new DiffChecker(cwd);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty results if no files changed', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({});
    const results = await checker.checkDiffCoverage({});
    expect(results).toEqual([]);
  });

  it('detects uncovered lines in changed files warning', async () => {
    // Mock changed files: 'src/foo.ts' has changes on lines 10, 11
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/foo.ts': [10, 11],
    });

    // Mock detailed coverage
    const detailed = {
      [path.resolve(cwd, 'src/foo.ts')]: {
        statementMap: {
          '0': { start: { line: 10, column: 0 }, end: { line: 10, column: 10 } },
          '1': { start: { line: 11, column: 0 }, end: { line: 11, column: 10 } },
        },
        s: {
          '0': 0, // Uncovered
          '1': 1, // Covered
        },
      },
    };

    const results = await checker.checkDiffCoverage(detailed);

    expect(results).toHaveLength(1);
    expect(results[0].file).toBe('src/foo.ts');
    expect(results[0].changedLines).toEqual([10, 11]);
    expect(results[0].uncoveredLines).toEqual([10]);
  });

  it('ignores files not in detailed coverage', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/unknown.ts': [1],
    });

    const results = await checker.checkDiffCoverage({});
    expect(results).toEqual([]);
  });

  it('handles lines without statements gracefully', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/foo.ts': [20],
    });

    const detailed = {
      [path.resolve(cwd, 'src/foo.ts')]: {
        statementMap: {},
        s: {},
      },
    };

    const results = await checker.checkDiffCoverage(detailed);
    expect(results).toEqual([]);
  });
});
