import { execa } from 'execa';

export async function runTestCommand(command: string): Promise<void> {
  const [cmd, ...args] = command.split(' ');
  await execa(cmd, args, { stdio: 'inherit' });
}
