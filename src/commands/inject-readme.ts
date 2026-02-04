import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { readCurrentCoverage, readBaseline } from '@/core/coverage/reader.js';
import { loadCocovConfig } from '@/config-loader.js';

function getColor(pct: number, high = 90, medium = 80): string {
  if (pct >= high) return 'success'; // green-ish in shields.io usually 'success' or 'brightgreen'
  // Shields.io standard colors: brightgreen, green, yellowgreen, yellow, orange, red
  if (pct >= high) return 'brightgreen';
  if (pct >= medium) return 'yellow';
  return 'red';
}

export async function injectReadmeAction(): Promise<void> {
  const targetFile = 'README.md';
  const filePath = path.resolve(process.cwd(), targetFile);

  if (!(await fs.pathExists(filePath))) {
    console.error(chalk.red(`❌ Could not find ${targetFile} in the current directory.`));
    return;
  }

  // 1. Read Coverage Data
  console.log(chalk.blue('ℹ Reading coverage data...'));
  const current = await readCurrentCoverage(process.cwd());
  const config = await loadCocovConfig(process.cwd());
  const thresholds = config.thresholds || {};
  
  // Defaults
  const lineThresh = thresholds.lines || 80;
  
  // 2. Prepare Injection Payload
  const repoBaseUrl = 'https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges';
  const repoUrl = 'https://github.com/lguibr/cocov';

  const mkBadge = (metric: string, pct: number) => {
      // Clamp to 0-100
      const val = Math.max(0, Math.min(100, Math.round(pct)));
      // e.g. lines-85.svg, branches-50.svg
      return `${repoBaseUrl}/${metric}-${val}.svg`;
  };

  const mkDiffBadge = (metric: string, val: number) => {
      // Clamp to -100 to +100
      const clamped = Math.max(-100, Math.min(100, Math.round(val)));
      return `${repoBaseUrl}/${metric}-diff-${clamped}.svg`;
  };

  // Metrics
  const l = current.total.lines.pct;
  const s = current.total.statements.pct;
  const f = current.total.functions.pct;
  const b = current.total.branches.pct;
  
  // Diff Logic
  const baseline = await readBaseline(process.cwd());
  let diffPayload = '';
  
  if (baseline && baseline.total) {
      const getDiff = (m: keyof typeof current.total) => {
           const curr = current.total[m].pct;
           const base = baseline.total[m]?.pct ?? curr;
           return curr - base;
      };

      const dl = getDiff('lines');
      const ds = getDiff('statements');
      const df = getDiff('functions');
      const db = getDiff('branches');

      diffPayload = `
<br>
[![Diff Lines](${mkDiffBadge('lines', dl)})](${repoUrl}) [![Diff Statements](${mkDiffBadge('statements', ds)})](${repoUrl}) [![Diff Functions](${mkDiffBadge('functions', df)})](${repoUrl}) [![Diff Branches](${mkDiffBadge('branches', db)})](${repoUrl})
`.trim();
  }

  // Final Payload with Granularity
  const payload = `
<!-- COCOV_BADGES_START -->
[![Lines](${mkBadge('lines', l)})](${repoUrl}) [![Statements](${mkBadge('statements', s)})](${repoUrl}) [![Functions](${mkBadge('functions', f)})](${repoUrl}) [![Branches](${mkBadge('branches', b)})](${repoUrl}) ${diffPayload}
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

