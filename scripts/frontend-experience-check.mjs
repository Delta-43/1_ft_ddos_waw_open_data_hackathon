// Start Vite and optionally the local backend first. No production dependency.
// Needs @playwright/test (the same dependency as design-screenshots.mjs).
// FRONTEND_URL=http://127.0.0.1:5181 node scripts/frontend-experience-check.mjs [--live]
// PLAYWRIGHT_MODULE may name an existing external installation's index.mjs.
import { readFile, mkdir } from 'node:fs/promises';
const { chromium, expect } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const fixture = JSON.parse(await readFile(new URL('../data/fixtures/route-response.json', import.meta.url), 'utf8'));
const catalogue = JSON.parse(await readFile(new URL('../data/fixtures/places-response.json', import.meta.url), 'utf8'));
const output = process.env.SCREENSHOT_DIR || '/tmp/warsaw-experience-check';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let structured=false, failure=false, payload;
 if(!process.argv.includes('--live')) {
  await page.route('**/api/places?*',r=>r.fulfill({json:catalogue}));
  await page.route('**/api/layers/**',r=>r.fulfill({json:{type:'FeatureCollection',features:[],sources:[]}}));
  await page.route('**/api/health',r=>r.fulfill({json:{capabilities:{ordered_stops:structured}}}));
  await page.route('**/api/routes',r=>{payload=r.request().postDataJSON();return failure?r.fulfill({status:503,body:'Unavailable'}):r.fulfill({json:{...fixture,...(structured?{applied_itinerary:{destination_place_id:payload.destination_place_id,via_place_ids:payload.via_place_ids}}:{})}});});
 }
 await page.goto(process.env.FRONTEND_URL || 'http://127.0.0.1:5181');
 await page.getByRole('button',{name:'Try a green museum afternoon'}).click();
 await page.getByRole('button',{name:'Find my route'}).click();
 await expect(page.getByRole('heading',{name:'Your way through Warsaw'})).toBeVisible({timeout:35000});
 await page.waitForFunction(() => window.warsawMap?.getLayer('route-line'));
 const routeColour = await page.evaluate(() => ({paint: window.warsawMap.getPaintProperty('route-line', 'line-color'), mood: getComputedStyle(document.documentElement).getPropertyValue('--mood').trim()}));
 expect(routeColour.paint).toContain(routeColour.mood);
 if (process.argv.includes('--live')) await page.waitForFunction(() => window.warsawMap?.getSource('route-buildings') && window.warsawMap.querySourceFeatures('route-buildings').length > 0);
 await page.screenshot({path:`${output}/results-light.png`});
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await page.screenshot({path:`${output}/results-dark.png`});
 await page.locator('.itinerary button').first().click();await expect(page.getByRole('complementary',{name:'Place details'})).toBeVisible();await page.getByRole('button',{name:'Close place details'}).click();
 await page.getByRole('button',{name:'Improve this place'}).click();await page.getByLabel('Your note').fill('Demo check: a bench would help.');await page.getByRole('button',{name:'Save locally'}).click();await expect(page.getByText('Saved in this browser.')).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe('warsaw-city-feedback.json');
 await page.getByRole('button',{name:/Delete note about/}).click();await expect(page.getByRole('button',{name:/Delete note about/})).toHaveCount(0);await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'Accessibility settings'}).click();await page.getByLabel('Reduce motion').check();await page.getByLabel('Increase contrast').check();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'Reset view'}).click();expect(await page.evaluate(()=>window.warsawMap.isMoving())).toBe(false);
 await page.getByRole('button',{name:'AR preview Demo'}).click();await expect(page.locator('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Your outing',exact:true}).click();await page.getByRole('button',{name:'Pick a place'}).click();await page.getByLabel('Catalogue places').selectOption({index:1});await expect(page.getByRole('button',{name:'Update routes'})).toBeDisabled();
 if(!process.argv.includes('--live')) {
  structured=true;await page.reload();await page.getByRole('button',{name:'Pick a place'}).click();await page.getByLabel('Catalogue places').selectOption({index:1});await page.getByText('Stops & extra preferences',{exact:false}).click();await page.getByLabel('Add a stop').selectOption({index:1});await page.getByLabel('Add a stop').selectOption({index:1});
  const before=await page.locator('.stop-editor li>span').allTextContents();await page.getByRole('button',{name:'Move stop 2 earlier'}).click();const after=await page.locator('.stop-editor li>span').allTextContents();expect(after[0].slice(3)).toBe(before[1].slice(3));
  await page.getByRole('button',{name:'Find my route'}).click();await expect(page.getByRole('heading',{name:'Your way through Warsaw'})).toBeVisible();expect(payload.via_place_ids).toHaveLength(2);expect(payload.destination_place_id).toBeTruthy();
  await page.getByRole('button',{name:'Your outing',exact:true}).click();failure=true;await page.getByRole('button',{name:'Update routes'}).click();await expect(page.getByRole('alert')).toContainText('503');await page.getByRole('button',{name:'Explore demo routes',exact:true}).click();
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Show more map'}).click();await page.screenshot({path:`${output}/mobile-map.png`});await page.getByRole('button',{name:'Open planner'}).click();await page.screenshot({path:`${output}/mobile-results.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 expect(errors).toEqual([]);console.log('PASS: route flow, theme, place details, feedback save/export/delete, reduced camera motion, AR, itinerary gating, mobile overflow'+(!process.argv.includes('--live')?', proposed itinerary contract and service failure.':'. Live backend checked.'));
} finally { await browser.close(); }
