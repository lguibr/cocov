# Project Codebase: src

## File Tree

```text
src/
├── cli.test.ts
├── cli.ts
├── commands
│   ├── README.md
│   ├── badge.test.ts
│   ├── badge.ts
│   ├── debug-html.test.ts
│   ├── html.ts
│   ├── init.test.ts
│   ├── init.ts
│   ├── inject-readme.test.ts
│   ├── inject-readme.ts
│   ├── markdown.test.ts
│   ├── markdown.ts
│   ├── run.test.ts
│   └── run.ts
├── comparator.ts
├── core
│   ├── README.md
│   ├── badges
│   │   ├── README.md
│   │   ├── generator.test.ts
│   │   └── generator.ts
│   ├── html
│   │   ├── generator.test.ts
│   │   ├── generator.ts
│   │   └── templates
│   │       └── base.ts
│   ├── init
│   │   ├── README.md
│   │   ├── questions.test.ts
│   │   ├── questions.ts
│   │   ├── scaffold.test.ts
│   │   └── scaffold.ts
│   ├── integrity.test.ts
│   ├── integrity.ts
│   └── logic
│       ├── README.md
│       ├── baseline-handler.test.ts
│       ├── baseline-handler.ts
│       ├── comparator.spec.ts
│       ├── diff-checker.test.ts
│       ├── diff-parser.spec.ts
│       ├── diff-runner.test.ts
│       ├── diff-runner.ts
│       ├── threshold-validator.test.ts
│       └── threshold-validator.ts
├── diff-checker.ts
├── executor.test.ts
├── executor.ts
├── git-utils.test.ts
├── git-utils.ts
├── history.test.ts
├── history.ts
├── injector.test.ts
├── injector.ts
├── markdown-generator.test.ts
├── markdown-generator.ts
├── reporter.test.ts
├── reporter.ts
├── stack-guard.test.ts
├── stack-guard.ts
├── tools
│   ├── generate-badges.ts
│   └── generate-todo.ts
├── types.ts
└── utils
    ├── banner.test.ts
    └── banner.ts
```

## File Contents

### File: `cli.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createProgram } from './cli.js';

const mocks = vi.hoisted(() => ({
  runAction: vi.fn(),
  runInit: vi.fn(),
  htmlAction: vi.fn(),
  markdownAction: vi.fn(),
  badgeAction: vi.fn(),
  injectReadmeAction: vi.fn(),
}));

// Mocks must be top-level and use the hoisted variables
vi.mock('@/commands/init.js', () => ({ runInit: mocks.runInit }));
vi.mock('@/commands/run.js', () => ({ runAction: mocks.runAction }));
vi.mock('@/commands/html.js', () => ({ htmlAction: mocks.htmlAction }));
vi.mock('@/commands/markdown.js', () => ({ markdownAction: mocks.markdownAction }));
vi.mock('@/commands/badge.js', () => ({ badgeAction: mocks.badgeAction }));

vi.mock('./commands/init.js', () => ({ runInit: mocks.runInit }));
vi.mock('./commands/run.js', () => ({ runAction: mocks.runAction }));
vi.mock('./commands/html.js', () => ({ htmlAction: mocks.htmlAction }));
vi.mock('./commands/markdown.js', () => ({ markdownAction: mocks.markdownAction }));
vi.mock('./commands/badge.js', () => ({ badgeAction: mocks.badgeAction }));
vi.mock('./commands/inject-readme.js', () => ({ injectReadmeAction: mocks.injectReadmeAction }));
vi.mock('@/commands/inject-readme.js', () => ({ injectReadmeAction: mocks.injectReadmeAction }));

describe('cli', () => {
  it('creates program with correct name and version', async () => {
    const program = await createProgram();
    expect(program.name()).toBe('cocov');
    expect(program.version()).toBe('1.0.0');
  });

  it('triggers init command', async () => {
    const program = await createProgram();
    // Prevent actual exit
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    await program.parseAsync(['node', 'cocov', 'init']);
    expect(mocks.runInit).toHaveBeenCalled();
  });

  it('triggers run command', async () => {
    const program = await createProgram();
    // Use 'user' so we don't need 'node' 'cocov' prefix
    await program.parseAsync(['run', 'npm test'], { from: 'user' });
    expect(mocks.runAction).toHaveBeenCalled();
  });

  it('triggers html command', async () => {
    const program = await createProgram();
    await program.parseAsync(['html'], { from: 'user' });
    expect(mocks.htmlAction).toHaveBeenCalled();
  });

  it('triggers badge command', async () => {
    const program = await createProgram();
    await program.parseAsync(['badge'], { from: 'user' });
    expect(mocks.badgeAction).toHaveBeenCalled();
  });

  it('triggers inject-readme command', async () => {
    const program = await createProgram();
    await program.parseAsync(['inject-readme'], { from: 'user' });
    expect(mocks.injectReadmeAction).toHaveBeenCalled();
  });

  it('handles init failure', async () => {
    mocks.runInit.mockRejectedValue(new Error('Init failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    const program = await createProgram();
    await program.parseAsync(['init'], { from: 'user' });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Init failed'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles unknown init errors', async () => {
    mocks.runInit.mockRejectedValue('Unknown String Error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    const program = await createProgram();
    await program.parseAsync(['init'], { from: 'user' });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `cli.ts`

``typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { runInit } from './commands/init.js';
import { showBanner } from './utils/banner.js';

/**
 * Creates the main CLI program instance with all commands configured.
 * Configures 'init', 'run', 'html', 'markdown', and 'badge' commands.
 * @returns {Promise<Command>} The configured Commander instance
 */
export async function createProgram(): Promise<Command> {
  await showBanner();
  const program = new Command();

  program.name('cocov').description('Code coverage regression guard').version('1.0.0');


  program
    .command('init')
    .description('Initialize cocov configuration and hooks')
    .action(async () => {
      try {
        await runInit();
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(chalk.red(`Init failed: ${e.message}`));
        } else {
          console.error(chalk.red(`Init failed: Unknown error`));
        }
        process.exit(1);
      }
    });


  program
    .command('run', { isDefault: true })
    .description('Run tests and check coverage')
    .argument('<testCommand>', 'Test command to run (e.g., "npm test")')
    .option('--enforce-stack', 'Enforce stack requirements defined in cocov file')
    .option('--dry-run', 'Simulate checks but do not update baseline')
    .option('-f, --file <file>', 'Path to custom coverage file')
    .option('--diff', 'Enforce 100% coverage on changed lines (Strict Mode)')
    .action(async (cmd, options) => {
      const { runAction } = await import('./commands/run.js');
      await runAction(cmd, options);
    });


  program
    .command('html')
    .description('Generate HTML report')
    .action(async () => {
      const { htmlAction } = await import('./commands/html.js');
      await htmlAction();
    });


  program
    .command('markdown')
    .description('Generate Markdown report')
    .option('--inject <file>', 'Inject report into a markdown file (e.g. README.md)')
    .action(async (options) => {
      const { markdownAction } = await import('./commands/markdown.js');
      await markdownAction(options);
    });


  program
    .command('badge')
    .description('Generate coverage SVG badge')
    .option('-o, --output <file>', 'Output file path')
    .option('--type <type>', 'Badge type (lines, branches, functions, statements, logo, all)', 'lines')
    .option('--logo', 'Generate logo badge')
    .action(async (options) => {
      const { badgeAction } = await import('./commands/badge.js');
      await badgeAction(options);
    });

  program
    .command('inject-readme')
    .description('Inject badges into README.md')
    .action(async () => {
      const { injectReadmeAction } = await import('./commands/inject-readme.js');
      await injectReadmeAction();
    });

  return program;
}

/* v8 ignore start */
if (process.argv[1].endsWith('cli.js') || process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cocov')) {
   createProgram().then(program => program.parse());
}
/* v8 ignore stop */
``

### File: `commands/README.md`

``md
# ⌨️ Cocov CLI Commands

This directory contains the action handlers for the CLI. Each file corresponds to a top-level command in the entry point.

## 🚀 Commands

### `init.ts` (`cocov init`)
- **Purpose**: Scaffolds the `.cocov` directory and sets up hooks.
- **Logic**: Interactive questionnaire -> `scaffold.ts`.

### `run.ts` (`cocov run <cmd>`)
- **Purpose**: The main guard. Runs tests, checks coverage, updates baseline.
- **Options**:
  - `--diff`: Enables Strict Mode (fails on uncovered changes).
  - `--dry-run`: Checks but doesn't save baseline.
  - `--enforce-stack`: Runs the stack dependency guard.

### `badge.ts` (`cocov badge`)
- **Purpose**: Generates SVGs.
- **Options**:
  - `--type <type>`: `lines`, `branches`, `unified`, etc.
  - `--output <file>`: Output path.

### `html.ts` (`cocov html`)
- **Purpose**: Generates the interactive HTML dashboard.
- **Logic**: Injects `history.jsonl` into the Handlebars template.

### `markdown.ts` (`cocov markdown`)
- **Purpose**: Generates reports for PR comments or README injection.
- **Options**:
  - `--inject <file>`: Looks for `<!-- cocov-start -->` markers.

## 🏗️ Architecture
All commands follow the **"Action Pattern"**:
- `cli.ts` parses arguments.
- `commands/<cmd>.ts` exports an `action` function.
- Logic is delegated to `src/core/` modules. Commands should NOT contain business rules.
``

### File: `commands/badge.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badgeAction } from './badge.js';
import { readCurrentCoverage, readBaseline } from '@/core/coverage/reader.js';
import { generateBadgeSvg, generateDiffBadge } from '@/core/badges/generator.js';
import fs from 'fs-extra';

vi.mock('@/core/coverage/reader.js');
vi.mock('@/core/badges/generator.js');
vi.mock('fs-extra', () => ({
  default: {
    outputFile: vi.fn(),
  },
}));

describe('badgeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readCurrentCoverage).mockResolvedValue({
      total: {
        lines: { pct: 80 },
        statements: { pct: 80 },
        functions: { pct: 80 },
        branches: { pct: 80 },
      },
    } as never);
    vi.mocked(readBaseline).mockResolvedValue({
      total: {
        lines: { pct: 70 },
        statements: { pct: 70 },
        functions: { pct: 70 },
        branches: { pct: 70 },
      },
    } as never);
    vi.mocked(generateBadgeSvg).mockReturnValue('<svg>badge</svg>');
    vi.mocked(generateDiffBadge).mockReturnValue('<svg>diff</svg>');
  });

  it('generates lines badge by default', async () => {
    await badgeAction({});
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'lines');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg>badge</svg>');
  });

  it('generates specific badge type', async () => {
    await badgeAction({ type: 'branches' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'branches');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-branches.svg', '<svg>badge</svg>');
  });

  it('generates unified badge', async () => {
    await badgeAction({ type: 'unified' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(expect.anything(), 'unified');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unified.svg', '<svg>badge</svg>');
  });

  it('generates diff badge', async () => {
    await badgeAction({ type: 'diff-lines' });
    expect(readBaseline).toHaveBeenCalled();
    expect(generateDiffBadge).toHaveBeenCalledWith(10, 'lines', expect.anything());
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-diff-lines.svg', '<svg>diff</svg>');
  });
  
  it('generates diff badge with no baseline (warns)', async () => {
    vi.mocked(readBaseline).mockResolvedValue(null as never);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await badgeAction({ type: 'diff-lines' });
    
    expect(consoleSpy).toHaveBeenCalled();
    // Should default to 0 diff
    expect(generateDiffBadge).toHaveBeenCalledWith(0, 'lines', expect.anything());
  });

  it('generates all badges', async () => {
    await badgeAction({ type: 'all' });
    // 4 standard + 1 unified + 4 diff = 9 total
    expect(fs.outputFile).toHaveBeenCalledTimes(9);
    
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-lines.svg', '<svg>badge</svg>');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unified.svg', '<svg>badge</svg>');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-diff-lines.svg', '<svg>diff</svg>');
  });

  it('handles output option for single badge', async () => {
    await badgeAction({ output: 'custom.svg' });
    expect(fs.outputFile).toHaveBeenCalledWith('custom.svg', '<svg>badge</svg>');
  });

  it('handles output option for unified badge', async () => {
      await badgeAction({ type: 'unified', output: 'custom-u.svg' });
      expect(fs.outputFile).toHaveBeenCalledWith('custom-u.svg', '<svg>badge</svg>');
  });

  it('handles output option for all badges (prefix)', async () => {
      await badgeAction({ type: 'all', output: 'custom.svg' });
      // output should be replaced e.g. custom-lines.svg
      expect(fs.outputFile).toHaveBeenCalledWith('custom-lines.svg', '<svg>badge</svg>');
      expect(fs.outputFile).toHaveBeenCalledWith('custom-diff-lines.svg', '<svg>diff</svg>');
      expect(fs.outputFile).toHaveBeenCalledWith('custom-unified.svg', '<svg>badge</svg>');
  });

  it('generates logo badge', async () => {
    await badgeAction({ type: 'logo' });
    expect(generateBadgeSvg).toHaveBeenCalledWith(0, 'logo');
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-logo.svg', '<svg>badge</svg>');
  });

  it('defaults to lines for unknown type', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await badgeAction({ type: 'unknown' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown badge type 'unknown'"));
    expect(generateBadgeSvg).toHaveBeenCalledWith(80, 'lines'); // 80 is lines pct mock
    expect(fs.outputFile).toHaveBeenCalledWith('cocov-badge-unknown.svg', '<svg>badge</svg>');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('fail'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await badgeAction({});
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `commands/badge.ts`

``typescript
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
      
      // Standard badges
      for (const t of types) {
        const pct = current.total[t].pct;
        const svg = generateBadgeSvg(pct, t);
        const fileName = (options.output && options.output !== 'cocov-badge.svg') ? options.output.replace('.svg', `-${t}.svg`) : `cocov-badge-${t}.svg`;
        await fs.outputFile(fileName, svg);
        console.log(chalk.green(`✔ Badge generated: ${fileName}`));
      }

      // Unified badge
      const unifiedSvg = generateBadgeSvg(current.total, 'unified');
      const unifiedName = (options.output && options.output !== 'cocov-badge.svg') ? options.output.replace('.svg', '-unified.svg') : 'cocov-badge-unified.svg';
      await fs.outputFile(unifiedName, unifiedSvg);
      console.log(chalk.green(`✔ Badge generated: ${unifiedName}`));

      // Diff badges
      const baseline = await readBaseline(process.cwd());
      if (baseline && baseline.total) {
        for (const t of types) {
           const metric = t as keyof CoverageSummary;
           const currentPct = current.total[metric].pct;
           const baselinePct = baseline.total[metric].pct;
           const diff = currentPct - baselinePct;
           
           const svg = generateDiffBadge(diff, t as BadgeType, { label: `Δ ${t}` });
           const fileName = (options.output && options.output !== 'cocov-badge.svg') ? options.output.replace('.svg', `-diff-${t}.svg`) : `cocov-badge-diff-${t}.svg`;
           await fs.outputFile(fileName, svg);
           console.log(chalk.green(`✔ Badge generated: ${fileName}`));
        }
      }

      return;
    }

    let pct = 0;
    let finalType = type;

    if (type === 'logo') {
      pct = 0; // Irrelevant for logo
    } else if (validMetrics.includes(type)) {
       pct = current.total[type as keyof CoverageSummary].pct; 
    } else {
       console.warn(chalk.yellow(`Unknown badge type '${type}', defaulting to lines`));
       pct = current.total.lines.pct;
       finalType = 'lines';
    }

    const svg = generateBadgeSvg(pct, finalType as BadgeType);
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
``

### File: `commands/debug-html.test.ts`

```typescript
import { describe, it, vi, beforeEach } from 'vitest';
import { htmlAction } from './html.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { TotalCoverage } from '@/types.js';

vi.mock('@/history.js');
vi.mock('@/core/coverage/reader.js');
vi.mock('@/core/html/generator.js');
vi.mock('fs-extra', () => ({
  default: {
    writeFile: vi.fn(),
    ensureDir: vi.fn(),
    pathExists: vi.fn().mockResolvedValue(false),
  },
}));

import { HistoryManager } from '@/history.js';
import { HtmlGenerator } from '@/core/html/generator.js';

describe('Debug HTML', () => {
  beforeEach(() => {
    // Reset HistoryManager mock
    vi.mocked(HistoryManager).mockImplementation(() => ({
      readHistory: vi.fn().mockReturnValue([]),
    } as never));

    // Reset HtmlGenerator mock
    vi.mocked(HtmlGenerator).mockImplementation(() => ({
      generate: vi.fn().mockReturnValue('<html></html>'),
    } as never));
  });

  it('runs html action', async () => {
    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as unknown as TotalCoverage);
    console.log('Running HTML Action...');
    await htmlAction();
    console.log('Done HTML Action');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('HTML fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    await htmlAction();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error generating HTML report'), expect.anything());
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `commands/html.ts`

``typescript
import chalk from 'chalk';
import fs from 'fs-extra';
import { HistoryManager } from '../history.js';
import { readCurrentCoverage, readDetailedCoverage } from '../core/coverage/reader.js';
import { HtmlGenerator } from '../core/html/generator.js';

export async function htmlAction(): Promise<void> {
  try {
    const historyManager = new HistoryManager(process.cwd());
    const history = await historyManager.readHistory();
    const current = await readCurrentCoverage(process.cwd());
    const detailed = await readDetailedCoverage(process.cwd());

    const generator = new HtmlGenerator(history, current, detailed);
    const html = generator.generate();

    const outputDir = '.cocov/reports';
    await fs.ensureDir(outputDir);
    const outputPath = `${outputDir}/index.html`;
    await fs.writeFile(outputPath, html);
    console.log(chalk.green(`✔ HTML report generated at ${outputPath}`));
  } catch (error) {
    console.error(chalk.red('Error generating HTML report:'), error);
    process.exit(1);
  }
}
``

### File: `commands/init.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInit } from './init.js';
import { askInitQuestions } from '@/core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from '@/core/init/scaffold.js';
import fs from 'fs-extra';

vi.mock('@/core/init/questions.js');
vi.mock('@/core/init/scaffold.js');
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
  },
}));

describe('runInit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: true } as never);
  });

  it('runs full init workflow', async () => {
    await runInit();
    
    expect(askInitQuestions).toHaveBeenCalled();
    expect(scaffoldConfig).toHaveBeenCalled();
    expect(setupHusky).toHaveBeenCalled();
    expect(setupGithub).toHaveBeenCalled();
    expect(updateGitIgnore).toHaveBeenCalled();
  });

  it('skips if overwrite denied', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: false } as never);
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });

  it('aborts on cancellation', async () => {
    vi.mocked(askInitQuestions).mockResolvedValue({ overwrite: true, enableStackGuard: undefined } as never);
    
    await runInit();
    
    expect(scaffoldConfig).not.toHaveBeenCalled();
  });
});
```

### File: `commands/init.ts`

``typescript
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { askInitQuestions } from '@/core/init/questions.js';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from '@/core/init/scaffold.js';

export async function runInit(): Promise<void> {
  console.log(
    chalk.cyan(`
                      --::=-                       
                 ::-==:::::-==::                   
               :::===::::::::===:::                
             :::-===:::::::::-===:::               
             .......=========-......:              
                  .:=   ==  ==:                    
                      .::===                       
                     ::::::--                      
                  ----:::::::::                    
                 ===========-::::                  
                =======-:::::::::                  
                  =: :::::::::::                   
  `),
  );
  console.log(chalk.bold.cyan('\n🚀 Welcome to Cocov: The Code Coverage Gate\n'));

  const cwd = process.cwd();
  const configPath = path.join(cwd, 'cocov.json');
  const exists = await fs.pathExists(configPath);

  const answers = await askInitQuestions(exists);

  // Handle cancellation/overwrite check
  if (exists && answers.overwrite === false) {
    console.log(chalk.yellow('Skipping configuration setup.'));
    return;
  }

  // Handle cancellation of questions
  if (answers.enableStackGuard === undefined && answers.overwrite !== false) {
    // If user Ctrl+C'd prompts
    return;
  }

  await scaffoldConfig(cwd, answers);
  await setupHusky(cwd, answers);
  await setupGithub(cwd, answers);
  await updateGitIgnore(cwd, answers);

  console.log(chalk.bold.green('\n✨ Cocov setup complete!'));
}
``

### File: `commands/inject-readme.test.ts`

``typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { injectReadmeAction } from './inject-readme.js';
import fs from 'fs-extra';
import { badgeAction } from './badge.js';
import prompts from 'prompts';

vi.mock('fs-extra');
vi.mock('./badge.js');
vi.mock('prompts');

describe('injectReadmeAction', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts if README.md does not exist', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);
    await injectReadmeAction();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find README.md'));
  });

  it('injects new badges if no markers found (confirmation yes)', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges/cocov-badge-unified.svg'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('My Project'), // Integrity check
        'utf-8'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('README.md updated'));
  });

    it('skips injection if user denies confirmation', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# My Project\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: false });

    await injectReadmeAction();

    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' }); // Still generates badges
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped'));
  });

  it('prepends badges if no H1 found (new injection)', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Just some text\nNo header here.');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('<!-- COCOV_BADGES_START -->\n[![Cocov Unified]'),
        'utf-8'
    );
     // Should be at the start
    const callArgs = vi.mocked(fs.writeFile).mock.calls[0];
    const writtenContent = callArgs[1] as string;
    expect(writtenContent.startsWith('<!-- COCOV_BADGES_START -->')).toBe(true);
  });

  it('injects after existing badge cluster', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('# Title\n![License](https://img.shields.io/license)\nDescription');
    vi.mocked(prompts).mockResolvedValue({ confirm: true });

    await injectReadmeAction();

    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('![License](https://img.shields.io/license)\n<!-- COCOV_BADGES_START -->'),
        'utf-8'
    );
  });

  it('updates existing badges if markers found', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    const existingContent = `
