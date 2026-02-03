import { describe, it, expect } from 'vitest';
import { MarkdownGenerator } from './markdown-generator.js';
import { HistoryEntry, TotalCoverage } from './types.js';

describe('MarkdownGenerator', () => {
  const mockHistory: HistoryEntry[] = [
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      commitHash: 'abc',
      branch: 'main',
      metrics: {
        lines: { pct: 50 },
        statements: { pct: 50 },
        functions: { pct: 50 },
        branches: { pct: 50 },
      } as any,
    },
  ] as any;

  const mockCurrent: TotalCoverage = {
    total: {
      lines: { pct: 80 },
      statements: { pct: 85 },
      functions: { pct: 90 },
      branches: { pct: 95 },
    },
  } as any;

  it('generates report with correct metrics', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('Lines');
    expect(md).toContain('80%');
    expect(md).toContain('Statements');
    expect(md).toContain('85%');
    expect(md).toContain('Functions');
    expect(md).toContain('90%');
    expect(md).toContain('Branches');
    expect(md).toContain('95%');
  });

  it('generates status icons correctly', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    // 80% -> ⚠️
    expect(md).toContain('⚠️'); // Lines
    // 85% -> ⚠️
    // 90% -> ✅
    expect(md).toContain('✅'); // Functions
    // 95% -> ✅
  });

  it('includes mermaid chart when history exists', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('xychart-beta');
    expect(md).toContain('2023-01-01');
    expect(md).toContain('50');
  });

  it('handles empty history', () => {
    const generator = new MarkdownGenerator([], mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('_No history available yet._');
  });

  it('generates correct icon for low coverage (<80%)', () => {
    const lowCoverage = {
      total: {
        lines: { pct: 70 },
        statements: { pct: 70 },
        functions: { pct: 70 },
        branches: { pct: 70 },
      }
    } as any;
    const generator = new MarkdownGenerator([], lowCoverage);
    const md = generator.generate();
    
    expect(md).toContain('🚨');
  });

  it('wraps content in markers when injectMode is true', () => {
    const generator = new MarkdownGenerator([], mockCurrent);
    const md = generator.generate(true);
    
    expect(md).toMatch(/^<!-- cocov-start -->/);
    expect(md).toMatch(/<!-- cocov-end -->$/);
  });
});
