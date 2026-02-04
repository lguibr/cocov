import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAction } from './run.js';
import { readBaseline, readCurrentCoverage } from '@/core/coverage/reader.js';

import { StackGuard } from '@/stack-guard.js';
import { runTestCommand } from '@/executor.js';
import { runDiffCheck } from '@/core/logic/diff-runner.js';
import { handleBaselineCheck } from '@/core/logic/baseline-handler.js';
import { enforceThresholds, ThresholdError } from '@/core/logic/threshold-gate.js';
import { verifyCoverageFreshness, verifyGitStatus } from '@/core/integrity.js';
import { generateHtmlReport } from '@/core/html/runner.js';
import { loadCocovConfig } from '@/config-loader.js';
import { validateGitHistory } from '@/git-utils.js';
import fs from 'fs-extra';

vi.mock('../core/coverage/reader.js');
vi.mock('../history.js');
vi.mock('../stack-guard.js');
vi.mock('../executor.js');
vi.mock('../core/logic/diff-runner.js');
vi.mock('../core/logic/baseline-handler.js');
vi.mock('../core/integrity.js');
vi.mock('../core/html/runner.js');
vi.mock('../config-loader.js');
vi.mock('../git-utils.js');

vi.mock('fs-extra', () => {
  const mockFs = {
    pathExists: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    readFile: vi.fn(),
    stat: vi.fn(),
    readJson: vi.fn(),
  };
  return {
    default: mockFs,
    ...mockFs,
  };
});

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
    vi.mocked(readBaseline).mockResolvedValue({ stack: {}, total: 0, testCommand: 'npm test' } as never);
    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as never);
    vi.mocked(loadCocovConfig).mockResolvedValue({});
  });

  it('runs test command and handles baseline', async () => {
    await runAction('npm test', {});
    
    expect(verifyCoverageFreshness).toHaveBeenCalled();
    expect(verifyGitStatus).toHaveBeenCalled();
    expect(validateGitHistory).toHaveBeenCalled();
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

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('x file.ts: 50%'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('generates html report if enabled in config', async () => {
    vi.mocked(loadCocovConfig).mockResolvedValue({ 
      html: { enabled: true }
    });
    vi.mocked(readBaseline).mockResolvedValue(null);
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: { lines: { pct: 80 }, statements: { pct: 80 }, functions: { pct: 80 }, branches: { pct: 80 } },
      files: {}
    } as never);

    await runAction('npm test', { dryRun: false });

    expect(generateHtmlReport).toHaveBeenCalled();
  });

  it('skips html report if disabled in config', async () => {
    vi.mocked(loadCocovConfig).mockResolvedValue({ 
      html: { enabled: false }
    });
    vi.mocked(readBaseline).mockResolvedValue(null);
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: { lines: { pct: 80 }, statements: { pct: 80 }, functions: { pct: 80 }, branches: { pct: 80 } },
      files: {}
    } as never);

    await runAction('npm test', { dryRun: false });

    expect(generateHtmlReport).not.toHaveBeenCalled();
  });

  it('skips html report if config missing', async () => {
    // @ts-ignore
    vi.mocked(readBaseline).mockResolvedValue(null);
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: { lines: { pct: 80 }, statements: { pct: 80 }, functions: { pct: 80 }, branches: { pct: 80 } },
      files: {}
    } as never);

    await runAction('npm test', { dryRun: false });

    expect(generateHtmlReport).not.toHaveBeenCalled();
  });
  it('renders UI if --ui option is provided', async () => {
    const mockRender = vi.fn();
    const mockCreateElement = vi.fn();
    const mockDashboard = vi.fn();

    vi.doMock('ink', () => ({ render: mockRender }));
    vi.doMock('react', () => ({ createElement: mockCreateElement }));
    vi.doMock('../ui/dashboard.js', () => ({ Dashboard: mockDashboard }));
    
    // We need detailed coverage for UI
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: { lines: { pct: 80 }, statements: { pct: 80 }, functions: { pct: 80 }, branches: { pct: 80 } },
      files: {}
    } as never);

    // readDetailedCoverage is dynamically imported, we need to mock it effectively or assume top level mock works.
    // Top level mock works for 'reader.js'. We need to make sure readDetailedCoverage is exposed.
    // However, run.ts does: const { readDetailedCoverage } = await import(...)
    // So the top level vi.mock('../core/coverage/reader.js') should handle it IF it mocks readDetailedCoverage.
    // By default vitest automock creates spies for exports.
    const reader = await import('../core/coverage/reader.js');
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue({ 'src/foo.ts': {} } as never);

    await runAction('npm test', { ui: true });

    // Since dynamic imports are async, and we used doMock, we hope they pick up.
    // Actually top level mock is safer for dynamic imports usually if they share module registry.
    expect(mockRender).toHaveBeenCalled();
    expect(mockCreateElement).toHaveBeenCalled();
  });
});
