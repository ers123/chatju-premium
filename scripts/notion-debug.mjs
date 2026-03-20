import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = 'https://www.notion.so/1d96a739fb8580ef8452e02ae6b2d6f3';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for content
  await page.waitForSelector('[class*="notion-"]', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 8000));

  // Take full-page screenshot
  await page.screenshot({ path: 'notion-export/debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved');

  // Dump HTML of page content area
  const html = await page.evaluate(() => {
    const content = document.querySelector('.notion-page-content');
    if (!content) return 'NO .notion-page-content FOUND\n\nAvailable classes:\n' +
      [...new Set([...document.querySelectorAll('[class*="notion"]')].map(el => el.className.split(' ').filter(c => c.includes('notion')).join(', ')))].join('\n');
    return content.innerHTML;
  });
  writeFileSync('notion-export/debug-html.html', html);
  console.log(`HTML saved (${html.length} chars)`);

  // List all links and their hrefs
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')].map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent?.trim().substring(0, 80),
      classes: a.className,
    }));
  });
  console.log(`\nAll links on page (${links.length}):`);
  links.forEach(l => console.log(`  [${l.text}] -> ${l.href}`));

  // Check for any data attributes with IDs
  const blockIds = await page.evaluate(() => {
    return [...document.querySelectorAll('[data-block-id]')].map(el => ({
      id: el.getAttribute('data-block-id'),
      class: el.className.split(' ').filter(c => c.includes('notion')).join(', '),
      text: el.textContent?.trim().substring(0, 60),
    }));
  });
  console.log(`\nBlocks with IDs (${blockIds.length}):`);
  blockIds.slice(0, 50).forEach(b => console.log(`  [${b.class}] ${b.id} "${b.text}"`));

  await browser.close();
}

main().catch(console.error);