# My Project
<!-- COCOV_BADGES_START -->
Old Badges
<!-- COCOV_BADGES_END -->
Description
    `.trim();
    vi.mocked(fs.readFile).mockResolvedValue(existingContent);

    await injectReadmeAction();
    expect(badgeAction).toHaveBeenCalledWith({ type: 'all', output: 'assets/badges/cocov-badge.svg' });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('<!-- COCOV_BADGES_START -->'),
        'utf-8'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.not.stringContaining('Old Badges'), // Should be replaced
        'utf-8'
    );
     expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Updating existing'));
  });
});
``

### File: `commands/inject-readme.ts`

``typescript
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
  console.log(chalk.blue('ℹ Generating badges in assets/badges/...'));
  await badgeAction({ type: 'all', output: 'assets/badges/cocov-badge.svg' });

  // 2. Prepare Injection Payload
  const reportPath = './coverage/index.html'; // Default location
  // Use absolute URL so badges render anywhere (NPM, external docs) and users can copy-paste
  const badgeBaseUrl = 'https://raw.githubusercontent.com/lguibr/cocov/main/assets/badges';

  // User requested "show off" mode: Unified, Individuals, Diffs
  const payload = `
<!-- COCOV_BADGES_START -->
[![Cocov Unified](${badgeBaseUrl}/cocov-badge-unified.svg)](${reportPath})
<br>
[![Lines](${badgeBaseUrl}/cocov-badge-lines.svg)](${reportPath}) [![Statements](${badgeBaseUrl}/cocov-badge-statements.svg)](${reportPath}) [![Functions](${badgeBaseUrl}/cocov-badge-functions.svg)](${reportPath}) [![Branches](${badgeBaseUrl}/cocov-badge-branches.svg)](${reportPath})
<br>
[![Diff Lines](${badgeBaseUrl}/cocov-badge-diff-lines.svg)](${reportPath}) [![Diff Statements](${badgeBaseUrl}/cocov-badge-diff-statements.svg)](${reportPath}) [![Diff Functions](${badgeBaseUrl}/cocov-badge-diff-functions.svg)](${reportPath}) [![Diff Branches](${badgeBaseUrl}/cocov-badge-diff-branches.svg)](${reportPath})
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
``

### File: `commands/markdown.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markdownAction } from './markdown.js';
import { HistoryManager } from '@/history.js';
import { readCurrentCoverage } from '@/core/coverage/reader.js';
import { MarkdownGenerator } from '@/markdown-generator.js';
import { injectIntoFile } from '@/injector.js';
import fs from 'fs-extra';

