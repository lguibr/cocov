
import { describe, it, expect } from 'vitest';
import { HtmlGenerator } from './generator.js';

describe('HtmlGenerator', () => {
    it('generates html with history and current data', () => {
        const generator = new HtmlGenerator([], { total: { lines: { pct: 100 } } } as any);
        const html = generator.generate();
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('100%');
    });
});
