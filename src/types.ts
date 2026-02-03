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
  [key: string]: unknown;
}

export interface CocovConfig {
  thresholds?: {
    lines?: number;
    statements?: number;
    functions?: number;
    branches?: number;
  };
}

export interface DetailedCoverage {
  path: string;
  statementMap: Record<string, any>;
  fnMap: Record<string, any>;
  branchMap: Record<string, any>;
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