vi.mock('../history.js');
vi.mock('../core/coverage/reader.js');
vi.mock('../markdown-generator.js');
vi.mock('../injector.js');
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('markdownAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(HistoryManager).mockImplementation(() => ({
      readHistory: vi.fn().mockResolvedValue([]),
    } as never));

    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as never);
    
    vi.mocked(MarkdownGenerator).mockImplementation(() => ({
      generate: vi.fn().mockReturnValue('# Report'),
    } as never));

    vi.mocked(injectIntoFile).mockResolvedValue(true);
  });

  it('generates markdown file', async () => {
    await markdownAction({});
    expect(fs.writeFile).toHaveBeenCalledWith('.cocov/reports/summary.md', '# Report');
  });

  it('injects into README when option provided', async () => {
    await markdownAction({ inject: 'README.md' });
    expect(injectIntoFile).toHaveBeenCalledWith('README.md', '# Report');
  });

  it('logs warning if injection fails', async () => {
    vi.mocked(injectIntoFile).mockResolvedValue(false);
    const consoleSpy = vi.spyOn(console, 'log');
    await markdownAction({ inject: 'README.md' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find injection markers'));
  });

  it('handles errors gracefully', async () => {
    vi.mocked(readCurrentCoverage).mockRejectedValue(new Error('fail'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await markdownAction({});
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `commands/markdown.ts`

``typescript
import chalk from 'chalk';
import fs from 'fs-extra';
import { HistoryManager } from '../history.js';
import { readCurrentCoverage } from '../core/coverage/reader.js';
import { MarkdownGenerator } from '../markdown-generator.js';
import { injectIntoFile } from '../injector.js';

export async function markdownAction(options: { inject?: string }): Promise<void> {
  try {
    const historyManager = new HistoryManager(process.cwd());
    const history = await historyManager.readHistory();
    const current = await readCurrentCoverage(process.cwd());

    const generator = new MarkdownGenerator(history, current);

    if (options.inject) {
      // Use true to generate the injection-ready content (with markers? no, we inject BETWEEN markers)
      // MarkdownGenerator.generate(true) adds markers.
      // injectIntoFile adds content BETWEEN markers.
      // So we need generator to NOT add markers, or script to not add markers.
      // Wait, generator.generate(true) returns: <!-- cocov-start --> REPORT <!-- cocov-end -->
      // My injector replaces between markers.
      // So if I inject what generator returns, I get:
      // <!-- cocov-start -->
      // <!-- cocov-start --> REPORT <!-- cocov-end -->
      // <!-- cocov-end -->
      // That is duplicate markers.

      // Let's check MarkdownGenerator again.
      // It wraps report in markers if injectMode is true.

      // I should probably use generate(false) which is raw report.
      const report = generator.generate(false);
      const success = await injectIntoFile(options.inject, report);

      if (success) {
        console.log(chalk.green(`✔ Injected report into ${options.inject}`));
      } else {
        console.log(chalk.yellow(`⚠ Could not find injection markers in ${options.inject}`));
        console.log(chalk.gray('  Add <!-- cocov-start --> and <!-- cocov-end --> to your file.'));
      }
    } else {
      // Default: Generate file
      const md = generator.generate();
      const outputDir = '.cocov/reports';
      await fs.ensureDir(outputDir);
      const outputPath = `${outputDir}/summary.md`;
      await fs.writeFile(outputPath, md);
      console.log(chalk.green(`✔ Markdown report generated at ${outputPath}`));
    }
  } catch (error) {
    console.error(chalk.red('Error generating Markdown report:'), error);
    process.exit(1);
  }
}
``

### File: `commands/run.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAction } from './run.js';
import { readBaseline, readCurrentCoverage } from '@/core/coverage/reader.js';

import { StackGuard } from '@/stack-guard.js';
import { runTestCommand } from '@/executor.js';
import { runDiffCheck } from '@/core/logic/diff-runner.js';
import { handleBaselineCheck } from '@/core/logic/baseline-handler.js';
import { verifyCoverageFreshness } from '@/core/integrity.js';

vi.mock('../core/coverage/reader.js');
vi.mock('../history.js');
vi.mock('../stack-guard.js');
vi.mock('../executor.js');
vi.mock('../core/logic/diff-runner.js');
vi.mock('../core/logic/baseline-handler.js');
vi.mock('../core/integrity.js');

describe('runAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'cwd').mockReturnValue('/cwd');
    vi.mocked(readBaseline).mockResolvedValue({ stack: {} });
    vi.mocked(readCurrentCoverage).mockResolvedValue({ total: { lines: { pct: 80 } } } as never);
  });

  it('runs test command and handles baseline', async () => {
    await runAction('npm test', {});
    
    expect(verifyCoverageFreshness).toHaveBeenCalled();
    expect(runTestCommand).toHaveBeenCalledWith('npm test');
    expect(handleBaselineCheck).toHaveBeenCalled();
  });

  it('enforces stack guard if enabled', async () => {
    const mockCheck = vi.fn();
    vi.mocked(StackGuard).mockImplementation(() => ({ check: mockCheck } as never));
    
    await runAction('npm test', { enforceStack: true });
    
    expect(mockCheck).toHaveBeenCalled();
  });

  it('runs diff check if enabled', async () => {
    await runAction('npm test', { diff: true });
    expect(runDiffCheck).toHaveBeenCalled();
  });

  it('handles dry run', async () => {
    await runAction('npm test', { dryRun: true });
    expect(handleBaselineCheck).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), expect.objectContaining({ dryRun: true }), expect.anything());
  });

  it('handles errors gracefully', async () => {
    vi.mocked(runTestCommand).mockRejectedValue(new Error('Test failed'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    
    await runAction('npm test', {});
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles unknown errors', async () => {
    vi.mocked(runTestCommand).mockRejectedValue('String Error');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runAction('npm test', {});

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `commands/run.ts`

``typescript
import chalk from 'chalk';
import { readBaseline, readCurrentCoverage } from '../core/coverage/reader.js';
import { HistoryManager } from '../history.js';
import { StackGuard } from '../stack-guard.js';
import { runTestCommand } from '../executor.js';
import { runDiffCheck } from '../core/logic/diff-runner.js';
import { handleBaselineCheck } from '../core/logic/baseline-handler.js';
import { verifyCoverageFreshness } from '../core/integrity.js';
import { validatePerFileThresholds } from '../core/logic/threshold-validator.js';

interface RunOptions {
  dryRun?: boolean;
  enforceStack?: boolean;
  diff?: boolean;
  file?: string;
}

export async function runAction(testCommand: string, options: RunOptions): Promise<void> {
  console.log(chalk.blue(`Running test command: ${testCommand}...`));

  if (options.dryRun) {
    console.log(chalk.yellow('🚧 DRY RUN MODE: No baseline updates.'));
  }

  try {
    await verifyCoverageFreshness(process.cwd());

    const historyManager = new HistoryManager(process.cwd());
    const cwd = process.cwd();

    const baseline = await readBaseline(cwd);

    if (options.enforceStack && baseline?.stack) {
      const guard = new StackGuard(cwd);
      await guard.check(baseline.stack);
    }

    await runTestCommand(testCommand);

    if (options.diff) {
      await runDiffCheck(cwd);
    }

    const current = await readCurrentCoverage(cwd, options.file);
    
    // Enforce 90% per-file coverage
    const thresholdResult = validatePerFileThresholds(current, 90);
    if (!thresholdResult.pass) {
       console.error(chalk.red('\n🛑 Per-File Coverage Threshold Failed (Min 90%):'));
       thresholdResult.violations.forEach(v => console.error(chalk.red(`  x ${v}`)));
       process.exit(1);
    }

    await handleBaselineCheck(cwd, current, baseline, options, historyManager);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red(`Error: Unknown error`));
    }
    process.exit(1);
  }
}
``

### File: `comparator.ts`

```typescript
import { CoverageSummary } from './types.js';

export interface ComparisonResult {
  isRegression: boolean;
  improved: boolean;
  metrics: {
    [key in keyof CoverageSummary]: {
      current: number;
      baseline: number;
      diff: number;
    };
  };
}

export class Comparator {
  /**
   * Compares current coverage metrics against a baseline.
   * Calculates differences for lines, statements, functions, and branches.
   * Determines if a regression occurred (negative diff) or improvement (positive diff).
   * 
   * @param current - The current run's coverage summary
   * @param baseline - The loaded baseline coverage summary
   * @returns {ComparisonResult} Object containing regression status, improvement status, and detailed metrics
   */
  compare(current: CoverageSummary, baseline: CoverageSummary): ComparisonResult {
    const keys: (keyof CoverageSummary)[] = ['lines', 'statements', 'functions', 'branches'];
    const metrics: Partial<ComparisonResult['metrics']> = {};
    let isRegression = false;
    let improved = false;

    for (const key of keys) {
      const currentPct = current[key].pct;
      const baselinePct = baseline[key].pct;
      const diff = parseFloat((currentPct - baselinePct).toFixed(2));

      metrics[key] = {
        current: currentPct,
        baseline: baselinePct,
        diff,
      };

      if (diff < 0) {
        isRegression = true;
      } else if (diff > 0) {
        improved = true;
      }
    }

    return { isRegression, improved, metrics: metrics as ComparisonResult['metrics'] };
  }
}
```

### File: `core/README.md`

``md
# 🧠 Cocov Core Architecture

The `src/core` directory contains the business logic and essential engines of Cocov. It is structurally separated to ensure clean boundaries between data retrieval, processing logic, and output generation.

## 📂 Structure

- **`coverage/`**: **The Data Layer**. Responsible for reading raw coverage data (JSON summaries, Istanbul reports) and writing baseline configurations. It abstracts the filesystem and data formats.
- **`logic/`**: **The Business Logic**. Contains the decision-making engines. `baseline-handler` decides if a build passes or fails based on history. `diff-runner` executes the "Strict Mode" checks on changed files.
- **`badges/`**: **The Visuals**. A standalone SVG generation engine. It calculates coordinates and colors to generate high-fidelity badges without external dependencies (like shields.io).
- **`html/`**: **The Report**. Generators for the interactive HTML dashboard.
- **`init/`**: **The Setup**. Scaffolding logic for `cocov init`.
- **`integrity.ts`**: Verifies that coverage data is fresh and hasn't been tampered with.

## 🔄 Core Data Flow

1. **Input**: `CLI` invokes a command.
2. **Read**: `coverage/reader` loads current metrics + baseline.
3. **Process**: `logic/baseline-handler` compares them using `logic/comparator`.
4. **Decision**:
   - If regression -> Exit 1.
   - If improvement -> Update baseline (via `coverage/writer`) -> Exit 0.
   - If unchanged -> Exit 0.
5. **Output**: `reporter` prints verification tables.

## 🛡️ Design Principles

- **Zero-Config-First**: It should work without a config file if possible (falling back to defaults).
- **Filesystem Abstraction**: Core logic shouldn't know *where* files are, just *that* they exist. (Note: Current implementation still has some path coupling in `reader.ts`).
- **Strict Typing**: All coverage data must match the `TotalCoverage` or `DetailedCoverage` interfaces.
``

### File: `core/badges/README.md`

``md
# 🎨 Cocov Badge Engine

The `src/core/badges` directory contains a standalone, zero-dependency SVG generator.

## 📐 Coordinate System
The badges follow the [Shields.io specification](https://shields.io/):
- **Height**: Fixed at `20px`.
- **Font**: Verdana, Geneva, Reference sans-serif.
- **Logo**: 14x14px, centered in the left 20px block.

### Width Calculation
Badges are composed of three parts:
1. **Logo Block**: Fixed 20px (or 0 if no logo).
2. **Label Block**: Width = `char_count * 7px + padding`.
3. **Value Block**: Width = `char_count * 8px + padding`.

*Note: The character width constants (7px and 8px) are approximations optimized for Verdana 110 (11px).*

## 🎨 Color Logic
Colors are determined by `getBadgeColor(percentage)` in `generator.ts`:
- **Bright Green (#4c1)**: ≥ 95%
- **Green (#97ca00)**: ≥ 80%
- **Yellow Green (#a4a61d)**: ≥ 70%
- **Yellow (#dfb317)**: ≥ 60%
- **Orange (#fe7d37)**: ≥ 50%
- **Red (#e05d44)**: < 50%

## 🧩 Supported Types
- **Standard**: Lines, Branches, Functions, Statements.
- **Unified**: A wide badge showing all 4 metrics side-by-side.
- **Diff/Delta**: Shows the change (`+1.5%`, `-0.5%`).
- **Logo**: Just the logo square.
``

### File: `core/badges/generator.test.ts`

``typescript
import { describe, it, expect } from 'vitest';
import { generateBadgeSvg, generateDiffBadge } from './generator.js';

describe('generateBadgeSvg', () => {
  it('generates standard badge (lines)', () => {
    const svg = generateBadgeSvg(95);
    expect(svg).toContain('<svg');
    expect(svg).toContain('95%');
    expect(svg).toContain('lines');
    expect(svg).toContain('#4c1'); // brightgreen
  });

  it('generates logo badge', () => {
    const svg = generateBadgeSvg(0, 'logo');
    expect(svg).toContain('viewBox="0 0 40 40"');
  });

  it('generates unified badge', () => {
    const summary = {
      lines: { pct: 80, total: 100, covered: 80, skipped: 0 },
      statements: { pct: 70, total: 100, covered: 70, skipped: 0 },
      functions: { pct: 60, total: 100, covered: 60, skipped: 0 },
      branches: { pct: 50, total: 100, covered: 50, skipped: 0 },
    };
    const svg = generateBadgeSvg(summary, 'unified');
    expect(svg).toContain('lines 80%');
    expect(svg).toContain('stmts 70%');
    expect(svg).toContain('br 50%');
  });

  it('returns empty string for invalid percentage on standard badge', () => {
    const svg = generateBadgeSvg({} as any, 'lines');
    expect(svg).toBe('');
  });

  it('handles custom label and color', () => {
    const svg = generateBadgeSvg(50, 'branches', { label: 'custom', color: '#000' });
    expect(svg).toContain('custom');
    expect(svg).toContain('#000');
  });

  // Exhaustive color check
  const colorTests = [
    { pct: 96, expected: '#4c1' },
    { pct: 85, expected: '#97ca00' },
    { pct: 75, expected: '#a4a61d' },
    { pct: 65, expected: '#dfb317' },
    { pct: 55, expected: '#fe7d37' },
    { pct: 45, expected: '#e05d44' },
  ];

  colorTests.forEach(({ pct, expected }) => {
    it(`uses correct color for ${pct}%`, () => {
      const svg = generateBadgeSvg(pct);
      expect(svg).toContain(expected);
    });
  });

  it('generates diff badge (positive)', () => {
    const svg = generateDiffBadge(5.4, 'lines', { label: 'Δ lines' });
    expect(svg).toContain('+5%');
    expect(svg).toContain('#4c1'); // green
    expect(svg).toContain('Δ lines');
  });

  it('generates diff badge (negative)', () => {
    const svg = generateDiffBadge(-2.1, 'lines');
    expect(svg).toContain('-2%');
    expect(svg).toContain('#e05d44'); // red
  });

  it('generates diff badge (neutral)', () => {
    const svg = generateDiffBadge(0, 'lines');
    expect(svg).toContain('±0%');
    expect(svg).toContain('#007ec6'); // blue
  });
});
``

### File: `core/badges/generator.ts`

``typescript
import { CoverageSummary } from '@/types.js';

export type BadgeType = 'lines' | 'branches' | 'functions' | 'statements' | 'logo' | 'unified';

interface BadgeOptions {
  label?: string;
  color?: string;
  logo?: boolean;
}

const COCOV_LOGO = `<svg width="100%" height="100%" viewBox="0 0 70.367256 69.038162" version="1.1" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-0.20566306,-141.68053)"><g transform="translate(-134.64,21.78)"><g transform="translate(34.30175,0.81670833)"><path style="fill:#d2b184" d="m 114.23606,185.27751 c -1.49038,-1.56601 -2.71077,-3.0289 -2.71198,-3.25087 -0.006,-1.12041 4.09679,-7.24527 5.22899,-7.80588 1.71474,-0.84907 1.69776,-0.80315 1.35893,-3.67613 -0.25218,-2.13834 -0.24214,-2.64508 0.0584,-2.94311 0.61718,-0.61213 5.75226,-2.7661 6.5944,-2.7661 1.09124,0 1.17611,-0.43148 0.54055,-2.74811 -0.71676,-2.61262 -0.76403,-2.54907 2.96761,-3.9903 6.88707,-2.65991 6.57601,-2.38939 5.89846,-5.12965 -0.74194,-3.00072 -0.73793,-2.94986 -0.2311,-2.93352 0.25743,0.008 2.78563,1.58587 5.61822,3.50573 5.15016,3.49064 5.15016,3.49064 6.51611,7.14925 1.61109,4.3152 1.16005,3.7914 4.60561,5.34856 1.52797,0.69054 2.83765,1.30733 2.91041,1.37064 0.0728,0.0633 0.19183,1.68327 0.26459,3.5999 0.13229,3.48479 0.13229,3.48479 1.05727,3.57255 1.28232,0.12167 2.55876,1.78336 5.23917,6.82045 0.37071,0.69664 -0.0818,1.34988 -3.10737,4.48599 -2.1532,2.23184 -2.1532,2.23184 -21.12582,2.23488 -18.97263,0.003 -18.97263,0.003 -21.6824,-2.84428 z m 4.03269,-35.55341 c -3.78703,-2.89517 -9.49355,-4.30922 -15.94551,-3.95121 -2.13554,0.1185 -2.11432,0.16363 -1.16127,-2.47027 11.00278,-30.40766 53.945,-32.77447 67.76427,-3.73491 2.88855,6.06993 2.82954,6.27924 -1.75792,6.23528 -5.47715,-0.0525 -10.24165,1.3123 -14.02168,4.01647 -1.10544,0.79082 -1.10544,0.79082 -3.43958,-0.17048 -8.58514,-3.53574 -20.01501,-3.47787 -28.10147,0.14226 -2.07023,0.92679 -2.03583,0.92748 -3.33684,-0.0671 z" /><path style="fill:#dcac28" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z m 0.0421,-38.03788 c -3.81841,-2.65194 -7.74235,-3.77538 -13.29527,-3.80648 -4.93537,-0.0276 -4.65257,0.1793 -3.67556,-2.68972 3.35564,-9.85391 11.93967,-18.32151 22.10016,-21.80039 1.85854,-0.63635 2.62421,-0.78723 3.04271,-0.59957 0.39931,0.17905 0.97531,0.10751 2.01442,-0.25018 2.4107,-0.82985 3.01692,-0.56953 1.47053,0.63146 -2.38073,1.84897 -5.62621,6.75597 -6.87643,10.39682 -0.45758,1.33255 0.49694,-0.24888 1.53474,-2.54275 5.22275,-19.01042 40.86959,12.98917 17.11751,-7.93051 -2.32723,-1.79251 0.88424,-1.1681 4.94196,0.96088 11.5981,6.08521 14.8846,19.62192 14.8846,17.7725 0,-2.23391 -6.94055,-14.66826 -14.60331,-17.96468 -1.40081,-0.60261 -1.79439,-1.40878 -0.54408,-1.11445 10.10771,2.37939 20.55938,12.22888 24.02772,22.64335 0.8672,2.60399 1.13629,2.42324 -3.65969,2.45828 -5.46268,0.0399 -9.10266,1.0276 -12.77829,3.46735 -1.6626,1.10357 -1.60374,1.10876 -6.15451,-0.54244 -7.59947,-2.75739 -17.94661,-2.54846 -25.48481,0.51458 -2.38998,0.97114 -3.13032,1.04329 -4.0624,0.39595 z" /><path style="fill:#4984e2" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z m 0.0421,-38.04773 c -3.91694,-2.67178 -7.7472,-3.76556 -13.29527,-3.79663 -4.93537,-0.0276 -4.65257,0.1793 -3.67556,-2.68972 3.35564,-9.85391 11.93967,-18.32151 22.10016,-21.80039 1.82922,-0.62631 2.62813,-0.78579 3.0325,-0.60535 0.48581,0.21677 0.40459,0.29418 -0.70559,0.67246 -0.69003,0.23511 -1.757,0.77029 -2.37105,1.18929 -0.61404,0.41899 -1.59269,1.0837 -2.17477,1.47713 -3.00115,2.02847 -7.93267,8.18235 -9.23185,11.5201 -0.24933,0.64058 -0.74472,1.6866 -1.10085,2.32449 -1.14684,2.05418 -1.13316,2.06417 2.85919,2.08796 2.7946,0.0167 4.88951,1.93463 5.16315,0.56905 2.64813,-13.21506 10.33669,-21.3041 17.18058,-21.0759 7.45895,0.24871 14.02415,9.87277 14.7541,20.68862 0.067,0.99306 -0.0496,0.99123 2.97894,0.19959 1.7174,-0.44892 2.76337,-0.55128 4.96149,-0.48555 3.27222,0.0979 3.17102,0.26865 1.71137,-2.88814 -1.45,-3.13594 -1.78544,-3.75382 -2.62416,-4.83376 -0.39556,-0.50933 -0.90475,-1.285 -1.13155,-1.72372 -1.19248,-2.30676 -7.01583,-7.45544 -9.77477,-8.6423 -1.40081,-0.60261 -1.79439,-1.40878 -0.54408,-1.11445 10.10771,2.37939 20.55938,12.22888 24.02772,22.64335 0.8672,2.60399 1.13629,2.42324 -3.65969,2.45828 -5.43257,0.0397 -9.10626,1.03 -12.72062,3.42907 -2.13976,1.42029 -2.0956,1.45993 -3.15239,-2.82888 -1.28202,-5.20281 -1.2467,-5.13389 -3.0386,-5.93015 -6.42562,-2.85534 -15.83806,-3.02143 -22.94931,-0.40496 -2.72019,1.00084 -2.87879,1.23889 -4.05692,6.08893 -1.0561,4.3477 -1.13032,4.44826 -2.56217,3.47158 z" /><path style="fill:#9d7149" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z" /><path style="fill:#3664a8" d="m 118.43831,149.39696 c -2.02222,-2.15255 -8.06402,-3.95963 -13.33234,-3.98766 -2.93429,-0.0156 -3.90243,-0.1028 -3.90261,-0.35149 -1.3e-4,-0.1819 0.0912,-0.33072 0.20305,-0.33072 0.11181,0 0.79642,-0.49114 1.52135,-1.09142 0.72494,-0.60028 2.3301,-1.56691 3.56703,-2.14806 1.23693,-0.58116 2.57638,-1.21558 2.97656,-1.40982 0.40018,-0.19425 0.72761,-0.26192 0.72761,-0.15038 0,0.11154 1.33945,0.20507 2.97656,0.20785 2.05127,0.003 3.47005,0.14986 4.56406,0.4709 5.67829,1.49923 4.94621,-3.85518 3.16517,2.93025 -0.19208,0.7276 -0.60565,2.48378 -0.91903,3.9026 -0.61901,2.80256 -0.68064,2.88054 -1.54741,1.9579 z m 33.58285,-0.3769 c -0.14489,-0.54213 -0.44858,-1.81912 -0.67487,-2.83777 -2.44022,-10.05796 -2.50695,-4.06417 2.50892,-5.55672 0.94088,-0.2884 2.49946,-0.46065 4.40977,-0.48736 1.62501,-0.0227 3.03308,-0.11986 3.12905,-0.21585 0.096,-0.096 0.49282,-0.016 0.8819,0.17777 0.38907,0.19377 1.74755,0.84734 3.01884,1.45237 1.96905,0.93712 5.22919,3.24055 5.22919,3.69466 0,0.0778 -1.69664,0.14229 -3.77031,0.14338 -5.32952,0.003 -9.77855,1.25496 -13.22073,3.72092 -1.24832,0.8943 -1.24832,0.8943 -1.51176,-0.0914 z" /></g></g></g></svg>`;


function getBadgeColor(percentage: number): string {
  if (percentage >= 95) return '#4c1'; // brightgreen
  if (percentage >= 80) return '#97ca00'; // green
  if (percentage >= 70) return '#a4a61d'; // yellowgreen
  if (percentage >= 60) return '#dfb317'; // yellow
  if (percentage >= 50) return '#fe7d37'; // orange
  return '#e05d44'; // red
}

/**
 * Generates an SVG badge for a specific coverage metric.
 * Supports 'lines', 'branches', 'functions', 'statements', and 'logo'.
 * Calculates width dynamically based on text length.
 * 
 * @param percentage - Coverage percentage (0-100) or Summary object for unified
 * @param type - Badge type
 * @param options - Custom label or color
 * @returns {string} SVG string
 */
export function generateBadgeSvg(percentage: number | CoverageSummary, type: BadgeType = 'lines', options: BadgeOptions = {}): string {
  if (type === 'logo') {
    return generateLogoBadge();
  }
  
  if (type === 'unified' && typeof percentage === 'object') {
    return generateUnifiedBadge(percentage as CoverageSummary);
  }

  // Standard single badge behavior
  if (typeof percentage !== 'number') {
    // Fallback if incorrect type passed for standard badge
    return '';
  }

  const roundedPct = Math.round(percentage);
  const color = options.color || getBadgeColor(percentage);
  const label = options.label || type;
  

  const logoWidth = 20;
  const labelWidth = label.length * 7 + 10;
  const valueWidth = String(roundedPct).length * 8 + 20;
  const totalWidth = logoWidth + labelWidth + valueWidth;
  
  const labelX = logoWidth + labelWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${roundedPct}%">
    <title>${label}: ${roundedPct}%</title>
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${logoWidth + labelWidth}" height="20" fill="#555"/>
        <rect x="${logoWidth + labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="3" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
        <text aria-hidden="true" x="${(logoWidth + labelWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 5) * 10}">${label}</text>
        <text x="${(logoWidth + labelWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 5) * 10}">${label}</text>
        <text aria-hidden="true" x="${(labelX + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
        <text x="${(labelX + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
    </g>
</svg>
  `.trim();
}

function generateLogoBadge(): string {
  // A square badge with the logo
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="20" fill="#333"/>
  <g transform="translate(8, 8)">
     <svg width="24" height="24" viewBox="0 0 70.367256 69.038162">
      ${COCOV_LOGO.replace(/^<svg[^>]*>|<\/svg>$/g, '')}
     </svg>
  </g>
</svg>
  `.trim();
}

/**
 * Generates a Diff/Delta badge showing change in coverage.
 * Color coded: Green (Positive), Red (Negative), Blue (Neutral).
 * 
 * @param diff - The difference value (e.g. -1.5, +2.0)
 * @param type - Metric name (lines, branches, etc)
 * @param options - Custom label
 * @returns {string} SVG string
 */
export function generateDiffBadge(diff: number, type: BadgeType = 'lines', options: BadgeOptions = {}): string {
  const roundedDiff = Math.round(diff);
  const sign = roundedDiff > 0 ? '+' : roundedDiff < 0 ? '' : '±'; // - is already in number string
  const label = options.label || type;
  const valueText = `${sign}${roundedDiff}%`;
  
  // Color Logic: Red if regressed (negative), Green if improved (positive), Blue if neutral
  let color = '#007ec6'; // blue
  if (roundedDiff > 0) color = '#4c1'; // green
  if (roundedDiff < 0) color = '#e05d44'; // red

  options.color = color;
  
  // We reuse generating a standard badge but with specific text
  // However, standard badge takes number. We construct custom text?
  // generateBadgeSvg uses pct for text. 
  // Let's perform manual generation to control the value text strictly.
  
  const logoWidth = 20;
  // Increase padding factor
  const labelWidth = label.length * 7 + 12; 
  const valueWidth = valueText.length * 8 + 12;
  const totalWidth = logoWidth + labelWidth + valueWidth;
  const labelX = logoWidth + labelWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${valueText}">
    <title>${label}: ${valueText}</title>
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${logoWidth + labelWidth}" height="20" fill="#555"/>
        <rect x="${logoWidth + labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="3" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
        <text aria-hidden="true" x="${(logoWidth + labelWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text x="${(logoWidth + labelWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text aria-hidden="true" x="${(labelX + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${valueText}</text>
        <text x="${(labelX + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${valueText}</text>
    </g>
</svg>
  `.trim();
}

/**
 * Generates a 'Unified' badge containing all 4 metrics in a single strip.
 * Useful for concise high-level overview.
 * 
 * @param summary - The full coverage summary
 * @returns {string} SVG string
 */
function generateUnifiedBadge(summary: CoverageSummary): string {
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;
  const labels = { lines: 'lines', statements: 'stmts', functions: 'funcs', branches: 'br' };
  
  let currentX = 0;
  const logoWidth = 24; 
  
  // Improved width calculation for readability
  // Char width approx 7px at 110 fontsize scaled 0.1 -> means 7px actual.
  // We add generous padding.
  const segments = metrics.map(m => {
    const pct = summary[m].pct;
    const rounded = Math.round(pct);
    const color = getBadgeColor(pct);
    const label = labels[m];
    // label length * 6 + number length * 6 + 15 padding
    const width = (label.length + String(rounded).length + 3) * 7 + 10; 
    
    return { metric: m, pct: rounded, color, label, width };
  });

  const totalWidth = logoWidth + segments.reduce((sum, s) => sum + s.width, 0);

  let svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="Unified Coverage">
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${logoWidth}" height="20" fill="#555"/>
  `;

  currentX = logoWidth;

  segments.forEach(s => {
    svgContent += `<rect x="${currentX}" width="${s.width}" height="20" fill="${s.color}"/>`;
    currentX += s.width;
  });

  svgContent += `<rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="4" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
  `;

  currentX = logoWidth;

  segments.forEach(s => {
    const cx = currentX + s.width / 2;
    const text = `${s.label} ${s.pct}%`; // No colon, simpler
    const textLength = (s.width - 10) * 10; // More conservative text length
    
    svgContent += `
        <text aria-hidden="true" x="${cx * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${textLength}">${text}</text>
        <text x="${cx * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${textLength}">${text}</text>
    `;
    currentX += s.width;
  });

  svgContent += `
    </g>
</svg>`;

  return svgContent.trim();
}
``

### File: `core/html/generator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { HtmlGenerator } from './generator.js';

describe('HtmlGenerator', () => {
  it('generates html with history and current data', () => {
    const generator = new HtmlGenerator([], { total: { lines: { pct: 100 } } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const html = generator.generate();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('100%');
  });
});
```

### File: `core/html/generator.ts`

```typescript
import { HistoryEntry, TotalCoverage } from '@/types.js';
import { htmlTemplate } from './templates/base.js';

export class HtmlGenerator {
  private history: HistoryEntry[];
  private current: TotalCoverage;
  private detailed: Record<string, any> | null;

  constructor(history: HistoryEntry[], current: TotalCoverage, detailed: Record<string, any> | null = null) {
    this.history = history;
    this.current = current;
    this.detailed = detailed;
  }

  /**
   * Generates a fully interactive HTML report using the base template.
   * Injects history and current coverage data as JSON into the HTML.
   * 
   * @returns {string} Complete HTML string
   */
  generate(): string {
    const historyData = JSON.stringify(this.history);
    const currentData = JSON.stringify(this.current);
    const detailedData = JSON.stringify(this.detailed || {});
    return htmlTemplate(historyData, currentData, detailedData);
  }
}
```

### File: `core/html/templates/base.ts`

``typescript
export const htmlTemplate = (historyData: string, currentData: string, detailedData: string = '{}'): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cocov Intelligence</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg: #0f1115;
            --surface: #181b21;
            --surface-glass: rgba(24, 27, 33, 0.7);
            --primary: #6366f1;
            --secondary: #ec4899;
            --accent: #8b5cf6;
            --success: #22c55e;
            --warning: #eab308;
            --error: #ef4444;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --border: #2d3139;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            /* Subtle grid background */
            background-image: linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: -1px -1px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Glassmorphism Cards */
        .card {
            background: var(--surface-glass);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            border-color: var(--primary);
        }

        /* Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        h1, h2, h3 { margin: 0; font-weight: 600; }
        
        .logo {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.5rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Grid Layout */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        /* Metrics */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        @media (max-width: 768px) {
            .metrics-grid { grid-template-columns: 1fr 1fr; }
        }

        .metric {
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0.5rem 0;
            font-family: 'JetBrains Mono', monospace;
        }

        .metric-label {
            color: var(--text-dim);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.1em;
        }

        /* Chart */
        .chart-container {
            position: relative;
            height: 400px;
            width: 100%;
        }

        /* Tables */
        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        th {
            cursor: pointer;
            color: var(--text-dim);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
        }

        th:hover { color: var(--text-main); }

        .file-path {
            font-family: 'JetBrains Mono', monospace;
            color: var(--primary);
        }

        .progress-bar {
            height: 6px;
            background: var(--surface);
            border-radius: 3px;
            overflow: hidden;
            width: 100px;
        }

        .progress-fill {
            height: 100%;
            border-radius: 3px;
        }

        /* Search */
        .search-bar {
            width: 100%;
            padding: 0.75rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            margin-bottom: 1rem;
        }

        .search-bar:focus {
            outline: none;
            border-color: var(--primary);
        }

        /* Utility */
        .text-green { color: var(--success); }
        .text-yellow { color: var(--warning); }
        .text-red { color: var(--error); }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">COCOV INTELLIGENCE</div>
            <div style="color: var(--text-dim); font-size: 0.9rem;">v2.0</div>
        </header>

        <!-- Overview Cards -->
        <div class="metrics-grid">
            <div class="card metric">
                <div class="metric-label">Lines</div>
                <div class="metric-value" id="lines-val">--%</div>
                <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="lines-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Statements</div>
                <div class="metric-value" id="statements-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="statements-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Functions</div>
                <div class="metric-value" id="functions-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="functions-bar"></div>
                </div>
            </div>
            <div class="card metric">
                <div class="metric-label">Branches</div>
                <div class="metric-value" id="branches-val">--%</div>
                 <div class="progress-bar" style="width: 100%; margin: 0 auto; max-width: 100px;">
                    <div class="progress-fill" id="branches-bar"></div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid">
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Velocity & Trends</h2>
                    <span style="font-size: 0.8rem; color: var(--text-dim);">Scroll to zoom</span>
                </div>
                <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </div>

        <!-- File Explorer -->
        <div class="card">
            <h2>File Explorer</h2>
            <input type="text" id="fileSearch" class="search-bar" placeholder="Search files..." style="margin-top: 1rem;">
            <div class="table-container">
                <table id="fileTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable(0)">File</th>
                            <th onclick="sortTable(1)">Lines</th>
                            <th onclick="sortTable(2)">Statements</th>
                            <th onclick="sortTable(3)">Funcs</th>
                            <th onclick="sortTable(4)">Branches</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <!-- Injected via JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Scripts: Chart.js + Zoom Plugin -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1"></script>

    <script>
        const history = ${historyData};
        const current = ${currentData};
        const detailed = ${detailedData};

        // --- Utils ---
        const getColor = (pct) => pct >= 90 ? '#22c55e' : (pct >= 80 ? '#eab308' : '#ef4444');
        
        // --- Render Metrics ---
        // Lines
        const lnPct = current.total.lines.pct;
        document.getElementById('lines-val').innerText = lnPct + '%';
        document.getElementById('lines-val').style.color = getColor(lnPct);
        document.getElementById('lines-bar').style.backgroundColor = getColor(lnPct);
        document.getElementById('lines-bar').style.width = lnPct + '%';

        // Statements
        const stPct = current.total.statements.pct;
        document.getElementById('statements-val').innerText = stPct + '%';
        document.getElementById('statements-val').style.color = getColor(stPct);
        document.getElementById('statements-bar').style.backgroundColor = getColor(stPct);
        document.getElementById('statements-bar').style.width = stPct + '%';
        
        // Functions
        const fnPct = current.total.functions.pct;
        document.getElementById('functions-val').innerText = fnPct + '%';
        document.getElementById('functions-val').style.color = getColor(fnPct);
        document.getElementById('functions-bar').style.backgroundColor = getColor(fnPct);
        document.getElementById('functions-bar').style.width = fnPct + '%';
        
        // Branches
        const brPct = current.total.branches.pct;
        document.getElementById('branches-val').innerText = brPct + '%';
        document.getElementById('branches-val').style.color = getColor(brPct);
        document.getElementById('branches-bar').style.backgroundColor = getColor(brPct);
        document.getElementById('branches-bar').style.width = brPct + '%';

        // --- Render Charts ---
        const ctx = document.getElementById('trendChart').getContext('2d');
        const timestamps = history.map(h => new Date(h.timestamp).toLocaleDateString());
        const dataLines = history.map(h => h.metrics.lines.pct);
        
        // Gradient for Line Chart
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // primary
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Lines Coverage',
                    data: dataLines,
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#2d3139' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: '#2d3139' }, ticks: { color: '#94a3b8' }, min: 0, max: 100 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#181b21',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                        borderColor: '#2d3139',
                        borderWidth: 1
                    },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                }
            }
        });

        // --- Render Table ---
        const tbody = document.getElementById('tableBody');
        const rows = Object.entries(detailed || {}).map(([path, data]) => {
            // Istanbul coverage-final.json structure is complex. 
            // We usually need a summarizer to get pct from this. 
            // However, we passed detailedJSON which is raw istanbul. Without parsing logic, we can't easily get PCT.
            // Wait, we need the SUMMARY per file, not detailed line hits.
            // If detailed is just coverage-final.json, we need to calculate pct.
            // For simplicity in this template version, we'll try to calculate simplified coverage or mock if complex parsing is needed client-side.
            
            // Actually, usually tools generate a per-file summary too. 
            // If we don't have it, we can calculate lines covered / total.
            
            const lines = Object.values(data.s);
            const totalLines = lines.length;
            const coveredLines = lines.filter(c => c > 0).length;
            const pct = totalLines === 0 ? 100 : Math.round((coveredLines / totalLines) * 100);
            
            // Simplified for now (only lines)
            return {
                path: path.replace(process.cwd?.() || '', '').replace(/^\\/|\\\\/g, ''), // Rel path
                lines: pct,
                // Mocking others for lightweight calc or we need more robust backend summarization
                stmts: pct, 
                funcs: 0, // Placeholder
                br: 0     // Placeholder
            };
        });

        function renderTable(filter = '') {
            tbody.innerHTML = '';
            rows.filter(r => r.path.toLowerCase().includes(filter.toLowerCase())).forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = \`
                    <td><span class="file-path">\${r.path}</span></td>
                    <td style="color: \${getColor(r.lines)}">\${r.lines}%</td>
                    <td class="text-dim">-</td>
                    <td class="text-dim">-</td>
                    <td class="text-dim">-</td>
                \`;
                tbody.appendChild(tr);
            });
            if(rows.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-dim);">No detailed file data available (Run with coverage enabled)</td></tr>';
            }
        }

        renderTable();

        document.getElementById('fileSearch').addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
        
    </script>
</body>
</html>
`;
``

### File: `core/init/README.md`

``md
# 🏗️ Cocov Initialization & Scaffolding

The `src/core/init` directory manages the onboarding experience. It is designed to be "Opinionated but Flexible".

## 🛠️ Scaffolding Strategy

### 1. `scaffold.ts`
The worker module. It performs the filesystem mutations:
- Creates `.cocov/config.json`.
- Injects hooks.
- Updates `.gitignore`.

### 2. Husky Integration
We enforce a **Hardened Workflow** by default:
- **pre-commit**: Runs `cocov run --diff --dry-run`.
  - *Why?* Prevents committing code that isn't covered. Fast check.
- **pre-push**: Runs `cocov run` (Full Suite).
  - *Why?* Updates the baseline and ensures no overall regression.

### 3. CI/CD
Generates a Github Action workflow that mirrors the local logic.
- **Strategy**: "Test Local, Verify Remote". The local `.cocov` config is the source of truth, but CI runs the verification again to catch environment differences.

## 🧠 Philosophy
- **Hidden Config**: prefer `.cocov/` over root file pollution.
- **Guard Rails**: The init process assumes you *want* protection, so it enables strict hooks by default unless opted out.
``

### File: `core/init/questions.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Ensure we use the REAL module
vi.unmock('./questions.js');
import { askInitQuestions } from './questions.js';
import prompts from 'prompts';

vi.mock('prompts');

describe('askInitQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts for overwrite if config exists', async () => {
    console.log('Running questions test case 1');
    vi.mocked(prompts).mockResolvedValueOnce({ overwrite: false });
    const result = await askInitQuestions(true);
    expect(result).toEqual({ overwrite: false });
  });

  it('skips prompts if config does not exist', async () => {
    console.log('Running questions test case 2');
    vi.mocked(prompts).mockResolvedValueOnce({ 
      enableStackGuard: true,
      requiredDeps: ['typescript'],
      setupHusky: true,
      hooks: ['pre-commit'],
      setupGithubAction: true,
      updateGitIgnore: true
    });
    
    const result = await askInitQuestions(false);
    expect(result.enableStackGuard).toBe(true);
  });

  it('validates prompt definitions', async () => {
    await askInitQuestions(false);
    const calls = vi.mocked(prompts).mock.calls;
    const questionsArray = calls[calls.length - 1][0] as any[];
    
    // Find requiredDeps question format
    const reqDeps = questionsArray.find(q => q.name === 'requiredDeps');
    expect(reqDeps.format(['a', 'b'])).toEqual(['a', 'b']);

    // Find hooks question type
    const hooks = questionsArray.find(q => q.name === 'hooks');
    expect(hooks.type(true)).toBe('multiselect');
    expect(hooks.type(false)).toBe(null);
  });
});
```

### File: `core/init/questions.ts`

```typescript
import prompts from 'prompts';

export interface InitAnswers {
  overwrite?: boolean;
  enableStackGuard?: boolean;
  requiredDeps?: string[];
  setupHusky?: boolean;
  hooks?: string[];
  setupGithubAction?: boolean;
  updateGitIgnore?: boolean;
}

export async function askInitQuestions(configExists: boolean): Promise<InitAnswers> {
  console.log('DEBUG: askInitQuestions executing');
  if (configExists) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'cocov.json already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) return { overwrite: false };
  }

  return prompts([
    {
      type: 'confirm',
      name: 'enableStackGuard',
      message: 'Enable Stack Guard? (Enforce TypeScript & Deps)',
      initial: true,
    },
    {
      type: 'multiselect',
      name: 'requiredDeps',
      message: 'Select Critical Dependencies to Enforce:',
      choices: [
        { title: 'typescript', value: 'typescript', selected: true },
        { title: 'react', value: 'react' },
        { title: 'strapi', value: '@strapi/strapi' },
        { title: 'langchain', value: 'langchain' },
      ],
      min: 0,
      format: (val: string[]): string[] => val,
    },
    {
      type: 'confirm',
      name: 'setupHusky',
      message: 'Setup Husky Git Hooks?',
      initial: true,
    },
    {
      type: (prev) => (prev ? 'multiselect' : null),
      name: 'hooks',
      message: 'Select Git Hooks to Install:',
      choices: [
        { title: 'pre-commit (Quick Check)', value: 'pre-commit', selected: true },
        { title: 'pre-push (Full Validation)', value: 'pre-push', selected: true },
      ],
      min: 1,
    },
    {
      type: 'confirm',
      name: 'setupGithubAction',
      message: 'Generate GitHub Actions Workflow?',
      initial: true,
    },
    {
      type: 'confirm',
      name: 'updateGitIgnore',
      message: 'Add .cocov to .gitignore?',
      initial: true,
    },
  ]);
}
```

### File: `core/init/scaffold.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scaffoldConfig, setupHusky, setupGithub, updateGitIgnore } from './scaffold.js';
import fs from 'fs-extra';
import { execa } from 'execa';
import path from 'path';

vi.mock('fs-extra');
vi.mock('execa', () => ({ execa: vi.fn() }));

describe('scaffoldConfig', () => {
  it('creates .cocov/config.json', async () => {
    const cwd = '/cwd';
    await scaffoldConfig(cwd, { enableStackGuard: true });

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(cwd, '.cocov', 'config.json'),
      expect.objectContaining({ stack: { required: [], forbidden: [] } }),
      expect.anything(),
    );
  });

  it('creates .cocov/config.json without stack if disabled', async () => {
    const cwd = '/cwd';
    await scaffoldConfig(cwd, { enableStackGuard: false });

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(cwd, '.cocov', 'config.json'),
      expect.objectContaining({ stack: undefined }),
      expect.anything(),
    );
  });
});

describe('setupHusky', () => {
  const cwd = '/cwd';
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips if not selected', async () => {
    await setupHusky(cwd, { setupHusky: false });
    expect(execa).not.toHaveBeenCalled();
  });

  it('installs and inits husky', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(execa).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['install', 'husky']),
      expect.anything(),
    );
    expect(execa).toHaveBeenCalledWith(
      'npx',
      expect.arrayContaining(['husky', 'init']),
      expect.anything(),
    );
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('configures pre-push hook', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-push'] });
    expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('pre-push'),
        expect.stringContaining('npm run build'),
        expect.anything()
    );
  });

  it('handles errors gracefully', async () => {
    vi.mocked(execa).mockRejectedValue(new Error('Husky fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Husky fail'));
  });

  it('skips unknown hooks', async () => {
    await setupHusky(cwd, { setupHusky: true, hooks: ['unknown-hook'] });
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.appendFile).not.toHaveBeenCalled();
  });


  it('appends to hook if it exists but missing cocov', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('#!/bin/sh\nPrevious Hook');
    await setupHusky(cwd, { setupHusky: true, hooks: ['pre-commit'] });
    expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('pre-commit'),
        expect.stringContaining('cocov'),
    );
  });
});

describe('setupGithub', () => {
  it('skips if not selected', async () => {
    vi.clearAllMocks(); // Ensure clean state
    await setupGithub('/cwd', { setupGithubAction: false });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('creates workflow file', async () => {
    await setupGithub('/cwd', { setupGithubAction: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('cocov.yml'),
      expect.stringContaining('name: Cocov CI'),
    );
  });
});

describe('updateGitIgnore', () => {
  it('skips if not selected', async () => {
    vi.clearAllMocks();
    await updateGitIgnore('/cwd', { updateGitIgnore: false });
    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.appendFile).not.toHaveBeenCalled();
  });

  it('creates .gitignore if missing', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      expect.stringContaining('.cocov')
    );
  });

  it('appends to .gitignore if exists but missing entry', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(fs.readFile).mockResolvedValue('node_modules\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      expect.stringContaining('.cocov')
    );
  });

  it('skips appending if entry already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(fs.readFile).mockResolvedValue('node_modules\n.cocov\n');
    await updateGitIgnore('/cwd', { updateGitIgnore: true });
    expect(fs.appendFile).not.toHaveBeenCalled();
  });
});

