
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readBaseline, readDetailedCoverage, readCurrentCoverage } from './reader.js';
import { writeBaseline } from './writer.js';
import fs from 'fs-extra';
import path from 'path';
import { CocovFile } from '@/types.js';

vi.mock('fs-extra');

describe('Coverage IO', () => {
  const cwd = '/test/cwd';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readCurrentCoverage', () => {
    it('reads summary JSON if file exists', async () => {
      vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readJSON).mockResolvedValue({ total: { lines: { pct: 80 } } });
      
      const result = await readCurrentCoverage(cwd);
      expect(result).toEqual({ total: { lines: { pct: 80 } } });
    });

    it('throws error if summary file missing', async () => {
      vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      await expect(readCurrentCoverage(cwd)).rejects.toThrow('Could not find coverage summary');
    });
  });

  describe('readBaseline', () => {
    it('reads from .cocov/config.json if exists', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => p === path.join(cwd, '.cocov', 'config.json'));
      vi.mocked(fs.readJSON).mockResolvedValue({ total: 100 });

      const result = await readBaseline(cwd);
      expect(result).toEqual({ total: 100 });
      expect(fs.readJSON).toHaveBeenCalledWith(path.join(cwd, '.cocov', 'config.json'));
    });

    it('falls back to cocov.json', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => p === path.join(cwd, 'cocov.json'));
      vi.mocked(fs.readJSON).mockResolvedValue({ total: 90 });

      const result = await readBaseline(cwd);
      expect(result).toEqual({ total: 90 });
    });

    it('returns null if neither exists', async () => {
      vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await readBaseline(cwd);
      expect(result).toBeNull();
    });
  });

  describe('readDetailedCoverage', () => {
    it('returns null if file does not exist', async () => {
      vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await readDetailedCoverage(cwd);
      expect(result).toBeNull();
    });

    it('reads JSON if file exists', async () => {
      vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readJSON).mockResolvedValue({ 'src/foo.ts': {} });
      const result = await readDetailedCoverage(cwd);
      expect(result).toEqual({ 'src/foo.ts': {} });
    });
  });

  describe('writeBaseline', () => {
    it('writes to .cocov/config.json if directory exists', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => p.toString().endsWith('.cocov'));
      
      await writeBaseline(cwd, { total: 123 } as unknown as CocovFile);
      
      expect(fs.writeJSON).toHaveBeenCalledWith(
        path.join(cwd, '.cocov', 'config.json'),
        expect.objectContaining({ total: 123 }),
        expect.anything()
      );
    });

    it('writes to cocov.json if it exists and .cocov does not', async () => {
      vi.mocked(fs.pathExists).mockImplementation(async (p) => p.toString().endsWith('cocov.json'));

      await writeBaseline(cwd, { total: 123 } as unknown as CocovFile);

      expect(fs.writeJSON).toHaveBeenCalledWith(
        path.join(cwd, 'cocov.json'),
        expect.objectContaining({ total: 123 }),
        expect.anything()
      );
    });

    it('creates .cocov/ directory if nothing exists', async () => {
        vi.mocked(fs.pathExists as any).mockResolvedValue(false);
        
        await writeBaseline(cwd, { total: 123 } as unknown as CocovFile);
        
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join(cwd, '.cocov'));
        expect(fs.writeJSON).toHaveBeenCalledWith(
          path.join(cwd, '.cocov', 'config.json'),
          expect.anything(),
          expect.anything()
        );
      });
  });
});
