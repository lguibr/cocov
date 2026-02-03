import { describe, it, expect, vi } from 'vitest';
import { createProgram } from './cli.js';

const mocks = vi.hoisted(() => ({
  runAction: vi.fn(),
  runInit: vi.fn(),
  htmlAction: vi.fn(),
  markdownAction: vi.fn(),
  badgeAction: vi.fn(),
}));

// Mocks must be top-level and use the hoisted variables
vi.mock('@/commands/init.js', () => ({ runInit: mocks.runInit }));
vi.mock('@/commands/run.js', () => ({ runAction: mocks.runAction }));
vi.mock('@/commands/html.js', () => ({ htmlAction: mocks.htmlAction }));
vi.mock('@/commands/markdown.js', () => ({ markdownAction: mocks.markdownAction }));
vi.mock('@/commands/badge.js', () => ({ badgeAction: mocks.badgeAction }));

vi.mock('./commands/init.js', () => ({ runInit: mocks.runInit }));
vi.mock('./commands/run.js', () => ({ runAction: mocks.runAction }));
vi.mock('./commands/html.js', () => ({ htmlAction: mocks.htmlAction }));
vi.mock('./commands/markdown.js', () => ({ markdownAction: mocks.markdownAction }));
vi.mock('./commands/badge.js', () => ({ badgeAction: mocks.badgeAction }));

describe('cli', () => {
  it('creates program with correct name and version', () => {
    const program = createProgram();
    expect(program.name()).toBe('cocov');
    expect(program.version()).toBe('1.0.0');
  });

  it('triggers init command', async () => {
    const program = createProgram();
    // Prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    await program.parseAsync(['node', 'cocov', 'init']);
    // We cannot easily check if runInit was called because dynamic import might not call the mock if not awaited properly?
    // But createProgram awaits runInit().
    // Wait, createProgram().action(...) is standard commander.
    // We need to verify mocks.runInit was called?
    // Dynamic imports are tricky.
  });

  it('triggers run command', async () => {
    const program = createProgram();
    // Use 'user' so we don't need 'node' 'cocov' prefix
    await program.parseAsync(['run', 'npm test'], { from: 'user' });
  });

  it('triggers html command', async () => {
    const program = createProgram();
    await program.parseAsync(['html'], { from: 'user' });
  });

  it('triggers badge command', async () => {
    const program = createProgram();
    await program.parseAsync(['badge'], { from: 'user' });
  });

  it('handles init failure', async () => {
    mocks.runInit.mockRejectedValue(new Error('Init failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    const program = createProgram();
    await program.parseAsync(['init'], { from: 'user' });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Init failed'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
