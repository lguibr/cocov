
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadCocovConfig } from './config-loader.js';
import { loadConfig } from 'unconfig';

vi.mock('unconfig');

describe('Config Loader', () => {
    const cwd = '/test/cwd';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads config from valid source', async () => {
        const mockConfig = { thresholds: { lines: 90 } };
        vi.mocked(loadConfig).mockResolvedValue({
            config: mockConfig,
            sources: [],
        } as any);

        const result = await loadCocovConfig(cwd);

        expect(loadConfig).toHaveBeenCalledWith(expect.objectContaining({
            cwd,
            sources: expect.any(Array),
        }));
        expect(result).toEqual(mockConfig);
    });

    it('returns empty object if no config found', async () => {
        vi.mocked(loadConfig).mockResolvedValue({
            config: undefined,
            sources: [],
        } as any);

        const result = await loadCocovConfig(cwd);
        expect(result).toEqual({});
    });

    it('correctly defines sources', async () => {
        vi.mocked(loadConfig).mockResolvedValue({ config: {}, sources: [] } as any);
        await loadCocovConfig(cwd);

        const callArgs = vi.mocked(loadConfig).mock.calls[0][0];
        const sources = callArgs.sources as any[];

        expect(sources).toHaveLength(4);
        expect(sources[0].files).toBe('cocov.config');
        expect(sources[1].files).toBe('cocov');
        expect(sources[2].files).toBe('.cocov/config');
        expect(sources[3].files).toBe('package');
    });

    it('handles package.json rewrite logic', async () => {
        vi.mocked(loadConfig).mockResolvedValue({ config: {}, sources: [] } as any);
        await loadCocovConfig(cwd);

        const callArgs = vi.mocked(loadConfig).mock.calls[0][0];
        const packageSource = callArgs.sources.find((s: any) => s.files === 'package');
        
        expect(packageSource).toBeDefined();
        
        // Test rewrite function
        const configWithCocov = { cocov: { foo: 'bar' }, other: 'stuff' };
        const configWithoutCocov = { other: 'stuff' };
        
        expect(packageSource.rewrite(configWithCocov)).toEqual({ foo: 'bar' });
        expect(packageSource.rewrite(configWithoutCocov)).toBeUndefined();
        expect(packageSource.rewrite(null)).toBeUndefined();
    });
});
