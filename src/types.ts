export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageSummary {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
}

export interface TotalCoverage {
  total: CoverageSummary;
  [key: string]: CoverageSummary; // Allow file-specific keys if we expand later, but 'total' is what we care about primarily
}

export interface StackConfig {
  required?: string[];
  forbidden?: string[];
}

export interface CocovFile {
  stack?: StackConfig;
  total: CoverageSummary;
  threshold?: number;
  [key: string]: unknown;
}

export interface CocovConfig {
  thresholds?: {
    lines?: number;
    statements?: number;
    functions?: number;
    branches?: number;
  };
  threshold?: number; // Legacy or alternative
  stack?: string[];
  html?: {
    enabled?: boolean;
    output?: string;
  };
  [key: string]: any;
}

export interface CoverageLocation {
  line: number;
  column: number;
}

export interface CoverageRange {
  start: CoverageLocation;
  end: CoverageLocation;
}

export interface DetailedCoverage {
  path: string;
  statementMap: Record<string, CoverageRange>;
  fnMap: Record<string, { name: string; decl: CoverageRange; loc: CoverageRange; line: number }>;
  branchMap: Record<string, { loc: CoverageRange; type: string; locations: CoverageRange[]; line: number }>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number>;
  _coverageSchema?: string;
  hash?: string;
}

export interface HistoryEntry {
  timestamp: string;
  commitHash?: string;
  branch?: string;
  metrics: CoverageSummary;
}

export interface RunContext {
  cwd: string;
  timestamp: Date;
  commitHash?: string;
  branch?: string;
}