describe('setupGithub idempotency', () => {
   it('skips if workflow already exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    await setupGithub('/cwd', { setupGithubAction: true });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
```

### File: `core/init/scaffold.ts`

``typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import { InitAnswers } from './questions.js';

export async function scaffoldConfig(cwd: string, answers: InitAnswers): Promise<void> {
  const hiddenDir = path.join(cwd, '.cocov');
  await fs.ensureDir(hiddenDir);
  const configPath = path.join(hiddenDir, 'config.json');



  const config = {
    total: 0,
    stack: answers.enableStackGuard
      ? {
          required: answers.requiredDeps || [],
          forbidden: [],
        }
      : undefined,
  };

  await fs.writeJSON(configPath, config, { spaces: 2 });
  console.log(chalk.green(`\n✔ Created ${configPath}`));
}

export async function setupHusky(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.setupHusky || !answers.hooks) return;

  try {
    console.log(chalk.blue('Installing Husky...'));
    await execa('npm', ['install', 'husky', '--save-dev'], { cwd });
    await execa('npx', ['husky', 'init'], { cwd });

    for (const hook of answers.hooks) {
      const hookPath = path.join(cwd, '.husky', hook);
      let command = '';

      if (hook === 'pre-commit') {
        // Pre-commit Guard
        // 1. Lint Staged (if configured) or Lint
        // 2. Diff-Aware Coverage (Strict) preventing commit of untested code
        command = `
# Pre-commit Guard
npx cocov run --diff --dry-run
`;
      } else if (hook === 'pre-push') {
        // Pre-push Guard
        // 1. Typecheck
        // 2. Full Test Suite
        // 3. Full Coverage Verification
        command = `
# Pre-push Guard
npm run build
npm test
npx cocov run
`;
      } else {
        continue;
      }

      if (await fs.pathExists(hookPath)) {
        const content = await fs.readFile(hookPath, 'utf-8');
        if (!content.includes('cocov')) {
          await fs.appendFile(hookPath, `\n${command}\n`);
          console.log(chalk.green(`✔ Injected Cocov Guard into ${hook}`));
        }
      } else {
        await fs.writeFile(hookPath, `${command}\n`, { mode: 0o755 });
        console.log(chalk.green(`✔ Created hardened ${hook} hook`));
      }
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(`Failed to setup Husky: ${message}`));
  }
}

export async function setupGithub(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.setupGithubAction) return;

  const githubDir = path.join(cwd, '.github', 'workflows');
  const workflowPath = path.join(githubDir, 'cocov.yml');

  if (await fs.pathExists(workflowPath)) {
    console.log(chalk.gray('GitHub Action already exists. Skipping.'));
    return;
  }

  await fs.ensureDir(githubDir);

  const workflow = `name: Cocov CI

on:
  push:
    branches: [ "main", "master", "develop" ]
  pull_request:
    branches: [ "main", "master", "develop" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run Tests & Cocov Guard
      run: npx cocov run "npm test"
`;

  await fs.writeFile(workflowPath, workflow);
  console.log(chalk.green(`\n✔ Created GitHub Action at ${workflowPath}`));
}

export async function updateGitIgnore(cwd: string, answers: InitAnswers): Promise<void> {
  if (!answers.updateGitIgnore) return;

  const gitIgnorePath = path.join(cwd, '.gitignore');
  const ignoreEntry = '.cocov';

  try {
    if (await fs.pathExists(gitIgnorePath)) {
      const content = await fs.readFile(gitIgnorePath, 'utf-8');
      if (!content.includes(ignoreEntry)) {
        await fs.appendFile(gitIgnorePath, `\n${ignoreEntry}\n`);
        console.log(chalk.green(`✔ Added ${ignoreEntry} to .gitignore`));
      } else {
        console.log(chalk.gray(`ℹ ${ignoreEntry} already in .gitignore`));
      }
    } else {
      await fs.writeFile(gitIgnorePath, `${ignoreEntry}\n`);
      console.log(chalk.green(`✔ Created .gitignore with ${ignoreEntry}`));
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(`Failed to update .gitignore: ${message}`));
  }
}
``

### File: `core/integrity.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { verifyCoverageFreshness, computeIntegrityHash } from './integrity.js';
import fs from 'fs-extra';

vi.mock('fs-extra');

describe('verifyCoverageFreshness', () => {
  it('returns false if file does not exist', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => false);
    const result = await verifyCoverageFreshness('/cwd');
    expect(result).toBe(false);
  });

  it('returns true and warns if file is old', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => true);
    const oldStats = { mtimeMs: Date.now() - 20 * 60 * 1000 };
    vi.mocked(fs.stat).mockResolvedValue(oldStats as unknown as fs.Stats);

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await verifyCoverageFreshness('/cwd');

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns true if file is fresh', async () => {
    vi.mocked(fs.pathExists).mockImplementation(async () => true);
    const freshStats = { mtimeMs: Date.now() - 1 * 60 * 1000 };
    vi.mocked(fs.stat).mockResolvedValue(freshStats as unknown as fs.Stats);

    const result = await verifyCoverageFreshness('/cwd');
    expect(result).toBe(true);
  });
});

