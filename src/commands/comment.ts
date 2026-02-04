import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

/**
 * Posts the coverage report as a comment on the GitHub Pull Request.
 * Requires GITHUB_TOKEN and GITHUB_REPOSITORY environment variables.
 */
export async function commentAction(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = getPrNumber();

  if (!token) {
    console.error(chalk.red('❌ GITHUB_TOKEN is not set. Cannot post comment.'));
    process.exit(1);
  }

  if (!repo) {
    console.error(chalk.red('❌ GITHUB_REPOSITORY is not set.'));
    process.exit(1);
  }

  if (!prNumber) {
    console.warn(chalk.yellow('⚠ Could not determine PR number. Skipping comment.'));
    console.warn(chalk.yellow('  (This command works best in "pull_request" events)'));
    return;
  }

  const reportPath = path.resolve(process.cwd(), '.cocov/reports/summary.md');
  if (!(await fs.pathExists(reportPath))) {
    console.error(chalk.red('❌ Markdown report not found. Run "cocov markdown" first.'));
    process.exit(1);
  }

  const reportContent = await fs.readFile(reportPath, 'utf8');
  const body = `## 🚀 Cocov Report\n\n${reportContent}`;

  console.log(chalk.blue(`Posting comment to ${repo} PR #${prNumber}...`));

  try {
    await postComment(repo, prNumber, body, token);
    console.log(chalk.green('✔ Comment posted successfully!'));
  } catch (error: any) {
    console.error(chalk.red(`❌ Failed to post comment: ${error.message}`));
    process.exit(1);
  }
}

function getPrNumber(): string | undefined {
  // Best way: Getting it from GITHUB_EVENT_PATH json
  if (process.env.GITHUB_EVENT_PATH) {
    try {
      const event = fs.readJSONSync(process.env.GITHUB_EVENT_PATH);
      if (event.pull_request) {
        return String(event.pull_request.number);
      }
    } catch { 
        // ignore
    }
  }

  // Fallback: Parsing GITHUB_REF (refs/pull/123/merge)
  const ref = process.env.GITHUB_REF;
  if (ref && ref.includes('refs/pull/')) {
    const match = ref.match(/refs\/pull\/(\d+)/);
    if (match) return match[1];
  }

  return undefined;
}

async function postComment(repo: string, prNumber: string, body: string, token: string): Promise<void> {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded with ${response.status}: ${await response.text()}`);
  }
}
