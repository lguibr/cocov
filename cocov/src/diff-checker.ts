
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export interface DiffResult {
    file: string;
    changedLines: number[];
    uncoveredLines: number[];
}

export class DiffChecker {
    private cwd: string;

    constructor(cwd: string) {
        this.cwd = cwd;
    }

    async getChangedLines(): Promise<Record<string, number[]>> {
        try {
            console.log('DiffChecker CWD:', this.cwd);
            const { stdout } = await execa('git', ['diff', '-U0', 'HEAD'], { cwd: this.cwd });
            // console.log('Raw Diff Output:', stdout); // Commented out to reduce noise, enable if needed
            return this.parseDiffOutput(stdout);
        } catch (e) {
            console.error('DiffChecker failed to run git diff:', e);
            return {};
        }
    }

    private parseDiffOutput(diff: string): Record<string, number[]> {
        const changes: Record<string, number[]> = {};
        let currentFile: string | null = null;

        const lines = diff.split('\n');
        for (const line of lines) {
            if (line.startsWith('diff --git')) {
                const parts = line.split(' ');
                const bPart = parts[parts.length - 1];
                if (bPart.startsWith('b/')) {
                    currentFile = bPart.substring(2);
                } else {
                    currentFile = bPart;
                }
                changes[currentFile] = [];
            } else if (line.startsWith('@@') && currentFile) {
                const match = line.match(/\+(\d+)(?:,(\d+))?/);
                if (match) {
                    const start = parseInt(match[1], 10);
                    const count = match[2] ? parseInt(match[2], 10) : 1;
                    
                    if (!changes[currentFile]) changes[currentFile] = [];
                    for (let i = 0; i < count; i++) {
                        changes[currentFile].push(start + i);
                    }
                }
            }
        }
        return changes;
    }

    async checkDiffCoverage(detailedCoverage: Record<string, any>): Promise<DiffResult[]> {
        const changedFiles = await this.getChangedLines();
        const results: DiffResult[] = [];

        for (const [relativePath, lines] of Object.entries(changedFiles)) {
             const absPath = path.resolve(this.cwd, relativePath);
             console.log(`Checking ${absPath} lines: ${lines}`);
             const fileCov = detailedCoverage[absPath];
             
             if (!fileCov) {
                 console.log(`No coverage found for ${absPath}`);
                 continue; 
             }

             const uncovered: number[] = [];
             
             for (const line of lines) {
                 let covered = false;
                 let statementFound = false;

                 for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) {
                     if (line >= range.start.line && line <= range.end.line) {
                         statementFound = true;
                         if (fileCov.s[id] > 0) {
                             covered = true;
                             break;
                         }
                     }
                 }
                 
                 if (statementFound && !covered) {
                     uncovered.push(line);
                 }
             }

             if (uncovered.length > 0) {
                 results.push({
                     file: relativePath,
                     changedLines: lines,
                     uncoveredLines: uncovered
                 });
             }
        }

        return results;
    }
}
