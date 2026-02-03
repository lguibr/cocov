import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAction } from './run.js';
import { readBaseline, readCurrentCoverage } from '@/core/coverage/reader.js';

import { StackGuard } from '@/stack-guard.js';
import { runTestCommand } from '@/executor.js';
import { runDiffCheck } from '@/core/logic/diff-runner.js';
import { handleBaselineCheck } from '@/core/logic/baseline-handler.js';
import { enforceThresholds, ThresholdError } from '@/core/logic/threshold-gate.js';
import { verifyCoverageFreshness } from '@/core/integrity.js';

vi.mock('../core/coverage/reader.js');
vi.mock('../history.js');
vi.mock('../stack-guard.js');
vi.mock('../executor.js');
vi.mock('../core/logic/diff-runner.js');
vi.mock('../core/logic/baseline-handler.js');
vi.mock('../core/logic/baseline-handler.js');
vi.mock('../core/integrity.js');
vi.mock('../core/logic/threshold-gate.js', async () => {
  const actual = await vi.importActual('../core/logic/threshold-gate.js');
  return {
    ...actual,
    enforceThresholds: vi.fn(),
  };
});

describe('runAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue('/cwd');
    vi.mocked(readBaseline).mockResolvedValue({ stack: {} });
    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as never);
  });

  it('runs test command and handles baseline', async () => {
    await runAction('npm test', {});
    
    expect(verifyCoverageFreshness).toHaveBeenCalled();
    expect(runTestCommand).toHaveBeenCalledWith('npm test');
    expect(handleBaselineCheck).toHaveBeenCalled();
  });

  it('enforces stack guard if enabled', async () => {
    const mockCheck = vi.fn();
    vi.mocked(StackGuard).mockImplementation(() => ({ check: mockCheck } as never));
    
    await runAction('npm test', { enforceStack: true });
    
    expect(mockCheck).toHaveBeenCalled();
  });

  it('runs diff check if enabled', async () => {
    await runAction('npm test', { diff: true });
    expect(runDiffCheck).toHaveBeenCalled();
  });

  it('handles dry run', async () => {
    await runAction('npm test', { dryRun: true });
    expect(handleBaselineCheck).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), expect.objectContaining({ dryRun: true }), expect.anything());
  });

  it('handles errors gracefully', async () => {
    vi.mocked(runTestCommand).mockRejectedValue(new Error('Test failed'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    await runAction('npm test', {});
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles unknown errors', async () => {
    vi.mocked(runTestCommand).mockRejectedValue('String Error');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runAction('npm test', {});

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles ThresholdError', async () => {
    // @ts-ignore
    vi.mocked(enforceThresholds).mockImplementation(() => {
      throw new ThresholdError(['file.ts: 50%'], 80);
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runAction('npm test', {});

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Per-File Coverage Threshold Failed (Min 80%):'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('x file.ts: 50%'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
