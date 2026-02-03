
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { readCurrentCoverage } from '../core/coverage/reader.js';
import { generateBadgeSvg } from '../core/badges/generator.js';

export async function badgeAction(options: { output?: string }) {
    try {
        const current = await readCurrentCoverage(process.cwd());
        const pct = current.total.lines.pct;
        
        const svg = generateBadgeSvg(pct);
        const outputPath = options.output || 'cocov-badge.svg';
        
        await fs.outputFile(outputPath, svg);
        console.log(chalk.green(`✔ Badge generated: ${outputPath}`));
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(chalk.red(`Failed to generate badge: ${e.message}`));
        }
        process.exit(1);
    }
}
