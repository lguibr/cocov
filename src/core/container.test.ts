
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContainer, resetContainer } from './container.js';
import { HistoryManager } from '../history.js';

vi.mock('../history.js');

describe('DIContainer', () => {
  beforeEach(() => {
    resetContainer();
    vi.clearAllMocks();
  });

  it('returns singleton instance', () => {
    const container1 = getContainer();
    const container2 = getContainer();
    expect(container1).toBe(container2);
  });

  it('lazily initializes historyManager', () => {
    const container = getContainer();
    expect(HistoryManager).not.toHaveBeenCalled();

    const hm = container.historyManager;
    expect(hm).toBeDefined();
    expect(HistoryManager).toHaveBeenCalledTimes(1);
    
    // Should return same instance
    const hm2 = container.historyManager;
    expect(hm2).toBe(hm);
    expect(HistoryManager).toHaveBeenCalledTimes(1);
  });

  it('allows mocking historyManager', () => {
    const container = getContainer();
    const mockHM = { readHistory: vi.fn() } as any;
    
    container.setHistoryManager(mockHM);
    expect(container.historyManager).toBe(mockHM);
  });
});
