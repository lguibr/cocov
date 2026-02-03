
import { readBaseline, readCurrentCoverage, readDetailedCoverage } from '../core/coverage/reader.js';
import { writeBaseline } from '../core/coverage/writer.js';
import { HistoryManager } from '../history.js';
import { StackGuard } from '../stack-guard.js';
import { Reporter } from '../reporter.js';
import { Comparator } from '../comparator.js';
import { DiffChecker } from '../diff-checker.js';
import { runTestCommand } from '../executor.js';
import { getCurrentCommit, getCurrentBranch } from '../git-utils.js';

export async function runAction(testCommand: string, options: any) {
    console.log(chalk.blue(`Running test command: ${testCommand}...`));

    if (options.dryRun) {
        console.log(chalk.yellow('🚧 DRY RUN MODE: No baseline updates.'));
    }

    try {
        const historyManager = new HistoryManager(process.cwd());
        const cwd = process.cwd();

        const baseline = await readBaseline(cwd);

        if (options.enforceStack && baseline?.stack) {
            const guard = new StackGuard(cwd);
            await guard.check(baseline.stack);
        }

        await runTestCommand(testCommand);

        const current = await readCurrentCoverage(cwd, options.file);
        const reporter = new Reporter();
        const comparator = new Comparator();

        if (options.diff) {
            console.log(chalk.blue('\n🔍 Running Diff-Aware Strict Mode...'));
            const diffChecker = new DiffChecker(cwd);
            const detailed = await readDetailedCoverage(cwd);

            if (!detailed) {
                console.warn(chalk.yellow('⚠ Could not find detailed coverage (coverage-final.json). Skipping diff check.'));
            } else {
                const diffResults = await diffChecker.checkDiffCoverage(detailed);
                if (diffResults.length > 0) {
                    console.error(chalk.red('\n🛑 Strict Mode Failed: Uncovered changes detected!'));
                    diffResults.forEach(r => {
                        console.error(chalk.red(`  ${r.file}: Lines [${r.uncoveredLines.join(', ')}] are not covered.`));
                    });
                    process.exit(1);
                } else {
                    console.log(chalk.green('✔ Diff Strict Mode Passed: All changes covered.'));
                }
            }
        }

        if (!options.dryRun) {
            const context = {
                cwd: process.cwd(),
                timestamp: new Date(),
                commitHash: await getCurrentCommit(),
                branch: await getCurrentBranch()
            };
            await historyManager.append(current.total, context);
        }

        if (!baseline) {
            if (options.dryRun) {
                console.log(chalk.yellow('No baseline found. (Dry Run: Not saving).'));
                process.exit(0);
            }
            console.log(chalk.yellow('No baseline found. Saving current coverage as baseline.'));
            await manager.writeBaseline(current);
            reporter.printTotal(current.total);
            process.exit(0);
        }

        const result = comparator.compare(current.total, baseline.total);
        reporter.printSummary(result);

        if (result.isRegression) {
            console.error(chalk.red('\n✖ Coverage regression detected!'));
            process.exit(1);
        }

        if (result.improved) {
            if (options.dryRun) {
                console.log(chalk.green('\n✔ Coverage improved! (Dry Run: Baseline NOT updated).'));
            } else {
                console.log(chalk.green('\n✔ Coverage improved! Updating baseline.'));
                await manager.writeBaseline(current);
            }
        } else {
            console.log(chalk.gray('\nCoverage unchanged.'));
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(chalk.red(`Error: ${error.message}`));
        } else {
            console.error(chalk.red(`Error: Unknown error`));
        }
        process.exit(1);
    }
}