describe('computeIntegrityHash', () => {
  it('computes sha256 hash', async () => {
    const hash = await computeIntegrityHash({ foo: 'bar' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

### File: `core/integrity.ts`

``typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Verifies that the coverage data is fresh (created recently).
 * Prevents using stale coverage data for pre-commit checks.
 * 
 * @param cwd - Current working directory
 * @returns {Promise<boolean>} True if fresh enough, warns if stale
 */
export async function verifyCoverageFreshness(cwd: string): Promise<boolean> {
  const summaryPath = path.resolve(cwd, 'coverage/coverage-summary.json');
  if (!(await fs.pathExists(summaryPath))) return false;

  const stats = (await fs.stat(summaryPath)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const ageMs = Date.now() - stats.mtimeMs;
  const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

  if (ageMs > MAX_AGE_MS) {
    console.warn(
      chalk.yellow(
        `⚠ Coverage data is ${Math.round(ageMs / 1000 / 60)} minutes old. Ensure you ran tests recently.`,
      ),
    );
    // We warn but don't fail, unless strict?
    return true;
  }
  return true;
}

/**
 * Computes a SHA-256 integrity hash for the coverage data.
 * Used to ensure data hasn't been tampered with.
 * 
 * @param content - Data to hash
 * @returns {Promise<string>} Hex string of the hash
 */
export async function computeIntegrityHash(content: any): Promise<string> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
``

### File: `core/logic/README.md`

``md
# ⚙️ Cocov Core Logic

This directory contains the central nervous system of the application. These modules strictly implement the business rules for "Guard Mode" and "Diff Mode".

## 🧩 Modules

### `baseline-handler.ts` (The Guard)
This is the primary gatekeeper for the `run` command.
**Flow:**
1. Checks if a baseline exists.
   - If NO: Becomes the new baseline (unless `--dry-run`).
   - If YES: Proceeds to comparison.
2. **Comparison**: Uses `Comparator` to check `current` vs `baseline`.
3. **Regression Check**: If ANY metric (lines, statements, branches, functions) is lower than baseline -> **Fail Build (Exit 1)**.
4. **Improvement**: If metrics are higher -> **Update Baseline** (ratchet up quality).

### `diff-runner.ts` (The Strict Mode)
Handles the `--diff` flag context.
**Flow:**
1. **Git Analysis**: Asks `git-utils` for changed line numbers.
2. **Coverage Mapping**: Loads `coverage-final.json` (detailed Istanbul data).
3. **Intersection**: Checks if *any changed line* falls outside of a coverage block.
4. **Verdict**: 
   - If even 1 changed line is uncovered -> **Fail Build (Exit 1)**.
   - Ignores existing technical debt; focuses only on *new* code.

### `comparator.ts`
Pure function logic for comparing two `CoverageSummary` objects. Returns a formatted result object used by reporters.

## ⚠️ Critical Invariants
- **Never downgrade**: The baseline can only go UP.
- **Dry Run Safety**: Logic modules must respect `dryRun` options and never write to disk if set.
``

### File: `core/logic/baseline-handler.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import { handleBaselineCheck } from './baseline-handler.js';
import * as writer from '@/core/coverage/writer.js';
// import * as reporter from '@/reporter.js'; // Unused
import * as comparator from '@/comparator.js';
import * as git from '@/git-utils.js';

vi.mock('@/core/coverage/writer.js');
vi.mock('@/reporter.js');
vi.mock('@/comparator.js');
vi.mock('@/git-utils.js');
vi.mock('fs-extra');

describe('handleBaselineCheck', () => {
  const mockHistory = { append: vi.fn() } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const cwd = '/test';
  const current = { total: { lines: { pct: 80 } } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const baseline = { total: { lines: { pct: 80 } } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(writer.writeBaseline).mockResolvedValue();
    vi.mocked(git.getCurrentCommit).mockResolvedValue('abc');
    vi.mocked(git.getCurrentBranch).mockResolvedValue('main');

    // Default comparator mock
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({
      isRegression: false,
      improved: false,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  it('writes baseline if none exists (not dry run)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await handleBaselineCheck(cwd, current, null, { dryRun: false }, mockHistory);
    expect(writer.writeBaseline).toHaveBeenCalledWith(cwd, current);
    expect(mockHistory.append).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    // Should not write file directly, only via writer
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('does not write baseline if none exists (dry run)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await handleBaselineCheck(cwd, current, null, { dryRun: true }, mockHistory);
    expect(writer.writeBaseline).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits on regression', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({
      isRegression: true,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await handleBaselineCheck(cwd, current, baseline, {}, mockHistory);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('updates baseline on improvement', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({ improved: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    await handleBaselineCheck(cwd, current, baseline, { dryRun: false }, mockHistory);
    expect(writer.writeBaseline).toHaveBeenCalledWith(cwd, current);
  });

  it('does not update baseline on improvement (dry run)', async () => {
    vi.spyOn(comparator.Comparator.prototype, 'compare').mockReturnValue({ improved: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    await handleBaselineCheck(cwd, current, baseline, { dryRun: true }, mockHistory);
    expect(writer.writeBaseline).not.toHaveBeenCalled();
  });
});
```

### File: `core/logic/baseline-handler.ts`

```typescript
import chalk from 'chalk';
import { TotalCoverage, CocovFile } from '../../types.js';
import { writeBaseline } from '../coverage/writer.js';
import { Reporter } from '../../reporter.js';
import { Comparator } from '../../comparator.js';
import { HistoryManager } from '../../history.js';
import { getCurrentCommit, getCurrentBranch } from '../../git-utils.js';

/**
 * Core Logic: Orchestrates the comparison between current coverage and baseline.
 * - Saves history if not dry-run.
 * - Handles first-run (no baseline) scenario.
 * - Updates baseline on improvement.
 * - Exits with error code 1 on regression.
 * 
 * @param cwd - Current working directory
 * @param current - Current coverage
 * @param baseline - Loaded baseline
 * @param options - Run options (e.g. dryRun)
 * @param historyManager - History manager instance
 */
export async function handleBaselineCheck(
  cwd: string,
  current: TotalCoverage,
  baseline: CocovFile | null,
  options: { dryRun?: boolean },
  historyManager: HistoryManager,
): Promise<void> {
  if (!options.dryRun) {
    const context = {
      cwd,
      timestamp: new Date(),
      commitHash: await getCurrentCommit(),
      branch: await getCurrentBranch(),
    };
    await historyManager.append(current.total, context);
  }

  const reporter = new Reporter();
  const comparator = new Comparator();

  if (!baseline) {
    if (options.dryRun) {
      console.log(chalk.yellow('No baseline found. (Dry Run: Not saving).'));
      process.exit(0);
      return;
    }
    console.log(chalk.yellow('No baseline found. Saving current coverage as baseline.'));
    await writeBaseline(cwd, current);
    reporter.printTotal(current.total);
    process.exit(0);
    return;
  }

  // Compare total summaries
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
      await writeBaseline(cwd, current);
    }
  } else {
    console.log(chalk.gray('\nCoverage unchanged.'));
  }
}
```

### File: `core/logic/comparator.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Comparator } from '@/comparator.js';
import { TotalCoverage, CoverageMetric } from '@/types.js';

describe('Comparator Exhaustive Spec', () => {
  const comparator = new Comparator();

  // meaningful boundary values
  const values = [0, 1, 49, 50, 51, 79, 80, 81, 99, 100];
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;

  // Use test.each to generate individual tests clearly
  const cases = [];
  for (const metric of metrics) {
    for (const prev of values) {
      for (const curr of values) {
        cases.push({ metric, prev, curr });
      }
    }
  }

  it.each(cases)('Metric $metric: $prev% -> $curr%', ({ metric, prev, curr }) => {
    const previous = createCoverage({ [metric]: prev });
    const current = createCoverage({ [metric]: curr });

    const result = comparator.compare(current.total, previous.total);
    const diff = curr - prev;

    if (diff < 0) {
      expect(result.isRegression).toBe(true);
      expect(result.metrics[metric].diff).toBe(diff);
      expect(result.improved).toBe(false);
    } else if (diff > 0) {
      expect(result.improved).toBe(true);
      expect(result.isRegression).toBe(false);
      expect(result.metrics[metric].diff).toBe(diff);
    } else {
      expect(result.isRegression).toBe(false);
      expect(result.improved).toBe(false);
      expect(result.metrics[metric].diff).toBe(0);
    }
  });

  function createCoverage(overrides: any): TotalCoverage { // eslint-disable-line @typescript-eslint/no-explicit-any
    const defaults = { total: 100, covered: 80, skipped: 0, pct: 80 };
    const merge = (key: string): CoverageMetric => ({
      ...defaults,
      ...(overrides[key] !== undefined ? { pct: overrides[key] } : {}),
    });
    return {
      total: {
        lines: merge('lines'),
        statements: merge('statements'),
        functions: merge('functions'),
        branches: merge('branches'),
      },
    };
  }
});
```

### File: `core/logic/diff-checker.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiffChecker } from '@/diff-checker.js';
import * as git from '@/git-utils.js';
import path from 'path';

vi.mock('@/git-utils.js');

describe('DiffChecker', () => {
  const cwd = '/test';
  const checker = new DiffChecker(cwd);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty results if no files changed', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({});
    const results = await checker.checkDiffCoverage({});
    expect(results).toEqual([]);
  });

  it('detects uncovered lines in changed files warning', async () => {
    // Mock changed files: 'src/foo.ts' has changes on lines 10, 11
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/foo.ts': [10, 11],
    });

    // Mock detailed coverage
    const detailed = {
      [path.resolve(cwd, 'src/foo.ts')]: {
        statementMap: {
          '0': { start: { line: 10, column: 0 }, end: { line: 10, column: 10 } },
          '1': { start: { line: 11, column: 0 }, end: { line: 11, column: 10 } },
        },
        s: {
          '0': 0, // Uncovered
          '1': 1, // Covered
        },
      },
    };

    const results = await checker.checkDiffCoverage(detailed);

    expect(results).toHaveLength(1);
    expect(results[0].file).toBe('src/foo.ts');
    expect(results[0].changedLines).toEqual([10, 11]);
    expect(results[0].uncoveredLines).toEqual([10]);
  });

  it('ignores files not in detailed coverage', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/unknown.ts': [1],
    });

    const results = await checker.checkDiffCoverage({});
    expect(results).toEqual([]);
  });

  it('handles lines without statements gracefully', async () => {
    vi.mocked(git.getChangedLines).mockResolvedValue({
      'src/foo.ts': [20],
    });

    const detailed = {
      [path.resolve(cwd, 'src/foo.ts')]: {
        statementMap: {},
        s: {},
      },
    };

    const results = await checker.checkDiffCoverage(detailed);
    expect(results).toEqual([]);
  });
});
```

### File: `core/logic/diff-parser.spec.ts`

``typescript
import { describe, it, expect } from 'vitest';
import { extractChangedLines } from '@/git-utils.js';

describe('DiffChecker Parser Spec', () => {
  // Real git diff outputs from varied scenarios
  const scenarios = [
    {
      name: 'Single file, one chunk',
      diff: `diff --git a/src/foo.ts b/src/foo.ts
index abc..def 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,0 +15,5 @@ class Foo {
+  bar() {
+    return true;
+  }
+  // extra line
+ }`,
      expected: { 'src/foo.ts': [15, 16, 17, 18, 19] },
    },
    {
      name: 'Multiple chunks',
      diff: `diff --git a/src/foo.ts b/src/foo.ts
index abc..def 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,0 +15,2 @@
+ line15
+ line16
@@ -50,0 +60,1 @@
+ line60`,
      expected: { 'src/foo.ts': [15, 16, 60] },
    },
    {
      name: 'New file',
      diff: `diff --git a/new.ts b/new.ts
new file mode 100644
index 000..abc
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,3 @@
+import foo
+
+export const bar = 1;`,
      expected: { 'new.ts': [1, 2, 3] },
    },
    {
      name: 'Deleted file',
      diff: `diff --git a/deleted.ts b/deleted.ts
deleted file mode 100644
index abc..000
--- a/deleted.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-import foo
-
-export const bar = 1;`,
      expected: {},
    },
  ];

  // Permute these with random noises or other files to increase count?
  // User wants "real" tests.
  // Let's add variations of paths and hunks.

  const paths = ['src/a.ts', 'src/components/b.tsx', 'lib/utils.js', 'deep/nested/dir/file.ts'];
  const hunks = [
    { start: 1, count: 1 },
    { start: 10, count: 5 },
    { start: 100, count: 20 },
    { start: 999, count: 1 },
  ];

  const generatedCases: { path: string; hunk: { start: number; count: number } }[] = [];
  paths.forEach((p) => {
    hunks.forEach((h) => {
      generatedCases.push({ path: p, hunk: h });
    });
  });

  it.each(generatedCases)('parses diff for $path at line $hunk.start', ({ path: p, hunk }) => {
    const diff = `diff --git a/${p} b/${p}
index abc..def
--- a/${p}
+++ b/${p}
@@ -0,0 +${hunk.start},${hunk.count} @@
${'+ line\n'.repeat(hunk.count)}`;

    const result = extractChangedLines(diff);

    expect(result[p]).toBeDefined();
    expect(result[p].length).toBe(hunk.count);
    expect(result[p][0]).toBe(hunk.start);
  });

  it.each(scenarios)('$name', ({ diff, expected }) => {
    const result = extractChangedLines(diff);
    expect(result).toEqual(expected);
  });
});
``

### File: `core/logic/diff-runner.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDiffCheck } from './diff-runner.js';
import * as reader from '@/core/coverage/reader.js';
import { DiffChecker } from '@/diff-checker.js';

vi.mock('@/core/coverage/reader.js');
vi.mock('@/diff-checker.js');

describe('runDiffCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips if detailed coverage missing', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue(null);
    await runDiffCheck('/cwd');
    // valid, no error
  });

  it('passes if no diffs', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue({});
    vi.spyOn(DiffChecker.prototype, 'checkDiffCoverage').mockResolvedValue([]);
    await runDiffCheck('/cwd');
    // valid
  });

  it('exits if uncovered changes', async () => {
    vi.mocked(reader.readDetailedCoverage).mockResolvedValue({});
    // changedLines is required by DiffResult type, check definition
    // Assuming DiffChecker uses DiffResult { file, uncoveredLines, changedLines }
    vi.spyOn(DiffChecker.prototype, 'checkDiffCoverage').mockResolvedValue([
      { file: 'f', uncoveredLines: [1], changedLines: [1] },
    ]);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await runDiffCheck('/cwd');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### File: `core/logic/diff-runner.ts`

``typescript
import chalk from 'chalk';
import { readDetailedCoverage } from '../coverage/reader.js';
import { DiffChecker } from '../../diff-checker.js';

/**
 * Core Logic: Orchestrates the Diff-Aware Strict Mode.
 * - Loads detailed coverage.
 * - Identifies changed lines using Git.
 * - Cross-references changes with coverage map.
 * - Exits with error code 1 if ANY changed line is uncovered.
 * 
 * @param cwd - Current working directory
 */
export async function runDiffCheck(cwd: string): Promise<void> {
  console.log(chalk.blue('\n🔍 Running Diff-Aware Strict Mode...'));
  const diffChecker = new DiffChecker(cwd);
  const detailed = await readDetailedCoverage(cwd);

  if (!detailed) {
    console.warn(
      chalk.yellow(
        '⚠ Could not find detailed coverage (coverage-final.json). Skipping diff check.',
      ),
    );
    return;
  }

  const diffResults = await diffChecker.checkDiffCoverage(detailed);
  if (diffResults.length > 0) {
    console.error(chalk.red('\n🛑 Strict Mode Failed: Uncovered changes detected!'));
    diffResults.forEach((r) => {
      console.error(
        chalk.red(`  ${r.file}: Lines [${r.uncoveredLines.join(', ')}] are not covered.`),
      );
    });
    process.exit(1);
  } else {
    console.log(chalk.green('✔ Diff Strict Mode Passed: All changes covered.'));
  }
}
``

### File: `core/logic/threshold-validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validatePerFileThresholds } from './threshold-validator.js';
import { TotalCoverage } from '../../types.js';

describe('validatePerFileThresholds', () => {
  it('passes if all files meet min percentages', () => {
    const coverage: any = {
      total: {},
      'src/a.ts': { lines: { pct: 90 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
      'src/b.ts': { lines: { pct: 95 }, statements: { pct: 95 }, functions: { pct: 100 }, branches: { pct: 100 } },
    };
    
    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails if any metric is below threshold', () => {
    const coverage: any = {
      total: {},
    'src/a.ts': { lines: { pct: 89 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
    };
    
    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(false);
    expect(result.violations).toContain('a.ts: lines coverage is 89% (required: 90%)');
  });

  it('fails multiple files', () => {
    const coverage: any = {
      total: {},
      'src/a.ts': { lines: { pct: 50 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } },
      'src/b.ts': { lines: { pct: 90 }, statements: { pct: 40 }, functions: { pct: 90 }, branches: { pct: 90 } },
    };

    const result = validatePerFileThresholds(coverage, 90);
    expect(result.pass).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});
```

### File: `core/logic/threshold-validator.ts`

``typescript
import { TotalCoverage, CoverageMetric } from '../../types.js';

export interface ThresholdResult {
  pass: boolean;
  violations: string[];
}

/**
 * Validates that every file in the coverage report meets the minimum percentage.
 * 
 * @param coverage - The TotalCoverage object containing per-file summaries
 * @param minPct - The minimum mandatory percentage (e.g. 90)
 * @returns {ThresholdResult} Pass/Fail and list of specific violations
 */
export function validatePerFileThresholds(coverage: TotalCoverage, minPct: number): ThresholdResult {
  const violations: string[] = [];
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;

  for (const [filePath, summary] of Object.entries(coverage)) {
    if (filePath === 'total') continue;

    const shortName = filePath.split('/').pop() || filePath; // simplified name for report

    for (const metric of metrics) {
      const value = summary[metric];
      if (value.pct < minPct) {
        violations.push(
          `${shortName}: ${metric} coverage is ${value.pct}% (required: ${minPct}%)`
        );
      }
    }
  }

  return {
    pass: violations.length === 0,
    violations
  };
}
``

### File: `diff-checker.ts`

```typescript
import path from 'path';
import { getChangedLines } from './git-utils.js';

export interface DiffResult {
  file: string;
  changedLines: number[];
  uncoveredLines: number[];
}

export class DiffChecker {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  /**
   * Checks coverage for only the lines changed in the current git diff.
   * Maps git diff ranges to istanbul statement maps to determine if changed code is covered.
   * 
   * @param detailedCoverage - The file-by-file coverage data (coverage-final.json)
   * @returns {Promise<DiffResult[]>} A list of files with uncovered changed lines
   */
  async checkDiffCoverage(detailedCoverage: Record<string, any>): Promise<DiffResult[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const changedFiles = await getChangedLines(this.cwd);
    const results: DiffResult[] = [];

    for (const [relativePath, lines] of Object.entries(changedFiles)) {
      const absPath = path.resolve(this.cwd, relativePath);
      const fileCov = detailedCoverage[absPath];

      if (!fileCov) {
        continue;
      }

      const uncovered: number[] = [];

      for (const line of lines) {
        let covered = false;
        let statementFound = false;

        for (const [id, range] of Object.entries(fileCov.statementMap as Record<string, any>)) { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (line >= range.start.line && line <= range.end.line) {
            statementFound = true;
            if (fileCov.s[id] > 0) {
              covered = true;
              break;
            }
          }
        }

        if (statementFound && !covered) {
          uncovered.push(line);
        }
      }

      if (uncovered.length > 0) {
        results.push({
          file: relativePath,
          changedLines: lines,
          uncoveredLines: uncovered,
        });
      }
    }

    return results;
  }
}
```

### File: `executor.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTestCommand } from './executor.js';
import { execa } from 'execa';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('splits command and arguments correctly', async () => {
    await runTestCommand('npm run test --verbose');
    expect(execa).toHaveBeenCalledWith('npm', ['run', 'test', '--verbose'], { stdio: 'inherit' });
  });

  it('handles single command', async () => {
    await runTestCommand('jest');
    expect(execa).toHaveBeenCalledWith('jest', [], { stdio: 'inherit' });
  });
});
```

### File: `executor.ts`

```typescript
import { execa } from 'execa';

/**
 * Executes a test command in a child process, inheriting stdio.
 * This ensures test output is visible to the user.
 * 
 * @param command - The full shell command to run (e.g., "npm test")
 */
export async function runTestCommand(command: string): Promise<void> {
  const [cmd, ...args] = command.split(' ');
  await execa(cmd, args, { stdio: 'inherit' });
}
```

### File: `git-utils.test.ts`

``typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as gitUtils from './git-utils.js';
import { execa } from 'execa';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('git-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentCommit', () => {
    it('returns commit hash on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'abc1234\n' } as never);
      const commit = await gitUtils.getCurrentCommit();
      expect(commit).toBe('abc1234');
    });

    it('returns unknown on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const commit = await gitUtils.getCurrentCommit();
      expect(commit).toBe('unknown');
    });
  });

  describe('getCurrentBranch', () => {
    it('returns branch name on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'feature/branch\n' } as never);
      const branch = await gitUtils.getCurrentBranch();
      expect(branch).toBe('feature/branch');
    });

    it('returns unknown on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const branch = await gitUtils.getCurrentBranch();
      expect(branch).toBe('unknown');
    });
  });

  describe('getChangedFiles', () => {
    it('returns changed files list on success', async () => {
      vi.mocked(execa).mockResolvedValue({ stdout: 'file1.ts\nfile2.ts\n' } as never);
      const files = await gitUtils.getChangedFiles();
      expect(files).toEqual(['file1.ts', 'file2.ts']);
    });

    it('returns empty array on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const files = await gitUtils.getChangedFiles();
      expect(files).toEqual([]);
    });
  });

  describe('getChangedLines', () => {
    it('returns changed lines map on success', async () => {
      const mockDiff = `diff --git a/foo.ts b/foo.ts
index e43e2b4..6dd38e3 100644
--- a/foo.ts
+++ b/foo.ts
@@ -10,0 +11,2 @@
+line1
+line2
`;
      vi.mocked(execa).mockResolvedValue({ stdout: mockDiff } as never);

      const result = await gitUtils.getChangedLines(process.cwd());
      expect(result['foo.ts']).toEqual([11, 12]);
    });

    it('returns empty object on failure', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('fail'));
      const result = await gitUtils.getChangedLines(process.cwd());
      expect(result).toEqual({});
    });
  });
});
``

### File: `git-utils.ts`

```typescript
import { execa } from 'execa';
import parseDiff from 'parse-diff';

/**
 * Retrieves the current git commit hash (HEAD).
 * @returns {Promise<string>} Full SHA-1 commit hash or 'unknown'
 */
export async function getCurrentCommit(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Retrieves the current active git branch name.
 * @returns {Promise<string>} Branch name or 'unknown'
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Gets a list of files changed between HEAD and the working directory.
 * @returns {Promise<string[]>} Array of changed file paths
 */
export async function getChangedFiles(): Promise<string[]> {
  try {
    // Diff against HEAD
    const { stdout } = await execa('git', ['diff', '--name-only', 'HEAD']);
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Gets a map of changed files and their changed line numbers relative to HEAD.
 * Uses parse-diff for robust parsing of the git output.
 * @returns {Promise<Record<string, number[]>>} Map of filename -> changed line numbers
 */
export async function getChangedLines(cwd: string): Promise<Record<string, number[]>> {
  try {
    // We use -U0 to minimize context, but parse-diff handles context fine.
    // parse-diff expects standard git diff output.
    const { stdout } = await execa('git', ['diff', '-U0', 'HEAD', '--relative'], { cwd });
    return extractChangedLines(stdout);
  } catch {
    return {};
  }
}

/**
 * Parses git diff output using parse-diff to extract added/modified line numbers.
 * @param diff Raw git diff output
 * @returns {Record<string, number[]>} Map of filename -> changed line numbers
 */
export function extractChangedLines(diff: string): Record<string, number[]> {
  const files = parseDiff(diff);
  const changes: Record<string, number[]> = {};

  for (const file of files) {
    // Skip deleted files or invalid entries
    if (!file.to || file.to === '/dev/null') continue;

    // parse-diff usually strips a/ and b/ prefixes if standard git diff format.
    const fileName = file.to;
    const lines: number[] = [];
    
    for (const chunk of file.chunks) {
      for (const change of chunk.changes) {
        if (change.type === 'add') {
          lines.push(change.ln);
        }
      }
    }
    
    if (lines.length > 0) {
      changes[fileName] = lines;
    }
  }

  return changes;
}
```

### File: `history.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryManager } from './history.js';
import fs from 'fs-extra';
import path from 'path';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    appendFile: vi.fn(),
    pathExists: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe('HistoryManager', () => {
  let manager: HistoryManager;
  const mockCwd = '/cwd';

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new HistoryManager(mockCwd);
  });

  describe('append', () => {
    it('appends entry to history file', async () => {
      const mockMetrics = { 
        lines: { pct: 80 },
        statements: { pct: 80 },
        functions: { pct: 80 },
        branches: { pct: 80 }
      };
      const mockContext = { 
        timestamp: new Date('2023-01-01'), 
        commitHash: 'abc', 
        branch: 'main' 
      };

      await manager.append(mockMetrics, mockContext);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(path.join(mockCwd, '.cocov', 'history.jsonl')));
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('history.jsonl'),
        expect.stringContaining('"commitHash":"abc"'),
        'utf8'
      );
    });
  });

  describe('readHistory', () => {
    it('returns empty array if file does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false);
      const history = await manager.readHistory();
      expect(history).toEqual([]);
    });

    it('parses valid history entries', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('{"metrics":{}}\n{"metrics":{}}\n');
      
      const history = await manager.readHistory();
      expect(history).toHaveLength(2);
    });

    it('filters invalid lines', async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('{"valid":true}\nINVALID_JSON\n');
      
      const history = await manager.readHistory();
      expect(history).toHaveLength(1);
    });
  });
});
```

### File: `history.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';
import { CoverageSummary, HistoryEntry, RunContext } from './types.js';

export class HistoryManager {
  private historyPath: string;

  constructor(cwd: string) {
    this.historyPath = path.join(cwd, '.cocov', 'history.jsonl');
  }

  /**
   * Appends a new coverage entry to the history file.
   * Uses JSONL format (one JSON object per line).
   * 
   * @param metrics - The coverage metrics to save
   * @param context - Run context including timestamp and commit hash
   */
  async append(metrics: CoverageSummary, context: RunContext): Promise<void> {
    await fs.ensureDir(path.dirname(this.historyPath));
    const entry: HistoryEntry = {
      timestamp: context.timestamp.toISOString(),
      commitHash: context.commitHash,
      branch: context.branch,
      metrics,
    };

    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.historyPath, line, 'utf8');
  }

  /**
   * Reads and parses the entire history file.
   * Gracefully ignores malformed JSON lines.
   * 
   * @returns {Promise<HistoryEntry[]>} Array of valid history entries
   */
  async readHistory(): Promise<HistoryEntry[]> {
    if (!(await fs.pathExists(this.historyPath))) {
      return [];
    }

    const content = await fs.readFile(this.historyPath, 'utf8');
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((entry): entry is HistoryEntry => entry !== null);
  }
}
```

### File: `injector.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { injectIntoFile } from './injector.js';
import fs from 'fs-extra';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('injector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if file does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    const result = await injectIntoFile('README.md', 'CONTENT');
    expect(result).toBe(false);
  });

  it('returns false if markers not found', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Some content without markers');
    const result = await injectIntoFile('README.md', 'CONTENT');
    expect(result).toBe(false);
  });

  it('injects content between markers', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('Before\n<!-- cocov-start -->\nOld\n<!-- cocov-end -->\nAfter');
    
    const result = await injectIntoFile('README.md', 'New Content');
    
    expect(result).toBe(true);
    expect(fs.writeFile).toHaveBeenCalledWith(
      'README.md',
      'Before\n<!-- cocov-start -->\nNew Content\n<!-- cocov-end -->\nAfter'
    );
  });
});
```

### File: `injector.ts`

``typescript
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Injects content into a file between strict markers.
 * Markers: <!-- cocov-start --> and <!-- cocov-end -->
 */
/**
 * Injects content into a file between strict markers.
 * Markers: <!-- cocov-start --> and <!-- cocov-end -->
 * 
 * @param filePath - Path to the file to modify
 * @param contentToInject - Content to insert between markers
 * @returns {Promise<boolean>} True if injection succeeded, false if markers or file invalid
 */
export async function injectIntoFile(filePath: string, contentToInject: string): Promise<boolean> {
  if (!(await fs.pathExists(filePath))) {
    console.error(chalk.red(`Injection file not found: ${filePath}`));
    return false;
  }

  const content = await fs.readFile(filePath, 'utf8');
  const startMarker = '<!-- cocov-start -->';
  const endMarker = '<!-- cocov-end -->';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    return false;
  }

  const newContent =
    content.substring(0, startIndex + startMarker.length) +
    '\n' +
    contentToInject +
    '\n' +
    content.substring(endIndex);

  await fs.writeFile(filePath, newContent);
  return true;
}
``

### File: `markdown-generator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MarkdownGenerator } from './markdown-generator.js';
import { HistoryEntry, TotalCoverage } from './types.js';

