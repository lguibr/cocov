import { execa } from 'execa';

export async function getCurrentCommit(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

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
 */
export async function getChangedLines(cwd: string): Promise<Record<string, number[]>> {
  try {
    const { stdout } = await execa('git', ['diff', '-U0', 'HEAD', '--relative'], { cwd });
    return parseDiffOutput(stdout);
  } catch {
    return {};
  }
}

/**
 * Parses git diff output to extract changed line numbers.
 * @param diff Raw git diff output
 */
export function parseDiffOutput(diff: string): Record<string, number[]> {
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
