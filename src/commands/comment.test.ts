import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commentAction } from './comment.js';
import fs from 'fs-extra';
import chalk from 'chalk';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readFile: vi.fn(),
    readJSONSync: vi.fn(),
  }
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('commentAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.GITHUB_TOKEN = 'mock-token';
        process.env.GITHUB_REPOSITORY = 'owner/repo';
        process.env.GITHUB_REF = 'refs/pull/123/merge';
        process.env.GITHUB_EVENT_PATH = '';
        
        vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('exits if GITHUB_TOKEN missing', async () => {
        delete process.env.GITHUB_TOKEN;
        await commentAction();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('skips if PR number not found', async () => {
        delete process.env.GITHUB_REF;
        await commentAction();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Could not determine PR number'));
    });

    it('exits if report missing', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false);
        await commentAction();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('posts comment successfully', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true);
        vi.mocked(fs.readFile).mockResolvedValue('# Coverage Report');
        mockFetch.mockResolvedValue({ ok: true } as Response);

        await commentAction();

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/owner/repo/issues/123/comments',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer mock-token'
                }),
                body: JSON.stringify({ body: '## 🚀 Cocov Report\n\n# Coverage Report' })
            })
        );
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Comment posted successfully'));
    });

    it('handles API error', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(true);
        vi.mocked(fs.readFile).mockResolvedValue('# Coverage Report');
        mockFetch.mockResolvedValue({ 
            ok: false, 
            status: 403, 
            text: () => Promise.resolve('Forbidden') 
        } as Response);

        await commentAction();

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to post comment'));
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
