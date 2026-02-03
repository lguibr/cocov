import { describe, it, expect } from 'vitest';
import { generateBadgeSvg } from './generator.js';

describe('generateBadgeSvg', () => {
  it('generates svg string', () => {
    const svg = generateBadgeSvg(95);
    expect(svg).toContain('<svg');
    expect(svg).toContain('95%');
    expect(svg).toContain('#4c1'); // brightgreen
  });

  it('uses red for low coverage', () => {
    const svg = generateBadgeSvg(10);
    expect(svg).toContain('10%');
    expect(svg).toContain('#e05d44'); // red
  });
});
