import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectIntoFile } from './injector.js';
import fs from 'fs-extra';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('injector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if file does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    const result = await injectIntoFile('README.md', 'CONTENT');
    expect(result).toBe(false);
  });

  it('returns false if markers not found', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Some content without markers');
    const result = await injectIntoFile('README.md', 'CONTENT');
    expect(result).toBe(false);
  });

  it('injects content between markers', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Before\n<!-- cocov-start -->\nOld\n<!-- cocov-end -->\nAfter');
    
    const result = await injectIntoFile('README.md', 'New Content');
    
    expect(result).toBe(true);
    expect(fs.writeFile).toHaveBeenCalledWith(
      'README.md',
      'Before\n<!-- cocov-start -->\nNew Content\n<!-- cocov-end -->\nAfter'
    );
  });
});
