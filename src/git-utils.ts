import { execa } from 'execa';
import parseDiff from 'parse-diff';

/**
 * Retrieves the current git commit hash (HEAD).
 * @returns {Promise<string>} Full SHA-1 commit hash or 'unknown'
 */
export async function getCurrentCommit(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Retrieves the current active git branch name.
 * @returns {Promise<string>} Branch name or 'unknown'
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Gets a list of files changed between HEAD and the working directory.
 * @returns {Promise<string[]>} Array of changed file paths
 */
export async function getChangedFiles(): Promise<string[]> {
  try {
    // Diff against HEAD
    const { stdout } = await execa('git', ['diff', '--name-only', 'HEAD']);
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Gets a map of changed files and their changed line numbers relative to HEAD.
 * Uses parse-diff for robust parsing of the git output.
 * @returns {Promise<Record<string, number[]>>} Map of filename -> changed line numbers
 */
export async function getChangedLines(cwd: string): Promise<Record<string, number[]>> {
  try {
    // We use -U0 to minimize context, but parse-diff handles context fine.
    // parse-diff expects standard git diff output.
    const { stdout } = await execa('git', ['diff', '-U0', 'HEAD', '--relative'], { cwd });
    return extractChangedLines(stdout);
  } catch {
    return {};
  }
}

/**
 * Parses git diff output using parse-diff to extract added/modified line numbers.
 * @param diff Raw git diff output
 * @returns {Record<string, number[]>} Map of filename -> changed line numbers
 */
export function extractChangedLines(diff: string): Record<string, number[]> {
  const files = parseDiff(diff);
  const changes: Record<string, number[]> = {};

  for (const file of files) {
    // Skip deleted files or invalid entries
    if (!file.to || file.to === '/dev/null') continue;

    // parse-diff usually strips a/ and b/ prefixes if standard git diff format.
    const fileName = file.to;
    const lines: number[] = [];
    
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === 'add') {
          lines.push(change.ln);
        }
      }
    }
    
    if (lines.length > 0) {
      changes[fileName] = lines;
    }
  }

  return changes;
}
