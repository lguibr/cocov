import { DetailedCoverage, TotalCoverage, CoverageSummary, CoverageMetric } from '@/types.js';

export interface LcovEntry {
  file: string;
  lines: {
    found: number;
    hit: number;
    details: Array<{ line: number; hit: number }>;
  };
  functions: {
    found: number;
    hit: number;
    details: Array<{ line: number; hit: number; name: string }>;
  };
  branches: {
    found: number;
    hit: number;
    details: Array<{ line: number; block: number; branch: number; taken: number }>;
  };
}

/**
 * Parses LCOV content string into structured data.
 */
export function parseLcovContent(content: string): LcovEntry[] {
  const records: LcovEntry[] = [];
  let current: Partial<LcovEntry> = initializeEntry();

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'end_of_record') {
      if (current.file) {
        records.push(current as LcovEntry);
      }
      current = initializeEntry();
      continue;
    }

    const [key, value] = trimmed.split(':');
    if (!value && key !== 'TN') continue; // Handle potential malformed lines? TN usually has no value

    switch (key) {
      case 'SF':
        current.file = value;
        break;
      case 'DA': {
        const [ln, hit] = value.split(',').map(Number);
        current.lines?.details.push({ line: ln, hit });
        break;
      }
      case 'LF':
        if (current.lines) current.lines.found = Number(value);
        break;
      case 'LH':
        if (current.lines) current.lines.hit = Number(value);
        break;
      case 'FN': {
        const [ln, name] = value.split(',');
        // We only store location here, hit count comes from FNDA
        current.functions?.details.push({ line: Number(ln), hit: 0, name });
        break;
      }
      case 'FNDA': {
        const [hit, name] = value.split(',');
        const func = current.functions?.details.find(f => f.name === name);
        if (func) func.hit = Number(hit);
        break;
      }
      case 'FNF':
        if (current.functions) current.functions.found = Number(value);
        break;
      case 'FNH':
        if (current.functions) current.functions.hit = Number(value);
        break;
      case 'BRDA': {
        const [ln, block, branch, taken] = value.split(',').map(Number);
        const hit = taken === -1 ? 0 : taken; // -1 means parsed but not taken? or block? LCOV spec says -1 is unused
        current.branches?.details.push({ line: ln, block, branch, taken: hit });
        break;
      }
      case 'BRF':
        if (current.branches) current.branches.found = Number(value);
        break;
      case 'BRH':
        if (current.branches) current.branches.hit = Number(value);
        break;
    }
  }

  return records;
}

function initializeEntry(): Partial<LcovEntry> {
  return {
    lines: { found: 0, hit: 0, details: [] },
    functions: { found: 0, hit: 0, details: [] },
    branches: { found: 0, hit: 0, details: [] },
  };
}


/**
 * Converts parsed LCOV entries into Cocov's TotalCoverage summaries.
 */
export function convertLcovToTotal(entries: LcovEntry[]): TotalCoverage {
  let totalLinesFound = 0;
  let totalLinesHit = 0;
  let totalFnFound = 0;
  let totalFnHit = 0;
  let totalBrFound = 0;
  let totalBrHit = 0;

  const fileSummaries: Record<string, CoverageSummary> = {};

  for (const entry of entries) {
    totalLinesFound += entry.lines.found;
    totalLinesHit += entry.lines.hit;
    totalFnFound += entry.functions.found;
    totalFnHit += entry.functions.hit;
    totalBrFound += entry.branches.found;
    totalBrHit += entry.branches.hit;

    fileSummaries[entry.file] = {
      lines: calcMetric(entry.lines.found, entry.lines.hit),
      statements: calcMetric(entry.lines.found, entry.lines.hit), // Approximate statements as lines
      functions: calcMetric(entry.functions.found, entry.functions.hit),
      branches: calcMetric(entry.branches.found, entry.branches.hit),
    };
  }

  return {
    total: {
      lines: calcMetric(totalLinesFound, totalLinesHit),
      statements: calcMetric(totalLinesFound, totalLinesHit),
      functions: calcMetric(totalFnFound, totalFnHit),
      branches: calcMetric(totalBrFound, totalBrHit),
    },
    ...fileSummaries,
  };
}

function calcMetric(found: number, hit: number): CoverageMetric {
  return {
    total: found,
    covered: hit,
    skipped: found - hit,
    pct: found === 0 ? 100 : Math.round((hit / found) * 10000) / 100,
  };
}

/**
 * Converts parsed LCOV entries into Cocov's DetailedCoverage (Istanbul format).
 * Synthesizes statement maps from line data.
 */
export function convertLcovToDetailed(entries: LcovEntry[]): Record<string, DetailedCoverage> {
  const result: Record<string, DetailedCoverage> = {};

  for (const entry of entries) {
    const s: Record<string, number> = {};
    const statementMap: Record<string, any> = {};

    entry.lines.details.forEach((line, index) => {
      s[index] = line.hit;
      statementMap[index] = {
        start: { line: line.line, column: 0 },
        end: { line: line.line, column: 100 },
      };
    });

    // We skip branches/functions map fidelity for now as strict diff check relies mostly on statementMap
    // But we can populate basic counts if needed.

    result[entry.file] = {
      path: entry.file,
      statementMap,
      fnMap: {}, // Todo: Synthesize if crucial for DiffChecker (DiffChecker checks statements mainly)
      branchMap: {},
      s,
      f: {},
      b: {},
    };
  }

  return result;
}
