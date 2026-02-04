
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';

/**
 * Prunes the history file to keep only the last N entries.
 * Uses streaming to avoid loading the entire file into memory.
 */
export async function pruneAction(cmd: any, options: { keep?: string }): Promise<void> {
  const keep = parseInt(options.keep || '100', 10);
  const cwd = process.cwd();
  const historyPath = path.join(cwd, '.cocov', 'history.jsonl');

  if (isNaN(keep) || keep < 1) {
    console.error(chalk.red('❌ Invalid "--keep" argument. Must be a positive integer.'));
    process.exit(1);
  }

  if (!(await fs.pathExists(historyPath))) {
    console.warn(chalk.yellow('⚠ No history file found to prune.'));
    return;
  }

  console.log(chalk.blue(`🧹 Pruning history to keep last ${keep} entries...`));

  // 1. Count total lines (pass 1)
  let totalLines = 0;
  const countStream = fs.createReadStream(historyPath);
  const countRl = readline.createInterface({ input: countStream, crlfDelay: Infinity });
  for await (const _ of countRl) {
    totalLines++;
  }

  if (totalLines <= keep) {
    console.log(chalk.green('✔ History is already within limits. No action taken.'));
    return;
  }

  const linesToSkip = totalLines - keep;
  console.log(chalk.dim(`  Found ${totalLines} entries. Removing old ${linesToSkip} entries...`));

  // 2. Stream to temp file (pass 2)
  const tempPath = historyPath + '.tmp';
  const readStream = fs.createReadStream(historyPath);
  const writeStream = fs.createWriteStream(tempPath);
  const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

  let currentLine = 0;
  for await (const line of rl) {
    currentLine++;
    if (currentLine > linesToSkip) {
      if (!writeStream.write(line + '\n')) {
        // Handle backpressure
        await new Promise<void>(resolve => writeStream.once('drain', () => resolve()));
      }
    }
  }

  writeStream.end();
  await new Promise<void>(resolve => writeStream.once('finish', () => resolve()));

  // 3. Swap files
  await fs.move(tempPath, historyPath, { overwrite: true });
  console.log(chalk.green('✔ History pruned successfully!'));
}
