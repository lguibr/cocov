import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDiffCheck } from './diff-runner.js';
import * as reader from '@/core/coverage/reader.js';
import { DiffChecker } from '@/diff-checker.js';

vi.mock('@/core/coverage/reader.js');
vi.mock('@/diff-checker.js');

describe('runDiffCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips if detailed coverage missing', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue(null);
    await runDiffCheck('/cwd');
    // valid, no error
  });

  it('passes if no diffs', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue({});
    vi.spyOn(DiffChecker.prototype, 'checkDiffCoverage').mockResolvedValue([]);
    await runDiffCheck('/cwd');
    // valid
  });

  it('exits if uncovered changes', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue({});
    // changedLines is required by DiffResult type, check definition
    // Assuming DiffChecker uses DiffResult { file, uncoveredLines, changedLines }
    vi.spyOn(DiffChecker.prototype, 'checkDiffCoverage').mockResolvedValue([
      { file: 'f', uncoveredLines: [1], changedLines: [1] },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDiffCheck('/cwd');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
