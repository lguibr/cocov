
import { describe, it, expect, vi } from 'vitest';
import { htmlAction } from './html.js';
import { HistoryManager } from '../history.js';
import { readCurrentCoverage } from '../core/coverage/reader.js';

vi.mock('../history.js', () => ({
    HistoryManager: vi.fn().mockImplementation(() => ({
        readHistory: vi.fn().mockReturnValue([]),
    })),
}));

vi.mock('../core/coverage/reader.js', () => ({
    readCurrentCoverage: vi.fn(),
}));

vi.mock('../core/html/generator.js', () => ({
    HtmlGenerator: vi.fn().mockImplementation(() => ({
        generate: vi.fn().mockReturnValue('<html></html>'),
    })),
}));

vi.mock('fs-extra', () => ({
    default: {
        writeFile: vi.fn(),
        pathExists: vi.fn().mockResolvedValue(false),
    },
}));

describe('Debug HTML', () => {
    it('runs html action', async () => {
        vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as any);
        console.log('Running HTML Action...');
        await htmlAction();
        console.log('Done HTML Action');
    });
});
