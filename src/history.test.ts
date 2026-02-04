import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryManager } from './history.js';
import fs from 'fs-extra';
import path from 'path';

import readline from 'readline';

vi.mock('readline');
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    appendFile: vi.fn(),
    pathExists: vi.fn(),
    readFile: vi.fn(),
    createReadStream: vi.fn(),
  },
}));

describe('HistoryManager', () => {
  let manager: HistoryManager;
  const mockCwd = '/cwd';

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new HistoryManager(mockCwd);
  });

  describe('append', () => {
    it('appends entry to history file', async () => {
      const mockMetrics = { 
        lines: { pct: 80, total: 100, covered: 80, skipped: 20 },
        statements: { pct: 80, total: 100, covered: 80, skipped: 20 },
        functions: { pct: 80, total: 100, covered: 80, skipped: 20 },
        branches: { pct: 80, total: 100, covered: 80, skipped: 20 }
      };
      const mockContext = { 
        timestamp: new Date('2023-01-01'), 
        commitHash: 'abc', 
        branch: 'main',
        cwd: mockCwd
      };

      await manager.append(mockMetrics, mockContext);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(path.join(mockCwd, '.cocov', 'history.jsonl')));
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('history.jsonl'),
        expect.stringContaining('"commitHash":"abc"'),
        'utf8'
      );
    });
  });

  describe('readHistory', () => {
    it('returns empty array if file does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      const history = await manager.readHistory();
      expect(history).toEqual([]);
    });

    it('parses valid history entries', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield '{"metrics":{}}\n';
          yield '{"metrics":{}}\n';
        }
      };
      // @ts-ignore
      vi.mocked(fs.createReadStream).mockReturnValue(mockStream);
      
      // Mock readline to iterate the provided stream (since we are mocking createInterface)
       vi.mocked(readline.createInterface).mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
            yield '{"metrics":{}}';
            yield '{"metrics":{}}';
        }
      } as any);
      
      const history = await manager.readHistory();
      expect(history).toHaveLength(2);
    });

    it('filters invalid lines', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      
      vi.mocked(readline.createInterface).mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
            yield '{"valid":true}';
            yield 'INVALID_JSON';
        }
      } as any);
      
      const history = await manager.readHistory();
      expect(history).toHaveLength(1);
    });
  });
});
