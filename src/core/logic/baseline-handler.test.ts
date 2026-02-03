import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import { handleBaselineCheck } from './baseline-handler.js';
import * as writer from '@/core/coverage/writer.js';
// import * as reporter from '@/reporter.js'; // Unused
import * as comparator from '@/comparator.js';
import * as git from '@/git-utils.js';

vi.mock('@/core/coverage/writer.js');
vi.mock('@/reporter.js');
vi.mock('@/comparator.js');
vi.mock('@/git-utils.js');
vi.mock('fs-extra');

describe('handleBaselineCheck', () => {
  const mockHistory = { append: vi.fn() } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const cwd = '/test';
  const current = { total: { lines: { pct: 80 } } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const baseline = { total: { lines: { pct: 80 } } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writer.writeBaseline).mockResolvedValue();
    vi.mocked(git.getCurrentCommit).mockResolvedValue('abc');
    vi.mocked(git.getCurrentBranch).mockResolvedValue('main');

    // Default comparator mock
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({
      isRegression: false,
      improved: false,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('writes baseline if none exists (not dry run)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await handleBaselineCheck(cwd, current, null, { dryRun: false }, mockHistory);
    expect(writer.writeBaseline).toHaveBeenCalledWith(cwd, current);
    expect(mockHistory.append).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    // Should not write file directly, only via writer
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('does not write baseline if none exists (dry run)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await handleBaselineCheck(cwd, current, null, { dryRun: true }, mockHistory);
    expect(writer.writeBaseline).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits on regression', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({
      isRegression: true,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await handleBaselineCheck(cwd, current, baseline, {}, mockHistory);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('updates baseline on improvement', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({ improved: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    await handleBaselineCheck(cwd, current, baseline, { dryRun: false }, mockHistory);
    expect(writer.writeBaseline).toHaveBeenCalledWith(cwd, current);
  });

  it('does not update baseline on improvement (dry run)', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({ improved: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    await handleBaselineCheck(cwd, current, baseline, { dryRun: true }, mockHistory);
    expect(writer.writeBaseline).not.toHaveBeenCalled();
  });
});
