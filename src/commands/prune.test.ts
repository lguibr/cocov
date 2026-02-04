
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pruneAction } from './prune.js';
import fs from 'fs-extra';
import readline from 'readline';

vi.mock('readline');
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    createReadStream: vi.fn(),
    createWriteStream: vi.fn(),
    move: vi.fn(),
  }
}));

const mockWriteStream = {
  write: vi.fn().mockReturnValue(true),
  end: vi.fn(),
  once: vi.fn((event, cb) => {
    if (event === 'finish') cb();
    if (event === 'drain') cb(); // Auto-drain for tests
    return mockWriteStream;
  }),
};

describe('pruneAction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        
        // Default mocks
        vi.mocked(fs.pathExists).mockResolvedValue(true);
        // @ts-ignore
        vi.mocked(fs.createWriteStream).mockReturnValue(mockWriteStream);
        
        // Default readline mock to return empty iterator to avoid crash
        vi.mocked(readline.createInterface).mockReturnValue({
             [Symbol.asyncIterator]: async function* () {}
        } as any);
    });

    it('exits if keep is invalid', async () => {
        await pruneAction({}, { keep: 'abc' });
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('skips if no history file', async () => {
        vi.mocked(fs.pathExists).mockResolvedValue(false);
        await pruneAction({}, {});
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No history file found'));
    });

    it('skips if total lines <= keep', async () => {
        // Mock 2 lines for first pass
        vi.mocked(readline.createInterface).mockReturnValue({
            [Symbol.asyncIterator]: async function* () {
                yield 'line1';
                yield 'line2';
            }
        } as any);

        await pruneAction({}, { keep: '10' });
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('already within limits'));
        expect(fs.createWriteStream).not.toHaveBeenCalled();
    });

    it('prunes old entries', async () => {
        // We need to return different iterators for different calls
        const iter1 = { [Symbol.asyncIterator]: async function*() { yield '1'; yield '2'; yield '3'; yield '4'; yield '5'; } };
        const iter2 = { [Symbol.asyncIterator]: async function*() { yield '1'; yield '2'; yield '3'; yield '4'; yield '5'; } };

        vi.mocked(readline.createInterface)
            .mockReturnValueOnce(iter1 as any)
            .mockReturnValueOnce(iter2 as any);

        await pruneAction({}, { keep: '2' });

        expect(mockWriteStream.write).toHaveBeenCalledTimes(2);
        expect(fs.move).toHaveBeenCalled();
    });
});

