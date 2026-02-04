import { loadConfig } from 'unconfig';
import { CocovConfig } from './types.js';

export async function loadCocovConfig(cwd: string): Promise<CocovConfig> {
  const { config } = await loadConfig<CocovConfig>({
    sources: [
      {
        files: 'cocov.config',
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json'],
      },
      {
        files: 'cocov',
        extensions: ['json'],
      },
      {
        files: '.cocov/config', // Legacy support
        extensions: ['json'],
      },
      {
        files: 'package',
        extensions: ['json'],
        rewrite(config: any) {
             return config?.cocov;
        },
      },
    ],
    cwd,
    defaults: {},
  });
  return config || {};
}
