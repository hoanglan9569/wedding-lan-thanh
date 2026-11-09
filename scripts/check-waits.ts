/**
 * Guard against banned Playwright waits (waitForTimeout, networkidle, isVisible) in scripts/.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const banned = new RegExp(['waitFor' + 'Timeout', 'network' + 'idle', '\\.is' + 'Visible\\s*\\('].join('|'), 'g');
const hits: string[] = [];

for (const name of readdirSync(dir)) {
  if (!name.endsWith('.ts') || name === 'check-waits.ts') continue;
  const text = readFileSync(join(dir, name), 'utf8');
  for (const [idx, line] of text.split(/\r?\n/).entries()) {
    if (banned.test(line)) hits.push(`${name}:${idx + 1}: ${line.trim()}`);
    banned.lastIndex = 0;
  }
}

if (hits.length > 0) {
  console.error('Banned Playwright waits found:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('check-waits: pass (0 banned waits)');
