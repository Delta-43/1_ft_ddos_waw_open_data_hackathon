// Screenshots of the live frontend for design review: landing, then results, at desktop and phone size.
// Needs the frontend dev server on 127.0.0.1:5173 (with /api proxied to a backend) and `pnpm install` at the repo root.
//   node scripts/design-screenshots.mjs <output-dir>
import { chromium } from '@playwright/test';

const out = process.argv[2] ?? 'docs/design-review';
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => errors.push(`PAGEERROR ${String(e).slice(0, 160)}`));
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'load' });
  await page.waitForTimeout(9000); // intro animation
  await page.screenshot({ path: `${out}/${name}-landing.png` });
  await page.locator('.assistant__bubble').click();
  await page.locator('#outing-query').fill('A quiet green museum outing on foot');
  await page.getByRole('button', { name: /find routes/i }).click();
  await page.waitForTimeout(12000); // routes + map flight
  await page.screenshot({ path: `${out}/${name}-results.png` });
  console.log(name, 'console errors:', JSON.stringify(errors));
  await page.close();
}
await browser.close();
