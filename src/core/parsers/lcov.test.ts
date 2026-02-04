import { describe, it, expect } from 'vitest';
import { parseLcovContent, convertLcovToTotal, convertLcovToDetailed } from './lcov.js';

const MOCK_LCOV = `
TN:
SF:src/file1.ts
FN:1,func1
FN:5,func2
FNDA:1,func1
FNDA:0,func2
DA:1,1
DA:2,1
DA:3,0
LF:3
LH:2
BRDA:1,0,0,1
BRDA:1,0,1,0
BRF:2
BRH:1
end_of_record
SF:src/file2.ts
DA:1,1
LF:1
LH:1
end_of_record
`;

describe('LCOV Parser', () => {
    it('parses lcov content correctly', () => {
        const records = parseLcovContent(MOCK_LCOV);
        expect(records).toHaveLength(2);
        
        expect(records[0].file).toBe('src/file1.ts');
        expect(records[0].lines.found).toBe(3);
        expect(records[0].lines.hit).toBe(2);
        expect(records[0].functions.found).toBe(0); // FN/FNDA count is complex, often manual found/hit needed
        
        // Manual check of details
        expect(records[0].functions.details).toHaveLength(2);
        expect(records[0].functions.details[0].hit).toBe(1);
        expect(records[0].functions.details[1].hit).toBe(0);

        expect(records[1].file).toBe('src/file2.ts');
    });

    it('converts to TotalCoverage', () => {
        const records = parseLcovContent(MOCK_LCOV);
        const total = convertLcovToTotal(records);

        expect(total.total.lines.total).toBe(4);
        expect(total.total.lines.covered).toBe(3);
        expect(total.total.lines.pct).toBe(75);

        // File 1 specific
        expect(total['src/file1.ts'].lines.total).toBe(3);
        expect(total['src/file1.ts'].lines.covered).toBe(2);
    });

    it('converts to DetailedCoverage (Statement Synthesis)', () => {
        const records = parseLcovContent(MOCK_LCOV);
        const detailed = convertLcovToDetailed(records);

        const file1 = detailed['src/file1.ts'];
        expect(file1).toBeDefined();
        expect(file1.s['0']).toBe(1); // Line 1
        expect(file1.s['1']).toBe(1); // Line 2
        expect(file1.s['2']).toBe(0); // Line 3

        expect(file1.statementMap['0']).toEqual({
            start: { line: 1, column: 0 },
            end: { line: 1, column: 100 }
        });
    });
});
