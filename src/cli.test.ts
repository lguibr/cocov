import { describe, it, expect, vi } from 'vitest';
import { createProgram } from './cli.js';
import fs from 'fs-extra';

const mocks = vi.hoisted(() => ({
  runAction: vi.fn(),
  runInit: vi.fn(),
  htmlAction: vi.fn(),
  markdownAction: vi.fn(),
  badgeAction: vi.fn(),
  injectReadmeAction: vi.fn(),
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
vi.mock('./commands/inject-readme.js', () => ({ injectReadmeAction: mocks.injectReadmeAction }));
vi.mock('@/commands/inject-readme.js', () => ({ injectReadmeAction: mocks.injectReadmeAction }));

describe('cli', () => {
  it('creates program with correct name and version', async () => {
    // Mock cli.ts internal fs read
    vi.spyOn(fs, 'readJSON').mockResolvedValue({ version: '3.4.1' });
    
    const program = await createProgram();
    expect(program.name()).toBe('cocov');
    expect(program.version()).toBe('3.4.1');
  });

  it('triggers init command', async () => {
    const program = await createProgram();
    // Prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    await program.parseAsync(['node', 'cocov', 'init']);
    expect(mocks.runInit).toHaveBeenCalled();
  });

  it('triggers run command', async () => {
    const program = await createProgram();
    // Use 'user' so we don't need 'node' 'cocov' prefix
    await program.parseAsync(['run', 'npm test'], { from: 'user' });
    expect(mocks.runAction).toHaveBeenCalled();
  });

  it('triggers html command', async () => {
    const program = await createProgram();
    await program.parseAsync(['html'], { from: 'user' });
    expect(mocks.htmlAction).toHaveBeenCalled();
  });

  it('triggers badge command', async () => {
    const program = await createProgram();
    await program.parseAsync(['badge'], { from: 'user' });
    expect(mocks.badgeAction).toHaveBeenCalled();
  });

  it('triggers markdown command', async () => {
    const program = await createProgram();
    await program.parseAsync(['markdown'], { from: 'user' });
    expect(mocks.markdownAction).toHaveBeenCalled();
  });

  it('triggers inject-readme command', async () => {
    const program = await createProgram();
    await program.parseAsync(['inject-readme'], { from: 'user' });
    expect(mocks.injectReadmeAction).toHaveBeenCalled();
  });

  it('handles init failure', async () => {
    mocks.runInit.mockRejectedValue(new Error('Init failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    const program = await createProgram();
    await program.parseAsync(['init'], { from: 'user' });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Init failed'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles unknown init errors', async () => {
    mocks.runInit.mockRejectedValue('Unknown String Error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    const program = await createProgram();
    await program.parseAsync(['init'], { from: 'user' });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
