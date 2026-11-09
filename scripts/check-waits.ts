/**
 * Guard against banned Playwright waits and enforce Playwright rules in scripts/.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatFinding, lintTree } from './playwright-lint';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');

const findings = lintTree(root, ['scripts'], {
  skipFiles: ['scripts/playwright-lint.ts'],
  sleepAllowed: ['scripts/retry.ts'],
});

if (findings.length > 0) {
  console.error('Playwright lint findings:');
  for (const f of findings) {
    console.error(formatFinding(f));
  }
  console.error(`${findings.length} finding(s)`);
  process.exit(1);
}

console.log('check-waits: pass (0 findings)');
