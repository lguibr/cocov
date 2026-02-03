import chalk from 'chalk';
import fs from 'fs-extra';

import { readCurrentCoverage } from '../core/coverage/reader.js';
import { generateBadgeSvg, BadgeType } from '../core/badges/generator.js';

interface BadgeCommandOptions {
  output?: string;
  type?: string; // lines, branches, functions, statements, logo, all
}

export async function badgeAction(options: BadgeCommandOptions): Promise<void> {
  try {
    const current = await readCurrentCoverage(process.cwd());
    const type = (options.type || 'lines') as BadgeType | 'all';
    
    // If 'all' is specified, we generate all metrics
    if (type === 'all') {
      const types: Exclude<BadgeType, 'logo'>[] = ['lines', 'statements', 'functions', 'branches'];
      
      for (const t of types) {
        // @ts-ignore
        const pct = current.total[t].pct;
        const svg = generateBadgeSvg(pct, t);
        const fileName = options.output ? options.output.replace('.svg', `-${t}.svg`) : `cocov-badge-${t}.svg`;
        await fs.outputFile(fileName, svg);
        console.log(chalk.green(`✔ Badge generated: ${fileName}`));
      }
      return;
    }

    // Single badge generation
    let pct = 0;
    if (type === 'logo') {
      pct = 0; // Irrelevant for logo
    } else if (['lines', 'functions', 'branches', 'statements'].includes(type)) {
       // @ts-ignore - Dynamic access safe here due to check above
       pct = current.total[type].pct; 
    } else {
       console.warn(chalk.yellow(`Unknown badge type '${type}', defaulting to lines`));
       pct = current.total.lines.pct;
    }

    const svg = generateBadgeSvg(pct, type as BadgeType);
    const outputPath = options.output || `cocov-badge-${type}.svg`;

    await fs.outputFile(outputPath, svg);
    console.log(chalk.green(`✔ Badge generated: ${outputPath}`));
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(chalk.red(`Failed to generate badge: ${e.message}`));
    }
    process.exit(1);
  }
}
