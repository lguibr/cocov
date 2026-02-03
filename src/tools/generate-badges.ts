import fs from 'fs-extra';
import path from 'path';
import { generateBadgeSvg, generateDiffBadge, BadgeType } from '../core/badges/generator.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory: assets/badges relative to project root
// Assuming this script is run via `npx tsx src/tools/generate-badges.ts` from root, or similar.
// If in src/tools, project root is ../../
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'assets/badges');

async function main() {
  console.log(chalk.blue(`Generating static badges in ${OUTPUT_DIR}...`));
  await fs.ensureDir(OUTPUT_DIR);

  const metrics: BadgeType[] = ['lines', 'statements', 'functions', 'branches'];

  // 1. Generate Standard Coverage Badges (0-100)
  for (const metric of metrics) {
    for (let i = 0; i <= 100; i++) {
      const svg = generateBadgeSvg(i, metric);
      const filename = `coverage-${metric}-${i}.svg`;
      await fs.writeFile(path.join(OUTPUT_DIR, filename), svg);
    }
  }

  // 2. Generate Generic "Coverage" badges (using 'lines' logic but labelled 'coverage')
  for (let i = 0; i <= 100; i++) {
     const svg = generateBadgeSvg(i, 'lines', { label: 'coverage' });
     const filename = `coverage-${i}.svg`;
     await fs.writeFile(path.join(OUTPUT_DIR, filename), svg);
  }

  // 3. Generate Diff Badges (-100 to +100)
  // For diffs, we typically care about integer changes for static assets.
  for (let i = -100; i <= 100; i++) {
    // We treat 'lines' as the default metric for these generic diff badges
    const svg = generateDiffBadge(i, 'lines', { label: 'change' }); 
    // Naming convention: diff-{value}.svg. Handle negatives.
    const filename = `diff-${i}.svg`;
    await fs.writeFile(path.join(OUTPUT_DIR, filename), svg);
  }

  console.log(chalk.green('✔ Generated badge library.'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
