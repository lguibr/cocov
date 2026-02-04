import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHtmlReport } from './runner.js';
import fs from 'fs-extra';
import { HistoryManager } from '../../history.js';
import { readCurrentCoverage, readDetailedCoverage } from '../coverage/reader.js';
import { HtmlGenerator } from './generator.js';

vi.mock('fs-extra');
vi.mock('../../history.js');
vi.mock('../coverage/reader.js');
vi.mock('./generator.js');

describe('generateHtmlReport', () => {
    const cwd = '/cwd';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(HistoryManager).mockImplementation(() => ({
            readHistory: vi.fn().mockResolvedValue([])
        }) as any);
        vi.mocked(HtmlGenerator).mockImplementation(() => ({
            generate: vi.fn().mockReturnValue('<html></html>')
        }) as any);
    });

    it('generates html report', async () => {
        await generateHtmlReport(cwd);

        expect(readCurrentCoverage).toHaveBeenCalledWith(cwd);
        expect(readDetailedCoverage).toHaveBeenCalledWith(cwd);
        expect(fs.ensureDir).toHaveBeenCalledWith(`${cwd}/.cocov/reports`);
        expect(fs.writeFile).toHaveBeenCalledWith(
            `${cwd}/.cocov/reports/index.html`,
            '<html></html>'
        );
    });

    it('handles errors', async () => {
        const error = new Error('Generate failed');
        vi.mocked(readCurrentCoverage).mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(generateHtmlReport(cwd)).rejects.toThrow('Generate failed');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error generating HTML report:'), error);
    });
});
