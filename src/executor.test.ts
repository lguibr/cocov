import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTestCommand } from './executor.js';
import { execa } from 'execa';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('splits command and arguments correctly', async () => {
    await runTestCommand('npm run test --verbose');
    expect(execa).toHaveBeenCalledWith('npm', ['run', 'test', '--verbose'], { stdio: 'inherit' });
  });

  it('handles single command', async () => {
    await runTestCommand('jest');
    expect(execa).toHaveBeenCalledWith('jest', [], { stdio: 'inherit' });
  });
});
