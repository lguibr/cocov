import { describe, it, expect, vi } from 'vitest';
import { verifyCoverageFreshness, computeIntegrityHash } from './integrity.js';
import fs from 'fs-extra';

vi.mock('fs-extra');

describe('verifyCoverageFreshness', () => {
  it('returns false if file does not exist', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => false);
    const result = await verifyCoverageFreshness('/cwd');
    expect(result).toBe(false);
  });

  it('returns true and warns if file is old', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => true);
    const oldStats = { mtimeMs: Date.now() - 20 * 60 * 1000 };
    vi.mocked(fs.stat).mockResolvedValue(oldStats as unknown as fs.Stats);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await verifyCoverageFreshness('/cwd');

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns true if file is fresh', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => true);
    const freshStats = { mtimeMs: Date.now() - 1 * 60 * 1000 };
    vi.mocked(fs.stat).mockResolvedValue(freshStats as unknown as fs.Stats);

    const result = await verifyCoverageFreshness('/cwd');
    expect(result).toBe(true);
  });
});

describe('computeIntegrityHash', () => {
  it('computes sha256 hash', async () => {
    const hash = await computeIntegrityHash({ foo: 'bar' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
