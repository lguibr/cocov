import { describe, it, expect } from 'vitest';
import { generateBadgeSvg, generateDiffBadge } from './generator.js';

describe('generateBadgeSvg', () => {
  it('generates standard badge (lines)', () => {
    const svg = generateBadgeSvg(95);
    expect(svg).toContain('<svg');
    expect(svg).toContain('95%');
    expect(svg).toContain('lines');
    expect(svg).toContain('#4c1'); // brightgreen
  });

  it('generates logo badge', () => {
    const svg = generateBadgeSvg(0, 'logo');
    expect(svg).toContain('viewBox="0 0 40 40"');
  });

  it('generates unified badge', () => {
    const summary = {
      lines: { pct: 80, total: 100, covered: 80, skipped: 0 },
      statements: { pct: 70, total: 100, covered: 70, skipped: 0 },
      functions: { pct: 60, total: 100, covered: 60, skipped: 0 },
      branches: { pct: 50, total: 100, covered: 50, skipped: 0 },
    };
    const svg = generateBadgeSvg(summary, 'unified');
    expect(svg).toContain('lines 80%');
    expect(svg).toContain('stmts 70%');
    expect(svg).toContain('br 50%');
  });

  it('returns empty string for invalid percentage on standard badge', () => {
    const svg = generateBadgeSvg({} as any, 'lines');
    expect(svg).toBe('');
  });

  it('handles custom label and color', () => {
    const svg = generateBadgeSvg(50, 'branches', { label: 'custom', color: '#000' });
    expect(svg).toContain('custom');
    expect(svg).toContain('#000');
  });

  // Exhaustive color check
  const colorTests = [
    { pct: 96, expected: '#4c1' },
    { pct: 85, expected: '#97ca00' },
    { pct: 75, expected: '#a4a61d' },
    { pct: 65, expected: '#dfb317' },
    { pct: 55, expected: '#fe7d37' },
    { pct: 45, expected: '#e05d44' },
  ];

  colorTests.forEach(({ pct, expected }) => {
    it(`uses correct color for ${pct}%`, () => {
      const svg = generateBadgeSvg(pct);
      expect(svg).toContain(expected);
    });
  });

  it('generates diff badge (positive)', () => {
    const svg = generateDiffBadge(5.4, 'lines', { label: 'Δ lines' });
    expect(svg).toContain('+5%');
    expect(svg).toContain('#4c1'); // green
    expect(svg).toContain('Δ lines');
  });

  it('generates diff badge (negative)', () => {
    const svg = generateDiffBadge(-2.1, 'lines');
    expect(svg).toContain('-2%');
    expect(svg).toContain('#e05d44'); // red
  });

  it('generates diff badge (neutral)', () => {
    const svg = generateDiffBadge(0, 'lines');
    expect(svg).toContain('±0%');
    expect(svg).toContain('#007ec6'); // blue
  });
});