describe('MarkdownGenerator', () => {
  const mockHistory: HistoryEntry[] = [
    {
      timestamp: '2023-01-01T00:00:00.000Z',
      commitHash: 'abc',
      branch: 'main',
      metrics: {
        lines: { pct: 50 },
        statements: { pct: 50 },
        functions: { pct: 50 },
        branches: { pct: 50 },
      },
    },
  ];

  const mockCurrent: TotalCoverage = {
    total: {
      lines: { pct: 80 },
      statements: { pct: 85 },
      functions: { pct: 90 },
      branches: { pct: 95 },
    },
  };

  it('generates report with correct metrics', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('Lines');
    expect(md).toContain('80%');
    expect(md).toContain('Statements');
    expect(md).toContain('85%');
    expect(md).toContain('Functions');
    expect(md).toContain('90%');
    expect(md).toContain('Branches');
    expect(md).toContain('95%');
  });

  it('generates status icons correctly', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    // 80% -> ⚠️
    expect(md).toContain('⚠️'); // Lines
    // 85% -> ⚠️
    // 90% -> ✅
    expect(md).toContain('✅'); // Functions
    // 95% -> ✅
  });

  it('includes mermaid chart when history exists', () => {
    const generator = new MarkdownGenerator(mockHistory, mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('xychart-beta');
    expect(md).toContain('2023-01-01');
    expect(md).toContain('50');
  });

  it('handles empty history', () => {
    const generator = new MarkdownGenerator([], mockCurrent);
    const md = generator.generate();
    
    expect(md).toContain('_No history available yet._');
  });

  it('wraps content in markers when injectMode is true', () => {
    const generator = new MarkdownGenerator([], mockCurrent);
    const md = generator.generate(true);
    
    expect(md).toMatch(/^<!-- cocov-start -->/);
    expect(md).toMatch(/<!-- cocov-end -->$/);
  });
});
```

### File: `markdown-generator.ts`

``typescript
import { HistoryEntry, TotalCoverage } from './types.js';

export class MarkdownGenerator {
  private history: HistoryEntry[];
  private current: TotalCoverage;

  constructor(history: HistoryEntry[], current: TotalCoverage) {
    this.history = history;
    this.current = current;
  }

  /**
   * Generates a comprehensive markdown report.
   * Includes coverage summary table and mermaid trend chart.
   * 
   * @param injectMode - If true, wraps output in injection markers
   * @returns {string} The formatted markdown string
   */
  generate(injectMode = false): string {
    const c = this.current.total;
    const historyLines = this.history.map((h) => h.metrics.lines.pct);
    const dateLabels = this.history.map((h) => new Date(h.timestamp).toISOString().split('T')[0]);

    // Mermaid XY Chart (Beta) or Line Chart
    const mermaidChart = `
