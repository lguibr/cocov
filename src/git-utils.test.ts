import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gitUtils from './git-utils.js';
import { execa } from 'execa';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('git-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentCommit', () => {
    it('returns commit hash on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'abc1234\n' } as never);
      const commit = await gitUtils.getCurrentCommit();
      expect(commit).toBe('abc1234');
    });

    it('returns unknown on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const commit = await gitUtils.getCurrentCommit();
      expect(commit).toBe('unknown');
    });
  });

  describe('getCurrentBranch', () => {
    it('returns branch name on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'feature/branch\n' } as never);
      const branch = await gitUtils.getCurrentBranch();
      expect(branch).toBe('feature/branch');
    });

    it('returns unknown on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const branch = await gitUtils.getCurrentBranch();
      expect(branch).toBe('unknown');
    });
  });

  describe('getChangedFiles', () => {
    it('returns changed files list on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'file1.ts\nfile2.ts\n' } as never);
      const files = await gitUtils.getChangedFiles();
      expect(files).toEqual(['file1.ts', 'file2.ts']);
    });

    it('returns empty array on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const files = await gitUtils.getChangedFiles();
      expect(files).toEqual([]);
    });
  });

  describe('getChangedLines', () => {
    it('returns changed lines map on success', async () => {
      const mockDiff = `diff --git a/foo.ts b/foo.ts
index e43e2b4..6dd38e3 100644
--- a/foo.ts
+++ b/foo.ts
@@ -10,0 +11,2 @@
+line1
+line2
`;
      vi.mocked(execa).mockResolvedValue({ stdout: mockDiff } as never);

      const result = await gitUtils.getChangedLines(process.cwd());
      expect(result['foo.ts']).toEqual([11, 12]);
    });

    it('returns empty object on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const result = await gitUtils.getChangedLines(process.cwd());
      expect(result).toEqual({});
    });
  });
});
