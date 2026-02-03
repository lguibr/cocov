
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runInit } from './init.js';
import { htmlAction } from './html.js';
import { badgeAction } from './badge.js';
// Mocks
import { askInitQuestions } from '../core/init/questions.js';
import { scaffoldConfig } from '../core/init/scaffold.js';
import { HistoryManager } from '../history.js';
import { readCurrentCoverage } from '../core/coverage/reader.js';
import { HtmlGenerator } from '../core/html/generator.js';
import { generateBadgeSvg } from '../core/badges/generator.js';
import fs from 'fs-extra';

// Setup Mocks
vi.mock('../core/init/questions.js', () => ({
    askInitQuestions: vi.fn(),
}));

vi.mock('../core/init/scaffold.js', () => ({
    scaffoldConfig: vi.fn(),
    setupHusky: vi.fn(),
    setupGithub: vi.fn(),
}));

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

vi.mock('../core/badges/generator.js', () => ({
    generateBadgeSvg: vi.fn(),
}));

vi.mock('fs-extra', () => ({
    default: {
        writeFile: vi.fn(),
        outputFile: vi.fn(),
        pathExists: vi.fn().mockResolvedValue(false),
    },
    writeFile: vi.fn(),
    outputFile: vi.fn(),
    pathExists: vi.fn().mockResolvedValue(false),
}));

describe('CLI Commands', () => {
    let exitSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('init: runs successful workflow', async () => {
        vi.mocked(askInitQuestions).mockResolvedValue({ 
            enableStackGuard: true,
            requiredDeps: [],
            forbiddenDeps: [],
            hooks: ['pre-commit'],
            setupHusky: true,
            setupGithubAction: true,
            overwrite: true
        } as any);

        await runInit();

        expect(askInitQuestions).toHaveBeenCalled();
        expect(scaffoldConfig).toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('html: generates report', async () => {
        vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as any);
        
        await htmlAction();

        expect(process.exit).not.toHaveBeenCalled();
        expect(fs.writeFile).toHaveBeenCalled();
    });

    it('html: handles error', async () => {
        vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('Test Error'));
        
        await htmlAction();

        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('badge: generates svg', async () => {
        vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 90 } } } as any);
        vi.mocked(generateBadgeSvg).mockReturnValue('<svg></svg>');
        
        await badgeAction({ output: 'badge.svg' });

        expect(fs.outputFile).toHaveBeenCalledWith('badge.svg', '<svg></svg>');
    });
});
