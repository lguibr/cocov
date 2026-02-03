import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { badgeAction } from './badge.js';

export async function injectReadmeAction(): Promise<void> {
  const targetFile = 'README.md';
  const filePath = path.resolve(process.cwd(), targetFile);

  if (!(await fs.pathExists(filePath))) {
    console.error(chalk.red(`❌ Could not find ${targetFile} in the current directory.`));
    return;
  }

  // 1. Ensure badges exist (generate 'all')
  console.log(chalk.blue('ℹ Generating badges...'));
  await badgeAction({ type: 'all' });

  // 2. Prepare Injection Payload
  // We use the unified badge by default as it's the most information dense
  // We can also add lines/diffs if requested, but 'unified' is the cleanest default.
  // The user manually added a logo and specific badges.
  // Let's stick to a standard block that looks good.

  const badgePath = './cocov-badge-unified.svg';
  const reportPath = './coverage/index.html'; // Default location

  const payload = `
<!-- COCOV_BADGES_START -->
[![Cocov Coverage](${badgePath})](${reportPath})
<!-- COCOV_BADGES_END -->
`.trim();

  let content = await fs.readFile(filePath, 'utf-8');
  const startMarker = '<!-- COCOV_BADGES_START -->';
  const endMarker = '<!-- COCOV_BADGES_END -->';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    // Update existing
    console.log(chalk.blue('ℹ Updating existing Cocov badges in README.md...'));
    content =
      content.substring(0, startIndex) +
      payload +
      content.substring(endIndex + endMarker.length);
  } else {
    // Insert new
    // Where? Usually top or after title.
    // Simple heuristic: after the first header? OR just ask.
    // For "just use and do", automating "after first header" is a good default.
    
    console.log(chalk.blue('ℹ No existing Cocov badges found.'));
    const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Inject Cocov badges into README.md?',
        initial: true
    });

    if (!response.confirm) {
        console.log(chalk.yellow('Skipped.'));
        return;
    }

    // Try to find first H1
    const h1Match = content.match(/^#\s+.+$/m);
    
    // Heuristic 2: Look for existing badge cluster (images in first 10-20 lines)
    // Regex matches typical badge patterns: shields.io, npm, workflows, etc.
    const badgeClusterRegex = /(!\[.*?\]\(.*?(shields\.io|npm|workflows|badge).*?\)|<img.*?src=".*?(shields\.io|npm|workflows|badge)".*?>)/g;
    
    let lastBadgeIndex = -1;
    let match;
    
    // We only care about the first cluster, usually near the top
    while ((match = badgeClusterRegex.exec(content)) !== null) {
        // If the match is too far down (e.g. > 500 chars from H1 or start), ignore it to avoid false positives in body
        // But for simplicity, let's just find the last badge-like element in the first 1kb of text
        if (match.index > 2000) break;
        lastBadgeIndex = match.index + match[0].length;
    }

    if (lastBadgeIndex !== -1) {
       console.log(chalk.blue('ℹ Detected existing badges. Injecting after them.'));
       content = content.slice(0, lastBadgeIndex) + '\n' + payload + content.slice(lastBadgeIndex);
    } else if (h1Match) {
       console.log(chalk.blue('ℹ No badges found. Injecting after title.'));
       const insertIdx = h1Match.index! + h1Match[0].length;
       content = content.slice(0, insertIdx) + '\n\n' + payload + content.slice(insertIdx);
    } else {
       // Prepend
       console.log(chalk.blue('ℹ No structure found. Prepending.'));
       content = payload + '\n\n' + content;
    }
  }

  await fs.writeFile(filePath, content, 'utf-8');
  console.log(chalk.green('✔ README.md updated with Cocov badges!'));
}
