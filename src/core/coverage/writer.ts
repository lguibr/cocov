
import fs from 'fs-extra';
import path from 'path';
import { CocovFile } from '@/types.js';

/**
 * Updates the baseline coverage configuration.
 * Preserves existing config and only updates coverage numbers.
 * Writes to .cocov/config.json if it exists, otherwise root cocov.json.
 * 
 * @param cwd - Current working directory
 * @param data - The new data to merge into the config
 */
export async function writeBaseline(cwd: string, data: Partial<CocovFile>): Promise<void> {
    const hiddenDir = path.join(cwd, '.cocov');
    const hiddenConfig = path.join(hiddenDir, 'config.json');
    const rootConfig = path.join(cwd, 'cocov.json');

    let targetPath = rootConfig;
    
    // Prefer .cocov if it exists or if we are setting up fresh and root doesn't exist?
    // User wants .cocov support. If .cocov dir exists, use it.
    if (await fs.pathExists(hiddenDir)) {
        targetPath = hiddenConfig;
    } else if (await fs.pathExists(rootConfig)) {
        targetPath = rootConfig;
    } else {
        // Default to .cocov for new setups if preferred, but existing init uses cocov.json.
        // Let's stick to .cocov if it exists, otherwise root.
        // Actually, if neither exists, where do we write?
        // Let's write to .cocov/config.json as strictly preferred if we force it?
        // For now, let's respect existing structure.
        // If neither exists, create .cocov/config.json?
        // Let's create .cocov directory if it doesn't exist?
        // No, init command handles file creation. run logic should update EXISTING.
        // If neither, we probably shouldn't be writing unless init.
        // But run writes baseline if none found.
        await fs.ensureDir(hiddenDir);
        targetPath = hiddenConfig;
    }

    let existing = {};
    if (await fs.pathExists(targetPath)) {
      existing = await fs.readJSON(targetPath);
    }

    const newData = { ...existing, ...data };
    await fs.writeJSON(targetPath, newData, { spaces: 2 });
}
