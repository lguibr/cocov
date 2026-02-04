import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { generateBadgeSvg, generateDiffBadge } from '../core/badges/generator.js';

async function seed() {
    const outDir = path.resolve(process.cwd(), 'assets/badges');
    await fs.ensureDir(outDir);
    console.log(chalk.blue(`🌱 Seeding badges to ${outDir}...`));

    const metrics = ['lines', 'branches', 'functions', 'statements'];

    // 1. Coverage Badges (0-100)
    console.log(chalk.gray('Generating coverage badges 0-100 for all metrics...'));
    for (const metric of metrics) {
        for (let i = 0; i <= 100; i++) {
            // Label matches the metric name (capitalized by default in generator or we pass it)
            // generator uses type as label default.
            const svg = generateBadgeSvg(i, metric as any); 
            await fs.writeFile(path.join(outDir, `${metric}-${i}.svg`), svg);
        }
    }
    
    // Generic 'cocov' label for the main unified/summary badge
    for (let i = 0; i <= 100; i++) {
        const svg = generateBadgeSvg(i, 'lines', { label: 'cocov' });
        await fs.writeFile(path.join(outDir, `cocov-${i}.svg`), svg);
    }

    // 2. Diff Badges (-100 to +100)
    console.log(chalk.gray('Generating diff badges -100 to +100...'));
    for (const metric of metrics) {
        for (let i = -100; i <= 100; i++) {
            const svg = generateDiffBadge(i, metric as any);
            await fs.writeFile(path.join(outDir, `${metric}-diff-${i}.svg`), svg);
        }
    }

    console.log(chalk.green(`✔ Generated badges for all metrics.`));
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