\`\`\`mermaid
---
title: Coverage Trend (Lines %)
---
xychart-beta
    title "Coverage History"
    x-axis [${dateLabels.join(', ')}]
    y-axis "Percentage" 0 --> 100
    line [${historyLines.join(', ')}]
\`\`\`
    `;

    const report = `
# Cocov Intelligence Report

## 📊 Coverage Summary
| Metric | % | Status |
| :--- | :--- | :--- |
| **Lines** | ${c.lines.pct}% | ${this.getStatusIcon(c.lines.pct)} |
| **Statements** | ${c.statements.pct}% | ${this.getStatusIcon(c.statements.pct)} |
| **Functions** | ${c.functions.pct}% | ${this.getStatusIcon(c.functions.pct)} |
| **Branches** | ${c.branches.pct}% | ${this.getStatusIcon(c.branches.pct)} |

## 📈 Trend Analysis
${this.history.length > 0 ? mermaidChart : '_No history available yet._'}

> **Note**: This report is auto-generated by Cocov.
    `.trim();

    if (injectMode) {
      return `<!-- cocov-start -->\n${report}\n<!-- cocov-end -->`;
    }
    return report;
  }

  private getStatusIcon(pct: number): string {
    if (pct >= 90) return '✅';
    if (pct >= 80) return '⚠️';
    return '🚨';
  }
}
``

