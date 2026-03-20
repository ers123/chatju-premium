import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = 'https://www.notion.so/1d96a739fb8580ef8452e02ae6b2d6f3';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[class*="notion-sub_header"]', { timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // Get detailed HTML of first few sub_header blocks
  const analysis = await page.evaluate(() => {
    const results = [];
    const blocks = document.querySelectorAll('[class*="notion-sub_header-block"]');
    blocks.forEach((block, i) => {
      if (i >= 3) return; // First 3 only
      results.push({
        outerHTML: block.outerHTML.substring(0, 2000),
        innerHTML: block.innerHTML.substring(0, 1500),
        text: block.textContent.trim(),
        blockId: block.getAttribute('data-block-id'),
        // Check for any clickable elements
        clickables: [...block.querySelectorAll('a, [role="button"], [tabindex], [onclick]')].map(el => ({
          tag: el.tagName,
          href: el.getAttribute('href'),
          role: el.getAttribute('role'),
          class: el.className?.substring?.(0, 100),
          text: el.textContent?.trim().substring(0, 50),
        })),
        // Check for toggle indicators
        hasToggle: !!block.querySelector('[class*="toggle"], [class*="triangle"], svg, [role="button"]'),
        // Check all child elements
        childTags: [...block.querySelectorAll('*')].slice(0, 20).map(el => ({
          tag: el.tagName,
          class: (el.className || '').toString().substring(0, 80),
        })),
      });
    });

    // Also check the full page for any toggles
    const allToggles = document.querySelectorAll('[class*="toggle"], [aria-expanded], details, summary');
    const toggleInfo = [...allToggles].slice(0, 10).map(el => ({
      tag: el.tagName,
      class: (el.className || '').toString().substring(0, 100),
      expanded: el.getAttribute('aria-expanded'),
      text: el.textContent?.trim().substring(0, 50),
    }));

    return { blocks: results, toggles: toggleInfo };
  });

  console.log('=== Sub-header blocks analysis ===');
  analysis.blocks.forEach((b, i) => {
    console.log(`\n--- Block ${i}: "${b.text}" (id: ${b.blockId}) ---`);
    console.log('Has toggle:', b.hasToggle);
    console.log('Clickables:', JSON.stringify(b.clickables, null, 2));
    console.log('Child tags:', b.childTags.map(c => `<${c.tag} class="${c.class}">`).join('\n  '));
  });

  console.log('\n=== All toggles found ===');
  analysis.toggles.forEach(t => console.log(JSON.stringify(t)));

  // Save the full HTML for analysis
  const fullHtml = await page.evaluate(() => {
    const content = document.querySelector('.notion-page-content');
    return content?.innerHTML?.substring(0, 20000) || 'NO CONTENT';
  });
  writeFileSync('notion-export/debug-content.html', fullHtml);

  // Take a screenshot with some waiting
  await page.screenshot({ path: 'notion-export/debug2-screenshot.png', fullPage: true });

  await browser.close();
}

main().catch(console.error);
