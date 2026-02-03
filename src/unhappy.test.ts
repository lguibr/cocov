import { describe, it, expect, vi } from 'vitest';
import fs from 'fs-extra';
import { readBaseline } from './core/coverage/reader.js';
import { handleBaselineCheck } from './core/logic/baseline-handler.js';

vi.mock('fs-extra');

describe('Unhappy Paths', () => {
  describe('Reader Exceptions', () => {
    it('handles corrupted JSON in baseline', async () => {
      // Force readJSON to throw
      vi.mocked(fs.pathExists).mockImplementation(async () => true);
      vi.mocked(fs.readJSON).mockRejectedValue(new Error('Unexpected token'));

      await expect(readBaseline('/cwd')).rejects.toThrow('Unexpected token');
    });

    it('handles permission denied', async () => {
      vi.mocked(fs.pathExists).mockRejectedValue(new Error('EACCES'));
      await expect(readBaseline('/cwd')).rejects.toThrow('EACCES');
    });
  });

  // Add more unhappy paths
});