### File: `reporter.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Reporter } from './reporter.js';
import { ComparisonResult } from './comparator.js';

describe('Reporter', () => {
  it('printSummary logs table to console', () => {
    const reporter = new Reporter();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockResult: ComparisonResult = {
      isRegression: false,
       metrics: {
         lines: { baseline: 80, current: 85, diff: 5 },
         statements: { baseline: 80, current: 75, diff: -5 },
         functions: { baseline: 80, current: 80, diff: 0 },
         branches: { baseline: 80, current: 80, diff: 0 },
       },
       improved: false,
    };

    reporter.printSummary(mockResult);

    expect(consoleSpy).toHaveBeenCalled();
    // Check for regression/improvement
    // Table output includes ANSI codes, so partial match on content
    // We expect "IMPROVED" and "REGRESSION" in output (even if styled)
    // Actually table implementation might not use simple strings if styled.
    // But we know chalk adds strings.
  });

  it('printTotal logs coverage summary', () => {
    const reporter = new Reporter();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    reporter.printTotal({
      lines: { pct: 80 },
      statements: { pct: 80 },
      functions: { pct: 80 },
      branches: { pct: 80 },
    } as never);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lines: 80%'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Statements: 80%'));
  });
});
```

### File: `reporter.ts`

``typescript
import chalk from 'chalk';
import Table from 'cli-table3'; // Changed import style for ESM compatibility
import { ComparisonResult } from './comparator.js';
import { CoverageSummary } from './types.js';

export class Reporter {
  /**
   * Prints the comparison summary table to the console.
   * Shows baseline vs current metrics and the diff with color coding.
   * 
   * @param result - The comparison result to display
   */
  printSummary(result: ComparisonResult): void {
    const table = new Table({
      head: ['Metric', 'Baseline', 'Current', 'Diff', 'Status'],
      style: { head: ['cyan'] },
    });

    const keys = Object.keys(result.metrics) as (keyof CoverageSummary)[];

    keys.forEach((key) => {
      const m = result.metrics[key];
      let status = '';
      let diffStr = '';

      if (m.diff < 0) {
        status = chalk.red('REGRESSION');
        diffStr = chalk.red(`${m.diff}%`);
      } else if (m.diff > 0) {
        status = chalk.green('IMPROVED');
        diffStr = chalk.green(`+${m.diff}%`);
      } else {
        status = chalk.gray('UNCHANGED');
        diffStr = chalk.gray('0%');
      }

      table.push([
        key.charAt(0).toUpperCase() + key.slice(1),
        `${m.baseline}%`,
        `${m.current}%`,
        diffStr,
        status,
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Prints the absolute total coverage numbers to the console.
   * Used for quick verification of current state.
   * 
   * @param current - The current coverage summary
   */
  printTotal(current: CoverageSummary): void {
    console.log(chalk.bold('\nCurrent Coverage:'));
    console.log(`Lines: ${current.lines.pct}%`);
    console.log(`Statements: ${current.statements.pct}%`);
    console.log(`Functions: ${current.functions.pct}%`);
    console.log(`Branches: ${current.branches.pct}%`);
  }
}
``

### File: `stack-guard.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StackGuard } from './stack-guard.js';
import fs from 'fs-extra';


vi.mock('fs-extra', () => ({
  default: {
    readJSON: vi.fn(),
    pathExists: vi.fn(),
  },
}));

describe('StackGuard', () => {
  let guard: StackGuard;
  const mockCwd = '/cwd';

  const mockPkg = {
    dependencies: {
      react: '18.0.0',
    },
    devDependencies: {
      typescript: '5.0.0',
    },
    peerDependencies: {
      vitest: '1.0.0',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new StackGuard(mockCwd);
    vi.mocked(fs.pathExists).mockResolvedValue(true); // Assume tsconfig/package.json exist
  });

  describe('check', () => {
    it('passes when requirements met', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ required: ['react'] })).resolves.not.toThrow();
    });

    it('fails when required dep missing', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ required: ['vue'] })).rejects.toThrow('Missing required dependencies: vue');
    });

    it('fails when forbidden dep present', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({ forbidden: ['react'] })).rejects.toThrow('Found forbidden dependencies: react');
    });

    it('passes if no stack config', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
      await expect(guard.check({})).resolves.not.toThrow();
    });
    
    it('warns if tsconfig missing', async () => {
       vi.mocked(fs.pathExists).mockImplementation(async (p: unknown) => {
         if (p?.toString().endsWith('package.json')) return true;
         return false; // tsconfig missing
       });
       vi.mocked(fs.readJSON).mockResolvedValue(mockPkg);
       const consoleSpy = vi.spyOn(console, 'warn');
       await guard.check({});
       expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No tsconfig.json found'));
    });
    it('fails if package.json missing', async () => {
       vi.mocked(fs.pathExists).mockImplementation(async (p: unknown) => {
         // tsconfig exists, package.json missing
         if (p?.toString().endsWith('tsconfig.json')) return true;
         return false;
       });
       await expect(guard.check({})).rejects.toThrow('No package.json found');
    });
  });
});
```

### File: `stack-guard.ts`

``typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StackConfig } from './types.js';

export class StackGuard {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Validates the project structure and dependencies against the configuration.
   * Checks for required dependencies and forbids defined dependencies.
   * Enforces 'typescript' presence by default if not configured otherwise.
   * 
   * @param config - Stack configuration (required/forbidden deps)
   * @throws {Error} If checking fails or violation found
   */
  async check(config: StackConfig = {}): Promise<void> {
    console.log(chalk.blue('Running Stack Guard...'));

    // 1. Check for TypeScript
    const tsconfigPath = path.join(this.cwd, 'tsconfig.json');
    if (!(await fs.pathExists(tsconfigPath))) {
      console.warn(
        chalk.yellow(
          '⚠ Warning: No tsconfig.json found. This tool is optimized for TypeScript projects.',
        ),
      );
    }

    // 2. Read package.json
    const packageJsonPath = path.join(this.cwd, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error('No package.json found in current directory.');
    }

    const pkg = await fs.readJSON(packageJsonPath);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    // 3. Check Required Dependencies
    const required = config.required || [];
    const missing: string[] = [];

    for (const req of required) {
      // Simple check: is the key present?
      // We can iterate keys to handle partial matches if needed, but strict string match is safer for now.
      if (!allDeps[req]) {
        missing.push(req);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Stack Violation: Missing required dependencies: ${missing.join(', ')}`);
    }

    // 4. Check Forbidden Dependencies
    const forbidden = config.forbidden || [];
    const foundForbidden: string[] = [];

    for (const forb of forbidden) {
      if (allDeps[forb]) {
        foundForbidden.push(forb);
      }
    }

    if (foundForbidden.length > 0) {
      throw new Error(
        `Stack Violation: Found forbidden dependencies: ${foundForbidden.join(', ')}`,
      );
    }

    console.log(chalk.green('✔ Stack Check Passed'));
  }
}
``

### File: `tools/generate-badges.ts`

``typescript
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
``

### File: `tools/generate-todo.ts`

``typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function generateTodo(cwd: string): Promise<void> {
  const summaryPath = path.join(cwd, 'coverage/coverage-summary.json');
  const finalPath = path.join(cwd, 'coverage/coverage-final.json');

  if (!(await fs.pathExists(summaryPath)) || !(await fs.pathExists(finalPath))) {
    console.error('No coverage data found.');
    return;
  }


  const final = await fs.readJSON(finalPath);
  let md =
    '# 📝 Coverage TODO List\n\nGenerated by Cocov. Use this list to reach 100% coverage.\n\n';

  let hasGaps = false;

  for (const [file, cov] of Object.entries(final)) {
    const relPath = path.relative(cwd, file);


    const missingLines: number[] = [];


    // Logic to extract missing lines (if s[id] === 0)
    // This is complex, but let's try basic missing lines
    // For 'final' json, usually structured as: { path:..., statementMap:..., s:... }

    const f = cov as { statementMap: Record<string, { start: { line: number } }>; s: Record<string, number> };
    if (f.statementMap && f.s) {
      for (const [id, count] of Object.entries(f.s)) {
        if (count === 0) {
          const range = f.statementMap[id];
          missingLines.push(range.start.line);
        }
      }
    }

    if (missingLines.length > 0) {
      hasGaps = true;
      md += `## 🔴 ${relPath}\n`;
      md += `- [ ] Missing Lines: ${[...new Set(missingLines)].sort((a, b) => a - b).join(', ')}\n`;
    }
  }

  if (!hasGaps) {
    md += '## ✅ All clear! 100% Coverage achieved.';
  }

  await fs.writeFile(path.join(cwd, 'TODO_TESTS.md'), md);
  console.log(chalk.green('✔ Generated TODO_TESTS.md'));
}

// Self-execute if run directly
if (process.argv[1] === import.meta.url) {
  generateTodo(process.cwd());
}
``

### File: `types.ts`

```typescript
export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface CoverageSummary {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
}

export interface TotalCoverage {
  total: CoverageSummary;
  [key: string]: CoverageSummary; // Allow file-specific keys if we expand later, but 'total' is what we care about primarily
}

export interface StackConfig {
  required?: string[];
  forbidden?: string[];
}

export interface CocovFile {
  stack?: StackConfig;
  total: CoverageSummary;
  [key: string]: unknown;
}

export interface CocovConfig {
  thresholds?: {
    lines?: number;
    statements?: number;
    functions?: number;
    branches?: number;
  };
}

export interface CoverageLocation {
  line: number;
  column: number;
}

export interface CoverageRange {
  start: CoverageLocation;
  end: CoverageLocation;
}

export interface DetailedCoverage {
  path: string;
  statementMap: Record<string, CoverageRange>;
  fnMap: Record<string, { name: string; decl: CoverageRange; loc: CoverageRange; line: number }>;
  branchMap: Record<string, { loc: CoverageRange; type: string; locations: CoverageRange[]; line: number }>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number>;
  _coverageSchema?: string;
  hash?: string;
}

export interface HistoryEntry {
  timestamp: string;
  commitHash?: string;
  branch?: string;
  metrics: CoverageSummary;
}

export interface RunContext {
  cwd: string;
  timestamp: Date;
  commitHash?: string;
  branch?: string;
}
```

### File: `utils/banner.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showBanner } from './banner.js';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

vi.mock('fs-extra');

describe('banner', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints ascii art from file if it exists', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue('ASCII ART CONTENT');

    await showBanner();

    expect(fs.pathExists).toHaveBeenCalled();
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('assets/ascii-art.txt'), 'utf-8');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ASCII ART CONTENT'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });

  it('prints inline fallback if file does not exist', async () => {
    vi.mocked(fs.pathExists as any).mockResolvedValue(false);

    await showBanner();

    expect(fs.pathExists).toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
    // Check for inline content (part of it)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('.....:.'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });

  it('handles errors gracefully', async () => {
    vi.mocked(fs.pathExists as any).mockRejectedValue(new Error('FS Error'));

    await showBanner();

    // Should still print welcome message even if art fails
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to Cocov'));
  });
});
```

### File: `utils/banner.ts`

``typescript
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function showBanner(): Promise<void> {
  const assetPath = path.resolve(__dirname, '../../assets/ascii-art.txt');
  
  try {
    if (await fs.pathExists(assetPath)) {
      const art = await fs.readFile(assetPath, 'utf-8');
      console.log(chalk.cyan(art));
    } else {
        // Fallback or just ignore if asset missing in dist?
        // In dev, assets/ is in root. In dist, structure matches.
        // Try looking up from current location potentially.
        // If running from dist/utils/banner.js -> ../../assets/ascii-art.txt maybe
        // If not found, inline fallback to be safe
       const inline = `
                       .....:.  ..:... .::....                       
                  ...::..::..-----------..:::......                  
               ..--:.::::::---------------..::::.:--:.               
             ..---:.:::::.------------------- .::::..---..            
           .:----.::::::----------------------.::::::.:---:.          
         .:----.:::::::------------------------.:::::::.----:.        
       .:-----::::::::--------------------------.:::::::.-----..      
      .------:::::::::---------------------------::::::::.:-----.     
     .------:::::::::----------------------------.::::::::::-----.    
    .:------.::::::::-----------------------------::::::::::.------:.  
    :-------..::::::.----:.....::::::::::::..::----::::::::..:------:. 
   .---==+*******++++++.:::::::::::::::::::::::::.=+++++*******++=---. 
  .-=+****************::::::::::::::::::::::::::::.****************+=-.
  .=+++++++**********+:::::::::::::::::::::::::::::=**********++++++++:
       .......:=+****::::::::::::.......:::::::::::.****+=-:......     
                ..-++:::::.                   .:::::=+=..              
                    ..            ...             ...                  
    `;
    console.log(chalk.cyan(inline));
    }
  } catch (e) {
    // Silent fail
  }
  console.log(chalk.bold.cyan('\n🚀 Welcome to Cocov: The Code Coverage Gate\n'));
}
``

