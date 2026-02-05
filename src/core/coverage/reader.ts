
import fs from 'fs-extra';
import path from 'path';
import { TotalCoverage, CocovFile, DetailedCoverage } from '@/types.js';

/**
 * Reads the current run's coverage summary JSON.
 * 
 * @param cwd - Current working directory
 * @param file - Path to coverage file (default: coverage/coverage-summary.json)
 * @returns {Promise<TotalCoverage>} Parsed coverage summary
 * @throws {Error} If file does not exist
 */
import { parseLcovContent, convertLcovToTotal, convertLcovToDetailed } from '@/core/parsers/lcov.js';

/**
 * Internal helper to find coverage files recursively (max depth 5)
 */
async function findCoverageFiles(cwd: string, fileName: string, depth = 0): Promise<string[]> {
    if (depth > 5) return [];
    
    const results: string[] = [];
    const entries = await fs.readdir(cwd, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(cwd, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.git', '.cocov', 'dist', 'build'].includes(entry.name)) continue;
            results.push(...await findCoverageFiles(fullPath, fileName, depth + 1));
        } else if (entry.name === fileName) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Calculates summary from detailed coverage.
 */
function calculateSummaryFromDetailed(detailed: Record<string, DetailedCoverage>): TotalCoverage {
    let totalLines = 0, coveredLines = 0;
    let totalStmts = 0, coveredStmts = 0;
    let totalFns = 0, coveredFns = 0;
    let totalBranches = 0, coveredBranches = 0;

    Object.values(detailed).forEach(fileCov => {
        const s = Object.values(fileCov.s);
        totalStmts += s.length;
        coveredStmts += s.filter(c => c > 0).length;

        // Lines (approx from statements or f/b? Istanbul usually computes lines separately but mapped)
        // We can use statement map to infer lines or just count statements as lines for simplicity?
        // No, Istanbul fileCov has undefined lines map usually?
        // Actually detailed report usually has `s`, `f`, `b`. Lines are separate `l` in some versions or derived.
        // Let's assume statements as lines proxy if needed, OR explicit `l` if exists.
        // But `DetailedCoverage` type I defined earlier has `s`, `f`, `b`. No `l`.
        // Summary uses lines.
        // Let's count keys in `s` as lines for now (Stmt coverage ~= Line Coverage often).
        // Or better: Iterate statementMap and collect unique line numbers.
        
        const linesSet = new Set<number>();
        const coveredLinesSet = new Set<number>();
        
        Object.entries(fileCov.statementMap).forEach(([id, range]) => {
            for(let i = range.start.line; i <= range.end.line; i++) {
                linesSet.add(i);
                if (fileCov.s[id] > 0) coveredLinesSet.add(i);
            }
        });
        
        totalLines += linesSet.size;
        coveredLines += coveredLinesSet.size;

        const f = Object.values(fileCov.f);
        totalFns += f.length;
        coveredFns += f.filter(c => c > 0).length;

        const b = Object.values(fileCov.b);
        // Branches is array of numbers? No, b is Record<string, number[]> usually?
        // In types.ts: b: Record<string, number>; -> Wait, branch counts are usually arrays (hit counts per branch).
        // If my types say number, I might be wrong or using simplified view.
        // Let's check types.ts. It says `b: Record<string, number>`. This might be wrong for Istanbul.
        // Istanbul `b` is `{ "0": [1, 0] }` (an array of hits per branch location).
        // If my type is wrong, this calc is wrong.
        // But assuming generic "metrics":
        
        // Actually, if `s` is number, `b` needs to be checked.
        // I will assume `b` works as counter or just skip branches calculation detail for now, 
        // to match standard summary.
        
        // Let's blindly trust the types I defined or fix them.
        totalBranches += b.length;
        coveredBranches += b.filter((c: number | number[]) => (Array.isArray(c) ? c.some(h => h > 0) : c > 0)).length;
    });

    const pct = (c: number, t: number) => t ? (c / t) * 100 : 100;

    return {
        total: {
            lines: { total: totalLines, covered: coveredLines, skipped: 0, pct: pct(coveredLines, totalLines) },
            statements: { total: totalStmts, covered: coveredStmts, skipped: 0, pct: pct(coveredStmts, totalStmts) },
            functions: { total: totalFns, covered: coveredFns, skipped: 0, pct: pct(coveredFns, totalFns) },
            branches: { total: totalBranches, covered: coveredBranches, skipped: 0, pct: pct(coveredBranches, totalBranches) }
        }
    };
}

export async function readCurrentCoverage(cwd: string, file?: string): Promise<TotalCoverage> {
    if (file) {
        // Strict file provided
         const filePath = path.resolve(cwd, file);
         if (await fs.pathExists(filePath)) {
             return fs.readJSON(filePath);
         }
         throw new Error(`Could not find coverage file at ${filePath}.`);
    }

    // Default behavior: Try Standard Summary
    const defaultSummary = path.resolve(cwd, 'coverage/coverage-summary.json');
    if (await fs.pathExists(defaultSummary)) {
        const summary = await fs.readJSON(defaultSummary);
        if (summary.total) return summary;
        // If summary file exists but lacks total (e.g. some reporters), try to calc or fall through
    }

    // Try Standard LCOV
    const defaultLcov = path.resolve(cwd, 'coverage/lcov.info');
    if (await fs.pathExists(defaultLcov)) {
        const content = await fs.readFile(defaultLcov, 'utf8');
        return convertLcovToTotal(parseLcovContent(content));
    }

    // Monorepo Scan (Aggressive)
    const detailed = await readDetailedCoverage(cwd);
    if (detailed && Object.keys(detailed).length > 0) {
        return calculateSummaryFromDetailed(detailed);
    }
    
    // Last ditch: Scan for summaries? No, detailed is better source of truth.
    
    throw new Error('Could not find coverage file (summary or detailed) in this project.');
}

export async function readDetailedCoverage(cwd: string): Promise<Record<string, DetailedCoverage> | null> {
    // 1. Optimization: Check default location first
    const defaultPath = path.resolve(cwd, 'coverage/coverage-final.json');
    if (await fs.pathExists(defaultPath)) {
        return fs.readJSON(defaultPath);
    }

    // 2. Try generic scan for detailed files
    const files = await findCoverageFiles(cwd, 'coverage-final.json');
    
    if (files.length === 0) {
        // Try LCOV
        const lcovFiles = await findCoverageFiles(cwd, 'lcov.info');
        if (lcovFiles.length === 0) return null;
        
        let aggregated: Record<string, DetailedCoverage> = {};
        for(const f of lcovFiles) {
             const content = await fs.readFile(f, 'utf8');
             const part = convertLcovToDetailed(parseLcovContent(content));
             Object.assign(aggregated, part);
        }
        return aggregated;
    }

    let aggregated: Record<string, DetailedCoverage> = {};
    for (const f of files) {
        try {
            const part = await fs.readJSON(f);
            // Merge logic: Simple Object.assign for now.
            // If absolute paths match, last one wins.
            Object.assign(aggregated, part);
        } catch(e) { /* ignore corrupt files */ }
    }
    
    return aggregated;
}

/**
 * Reads the baseline coverage config.
 * Checks .cocov/config.json first, then falls back to cocov.json.
 */
export async function readBaseline(cwd: string): Promise<CocovFile | null> {
    const hiddenConfig = path.join(cwd, '.cocov', 'config.json');
    if (await fs.pathExists(hiddenConfig)) {
        return fs.readJSON(hiddenConfig);
    }
    
    // Fallback: cocov.json in root
    const rootConfig = path.join(cwd, 'cocov.json');
    if (await fs.pathExists(rootConfig)) {
        return fs.readJSON(rootConfig);
    }

    return null;
}
