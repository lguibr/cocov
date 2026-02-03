import chalk from 'chalk';
import fs from 'fs-extra';
import { readCurrentCoverage, readBaseline } from '../core/coverage/reader.js';
import { generateBadgeSvg, generateDiffBadge, BadgeType } from '../core/badges/generator.js';
import { CoverageSummary } from '../types.js';

interface BadgeCommandOptions {
  output?: string;
  type?: string; 
}

export async function badgeAction(options: BadgeCommandOptions): Promise<void> {
  try {
    const current = await readCurrentCoverage(process.cwd());
    const type = (options.type || 'lines') as BadgeType | 'all' | 'unified' | 'diff-lines' | 'diff-branches' | 'diff-functions' | 'diff-statements';
    

    if (type === 'unified') {
      const svg = generateBadgeSvg(current.total, 'unified');
      const outputPath = options.output || 'cocov-badge-unified.svg';
      await fs.outputFile(outputPath, svg);
      console.log(chalk.green(`✔ Unified Badge generated: ${outputPath}`));
      return;
    }
    

    if (type.startsWith('diff-')) {
       // We need baseline
       const baseline = await readBaseline(process.cwd());
       const metric = type.replace('diff-', '') as keyof CoverageSummary;
       
       if (!baseline || !baseline.total || !baseline.total[metric]) {
          console.warn(chalk.yellow(`No baseline found for ${metric}, assuming 0 diff.`));
       }
       
       const currentPct = current.total[metric].pct;
       // Safety: baseline might be missing fields, use 0 default or current if missing to show 0 diff
       const baselinePct = baseline?.total?.[metric]?.pct ?? currentPct;
       const diff = currentPct - baselinePct;
       
       const svg = generateDiffBadge(diff, metric, { label: `Δ ${metric}` });
       const outputPath = options.output || `cocov-badge-diff-${metric}.svg`;
       await fs.outputFile(outputPath, svg);
       console.log(chalk.green(`✔ Diff Badge generated: ${outputPath}`));
       return;
    }


    const validMetrics = ['lines', 'functions', 'branches', 'statements'];

    // If 'all' is specified, we generate all metrics
    if (type === 'all') {
      const types: Exclude<BadgeType, 'logo' | 'unified'>[] = ['lines', 'statements', 'functions', 'branches'];
      
      for (const t of types) {
        const pct = current.total[t].pct;
        const svg = generateBadgeSvg(pct, t);
        const fileName = options.output ? options.output.replace('.svg', `-${t}.svg`) : `cocov-badge-${t}.svg`;
        await fs.outputFile(fileName, svg);
        console.log(chalk.green(`✔ Badge generated: ${fileName}`));
      }
      return;
    }

    let pct = 0;
    if (type === 'logo') {
      pct = 0; // Irrelevant for logo
    } else if (validMetrics.includes(type)) {
       pct = current.total[type as keyof CoverageSummary].pct; 
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
