import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StackGuard } from './stack-guard.js';
import fs from 'fs-extra';


vi.mock('fs-extra', () => ({
  default: {
    readJSON: vi.fn(),
    pathExists: vi.fn(),
  },
}));

describe('StackGuard', () => {
  let guard: StackGuard;
  const mockCwd = '/cwd';

  const mockPkg = {
    dependencies: {
      react: '18.0.0',
    },
    devDependencies: {
      typescript: '5.0.0',
    },
    peerDependencies: {
      vitest: '1.0.0',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new StackGuard(mockCwd);
    vi.mocked(fs.pathExists).mockResolvedValue(true); // Assume tsconfig/package.json exist
  });

  describe('check', () => {
    it('passes when requirements met', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ required: ['react'] })).resolves.not.toThrow();
    });

    it('fails when required dep missing', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ required: ['vue'] })).rejects.toThrow('Missing required dependencies: vue');
    });

    it('fails when forbidden dep present', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ forbidden: ['react'] })).rejects.toThrow('Found forbidden dependencies: react');
    });

    it('passes if no stack config', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({})).resolves.not.toThrow();
    });
    
    it('warns if tsconfig missing', async () => {
       vi.mocked(fs.pathExists).mockImplementation(async (p: unknown) => {
         if (p?.toString().endsWith('package.json')) return true;
         return false; // tsconfig missing
       });
       vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
       const consoleSpy = vi.spyOn(console, 'warn');
       await guard.check({});
       expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No tsconfig.json found'));
    });
    it('fails if package.json missing', async () => {
       vi.mocked(fs.pathExists).mockImplementation(async (p: unknown) => {
         // tsconfig exists, package.json missing
         if (p?.toString().endsWith('tsconfig.json')) return true;
         return false;
       });
       await expect(guard.check({})).rejects.toThrow('No package.json found');
    });
  });
});
