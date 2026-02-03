import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Injects content into a file between strict markers.
 * Markers: <!-- cocov-start --> and <!-- cocov-end -->
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
