import { execa } from 'execa';

/**
 * Executes a test command in a child process, inheriting stdio.
 * This ensures test output is visible to the user.
 * 
 * @param command - The full shell command to run (e.g., "npm test")
 */
export async function runTestCommand(command: string): Promise<void> {
  const [cmd, ...args] = command.split(' ');
  await execa(cmd, args, { stdio: 'inherit' });
}
