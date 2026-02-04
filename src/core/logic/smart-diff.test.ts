
import { describe, it, expect } from 'vitest';
import { SmartDiffChecker } from './smart-diff.js';
import path from 'path';

describe('SmartDiffChecker', () => {
    const checker = new SmartDiffChecker();
    const tsFile = path.resolve('test.ts');

    it('identifies whitespace as ignorable', () => {
        expect(checker.isIgnorable(tsFile, '   \n   ', 1)).toBe(true);
        expect(checker.isIgnorable(tsFile, '\t\t', 1)).toBe(true);
    });

    it('identifies single line comments as ignorable', () => {
        expect(checker.isIgnorable(tsFile, '// just a comment', 1)).toBe(true);
        expect(checker.isIgnorable(tsFile, '  // indented comment', 1)).toBe(true);
    });

    it('identifies code as significant', () => {
        expect(checker.isIgnorable(tsFile, 'const x = 1;', 1)).toBe(false);
        expect(checker.isIgnorable(tsFile, 'return true;', 1)).toBe(false);
    });

    it('identifies empty blocks in block comments as ignorable', () => {
        // Simple regex check in v0 implementation
        expect(checker.isIgnorable(tsFile, '/* comment */', 1)).toBe(true);
        expect(checker.isIgnorable(tsFile, '   /* comment */   ', 1)).toBe(true);
    });

    it('identifies code mixed with comments as significant', () => {
        expect(checker.isIgnorable(tsFile, 'const x = 1; // comment', 1)).toBe(false);
        // Our regex might fail this if simplistic. The implementation checks line startsWith //
        // For /* */, if it removes it and string is empty -> ignorable.
        // If 'const x = 1; /* */', stripped is 'const x = 1; ', which trims to code. -> False (Significant).
             expect(checker.isIgnorable(tsFile, 'const x = 1; /* comment */', 1)).toBe(false);
    });
});
