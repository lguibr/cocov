
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readCurrentCoverage, readDetailedCoverage, readBaseline } from './reader.js';
import fs from 'fs-extra';
import path from 'path';

vi.mock('fs-extra');
vi.mock('@/core/parsers/lcov.js', () => ({
    parseLcovContent: vi.fn(),
    convertLcovToTotal: vi.fn(),
    convertLcovToDetailed: vi.fn()
}));

// Import mocked modules to setup return values
import { parseLcovContent, convertLcovToTotal, convertLcovToDetailed } from '@/core/parsers/lcov.js';

describe('Coverage Reader', () => {
    const cwd = '/test/cwd';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('readCurrentCoverage', () => {
        it('reads strict file if provided', async () => {
            const file = 'custom-coverage.json';
            const absPath = path.resolve(cwd, file);
            const mockData = { total: { lines: { pct: 100 } } };

            vi.mocked(fs.pathExists).mockResolvedValue(true);
            vi.mocked(fs.readJSON).mockResolvedValue(mockData);

            const result = await readCurrentCoverage(cwd, file);
            
            expect(fs.pathExists).toHaveBeenCalledWith(absPath);
            expect(fs.readJSON).toHaveBeenCalledWith(absPath);
            expect(result).toEqual(mockData);
        });

        it('throws if strict file does not exist', async () => {
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             await expect(readCurrentCoverage(cwd, 'missing.json'))
                .rejects.toThrow('Could not find coverage file');
        });

        it('falls back to coverage-summary.json if no file arg', async () => {
            const summaryPath = path.resolve(cwd, 'coverage/coverage-summary.json');
            const mockData = { total: { lines: { pct: 50 } } };
            
            vi.mocked(fs.pathExists).mockImplementation(async (p) => p === summaryPath);
            vi.mocked(fs.readJSON).mockResolvedValue(mockData);

            const result = await readCurrentCoverage(cwd);
            expect(result).toEqual(mockData);
        });

        it('falls back to lcov.info if summary missing', async () => {
            const summaryPath = path.resolve(cwd, 'coverage/coverage-summary.json');
            const lcovPath = path.resolve(cwd, 'coverage/lcov.info');
            const mockLcov = 'lcov content';
            const mockParsed = { total: { lines: { pct: 75 } } };

            vi.mocked(fs.pathExists).mockImplementation(async (p) => p === lcovPath);
            vi.mocked(fs.readFile).mockResolvedValue(mockLcov);
            vi.mocked(convertLcovToTotal).mockReturnValue(mockParsed as any);

            const result = await readCurrentCoverage(cwd);
            
            expect(fs.readFile).toHaveBeenCalledWith(lcovPath, 'utf8');
            expect(result).toEqual(mockParsed);
        });

        it('falls back to detailed aggregation calculation if all standard files missing', async () => {
             // Mock standard checks failing
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             // Mock readdir for detailed search
             vi.mocked(fs.readdir).mockResolvedValue([{ name: 'coverage-final.json', isDirectory: () => false } as any]);
             
             // Mock reading detailed file
             const detailedPath = path.join(cwd, 'coverage-final.json');
             const mockDetailed = {
                 [path.join(cwd, 'foo.ts')]: {
                     s: { '0': 1, '1': 0 },
                     f: { '0': 1 },
                     b: { '0': [1] },
                     statementMap: {
                         '0': { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
                         '1': { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } }
                     }
                 }
             };
             vi.mocked(fs.readJSON).mockResolvedValue(mockDetailed);
             
             const result = await readCurrentCoverage(cwd);
             
             // 50% statements (1/2), 100% functions (1/1), 100% branches (1/1)
             expect(result.total.statements.pct).toBe(50);
             expect(result.total.functions.pct).toBe(100);
             expect(result.total.branches.pct).toBe(100);
        });
        
         it('throws if absolutely no coverage found', async () => {
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             vi.mocked(fs.readdir).mockResolvedValue([]); // No files found anywhere
             
             await expect(readCurrentCoverage(cwd)).rejects.toThrow('Could not find coverage file');
         });
    });

    describe('readDetailedCoverage', () => {
        it('returns default coverage-final.json if exists', async () => {
            const defaultPath = path.resolve(cwd, 'coverage/coverage-final.json');
            const mockData = { 'foo.ts': {} };
            vi.mocked(fs.pathExists).mockResolvedValue(true);
            vi.mocked(fs.readJSON).mockResolvedValue(mockData);

            const result = await readDetailedCoverage(cwd);
            expect(fs.readJSON).toHaveBeenCalledWith(defaultPath);
            expect(result).toEqual(mockData);
        });

        it('recurses to find coverage-final.json files', async () => {
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             
             // Mock directory structure:
             // /cwd
             //   packages/
             //     pkgA/
             //       coverage-final.json
             vi.mocked(fs.readdir).mockImplementation(async (dir) => {
                 if (dir === cwd) return [{ name: 'packages', isDirectory: () => true } as any];
                 if (dir === path.join(cwd, 'packages')) return [{ name: 'pkgA', isDirectory: () => true } as any];
                 if (dir === path.join(cwd, 'packages', 'pkgA')) return [{ name: 'coverage-final.json', isDirectory: () => false } as any];
                 return [];
             });

             const foundPath = path.join(cwd, 'packages', 'pkgA', 'coverage-final.json');
             vi.mocked(fs.readJSON).mockResolvedValue({ 'a.ts': {} });

             const result = await readDetailedCoverage(cwd);
             expect(fs.readJSON).toHaveBeenCalledWith(foundPath);
             expect(result).toEqual({ 'a.ts': {} });
        });

        it('falls back to recursive lcov.info search if no json found', async () => {
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             // Only find lcov.info
              vi.mocked(fs.readdir).mockImplementation(async (dir) => {
                 if (dir === cwd) return [{ name: 'lcov.info', isDirectory: () => false } as any];
                 return [];
             });
             
             vi.mocked(fs.readFile).mockResolvedValue('lcov data');
             vi.mocked(convertLcovToDetailed).mockReturnValue({ 'a.ts': {} } as any);

             const result = await readDetailedCoverage(cwd);
             expect(result).toEqual({ 'a.ts': {} });
        });
        
         it('ignores excluded directories', async () => {
             vi.mocked(fs.pathExists).mockResolvedValue(false);
             const dirs = ['node_modules', '.git', '.cocov', 'dist', 'build'];
             const dirents = dirs.map(d => ({ name: d, isDirectory: () => true } as any));
             
             vi.mocked(fs.readdir).mockResolvedValue(dirents);
             
             // Should not recurse into these, so findCoverageFiles returns empty immediately
             const result = await readDetailedCoverage(cwd);
             // If returns null means found nothing
             expect(result).toBeNull();
        });
    });

    describe('readBaseline', () => {
        it('prioritizes .cocov/config.json', async () => {
            const hidden = path.join(cwd, '.cocov', 'config.json');
            vi.mocked(fs.pathExists).mockImplementation(async (p) => p === hidden);
            vi.mocked(fs.readJSON).mockResolvedValue({ type: 'hidden' });
            
            const result = await readBaseline(cwd);
            expect(result).toEqual({ type: 'hidden' });
        });

        it('falls back to cocov.json', async () => {
            const root = path.join(cwd, 'cocov.json');
            vi.mocked(fs.pathExists).mockImplementation(async (p) => p === root);
            vi.mocked(fs.readJSON).mockResolvedValue({ type: 'root' });
            
            const result = await readBaseline(cwd);
            expect(result).toEqual({ type: 'root' });
        });

        it('returns null if neither exists', async () => {
            vi.mocked(fs.pathExists).mockResolvedValue(false);
            const result = await readBaseline(cwd);
            expect(result).toBeNull();
        });
    });
});
