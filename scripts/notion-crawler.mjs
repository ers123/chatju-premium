import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT_URL = 'https://www.notion.so/1d96a739fb8580ef8452e02ae6b2d6f3';
const OUTPUT_DIR = join(process.cwd(), 'notion-export');
const VISITED = new Set();
const ALL_PAGES = [];

mkdirSync(OUTPUT_DIR, { recursive: true });

function sanitizeFilename(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 100);
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function expandAllToggles(page) {
  let totalExpanded = 0;
  for (let round = 0; round < 10; round++) {
    const expandedCount = await page.evaluate(() => {
      const toggleButtons = document.querySelectorAll('[aria-expanded="false"]');
      let count = 0;
      toggleButtons.forEach(btn => {
        // Skip non-toggle elements like topbar buttons
        if (btn.closest('.notion-topbar')) return;
        btn.click();
        count++;
      });
      return count;
    });
    if (expandedCount === 0) break;
    totalExpanded += expandedCount;
    await delay(2000); // Wait for content to load
  }
  return totalExpanded;
}

async function scrollFullPage(page) {
  await page.evaluate(async () => {
    const scroller = document.querySelector('.notion-scroller') || document.documentElement;
    const h = scroller.scrollHeight;
    for (let pos = 0; pos < h; pos += 500) {
      scroller.scrollTop = pos;
      await new Promise(r => setTimeout(r, 150));
    }
    scroller.scrollTop = 0;
  });
}

async function extractPageData(page) {
  return await page.evaluate(() => {
    const titleEl = document.querySelector('.notion-page-block .notranslate, h1');
    const title = titleEl?.textContent?.trim() || document.title?.replace(/ \|.*$/, '') || 'Untitled';

    // Find all links
    const childLinks = new Set();
    document.querySelectorAll('.notion-page-content a[href], .notion-scroller a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === '#main') return;
      let url = href.startsWith('/') ? 'https://www.notion.so' + href : href;
      const m = url.match(/([a-f0-9]{32})/);
      if (m) childLinks.add('https://www.notion.so/' + m[1]);
    });

    // Also scan raw HTML for page IDs in hrefs
    const contentEl = document.querySelector('.notion-page-content');
    if (contentEl) {
      const html = contentEl.innerHTML;
      // Match href="/xxxxx" patterns
      const hrefPattern = /href="\/([a-f0-9-]{32,36})"/g;
      let match;
      while ((match = hrefPattern.exec(html)) !== null) {
        const id = match[1].replace(/-/g, '');
        if (id.length === 32) childLinks.add('https://www.notion.so/' + id);
      }
      // Match full notion URLs
      const urlPattern = /notion\.so\/([a-f0-9]{32})/g;
      while ((match = urlPattern.exec(html)) !== null) {
        childLinks.add('https://www.notion.so/' + match[1]);
      }
      // Match page-slug-ID patterns (Notion uses readable slugs)
      const slugPattern = /href="\/[^"]*?([a-f0-9]{32})"/g;
      while ((match = slugPattern.exec(html)) !== null) {
        childLinks.add('https://www.notion.so/' + match[1]);
      }
    }

    // Remove self
    const selfMatch = window.location.href.match(/([a-f0-9]{32})/);
    if (selfMatch) childLinks.delete('https://www.notion.so/' + selfMatch[1]);

    // Convert to markdown
    function toMd(el) {
      if (!el) return '';
      const parts = [];
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          parts.push(node.textContent);
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const cls = node.className?.toString?.() || '';
        const tag = node.tagName?.toLowerCase();
        if (cls.includes('notion-topbar') || cls.includes('notion-overlay') || cls.includes('notion-cursor')) continue;

        if (cls.includes('notion-header-block')) {
          parts.push('\n# ' + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-sub_header-block')) {
          // These are toggle headers on this page
          const headerText = node.querySelector('h3, h2')?.textContent?.trim() || node.textContent.trim();
          parts.push('\n## ' + headerText + '\n');
          // Check if toggle has expanded content
          const toggleContent = node.querySelector('[style*="display: block"], [style*="display: flex"]');
          if (toggleContent && !toggleContent.querySelector('h3')) {
            parts.push(toMd(toggleContent));
          }
        } else if (cls.includes('notion-sub_sub_header-block')) {
          parts.push('\n### ' + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-text-block')) {
          const text = node.textContent.trim();
          if (text) parts.push('\n' + text + '\n');
        } else if (cls.includes('notion-bulleted_list-block')) {
          const text = node.textContent.trim();
          if (text) parts.push('- ' + text + '\n');
        } else if (cls.includes('notion-numbered_list-block')) {
          parts.push('1. ' + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-to_do-block')) {
          const checked = node.querySelector('[aria-checked="true"]') ? 'x' : ' ';
          parts.push(`- [${checked}] ` + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-toggle-block')) {
          const btn = node.querySelector('[role="button"]');
          const summary = btn?.textContent?.trim() || '';
          parts.push('\n**' + summary + '**\n');
          parts.push(toMd(node));
        } else if (cls.includes('notion-quote-block')) {
          parts.push('\n> ' + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-callout-block')) {
          parts.push('\n> ' + node.textContent.trim() + '\n');
        } else if (cls.includes('notion-code-block')) {
          const code = node.querySelector('code')?.textContent || node.textContent.trim();
          parts.push('\n```\n' + code + '\n```\n');
        } else if (cls.includes('notion-divider-block')) {
          parts.push('\n---\n');
        } else if (cls.includes('notion-page-block')) {
          parts.push('\n📄 **' + node.textContent.trim() + '**\n');
        } else if (cls.includes('notion-image-block')) {
          const img = node.querySelector('img');
          if (img) parts.push(`\n![image](${img.src})\n`);
        } else if (tag === 'table' || cls.includes('notion-table-block')) {
          const rows = node.querySelectorAll('tr');
          rows.forEach((row, i) => {
            const cells = [...row.querySelectorAll('td, th')].map(c => c.textContent.trim());
            parts.push('| ' + cells.join(' | ') + ' |\n');
            if (i === 0) parts.push('| ' + cells.map(() => '---').join(' | ') + ' |\n');
          });
        } else {
          // Recurse
          const inner = toMd(node);
          if (inner.trim()) parts.push(inner);
        }
      }
      return parts.join('');
    }

    const markdown = contentEl ? toMd(contentEl) : 'No content';
    return {
      title,
      markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
      childLinks: [...childLinks],
    };
  });
}

async function crawlPage(browser, url, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return;
  const idMatch = url.match(/([a-f0-9]{32})/);
  if (!idMatch) return;
  const pageId = idMatch[1];
  if (VISITED.has(pageId)) return;
  VISITED.add(pageId);

  const normalizedUrl = `https://www.notion.so/${pageId}`;
  const prefix = '  '.repeat(depth);
  console.log(`${prefix}[${VISITED.size}] ${normalizedUrl}`);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[class*="notion-page-content"], [class*="notion-text-block"], [class*="notion-sub_header"]', { timeout: 20000 }).catch(() => {});
    await delay(4000);

    // Scroll to load lazy content
    await scrollFullPage(page);
    await delay(2000);

    // Expand ALL toggles (multiple rounds)
    const expanded = await expandAllToggles(page);
    if (expanded > 0) {
      console.log(`${prefix}  Expanded ${expanded} toggles`);
      await delay(3000);
      // Scroll again after expanding
      await scrollFullPage(page);
      await delay(2000);
      // Try expanding nested toggles
      const nested = await expandAllToggles(page);
      if (nested > 0) {
        console.log(`${prefix}  Expanded ${nested} nested toggles`);
        await delay(2000);
      }
    }

    // Take a screenshot for first page
    if (VISITED.size === 1) {
      await page.screenshot({ path: join(OUTPUT_DIR, 'page1-expanded.png'), fullPage: true });
      console.log(`${prefix}  Screenshot saved`);
    }

    const data = await extractPageData(page);
    console.log(`${prefix}  "${data.title}" — ${data.markdown.length} chars, ${data.childLinks.length} child links`);
    if (data.childLinks.length > 0) {
      data.childLinks.forEach(l => console.log(`${prefix}    -> ${l}`));
    }

    ALL_PAGES.push({ id: pageId, url: normalizedUrl, title: data.title, markdown: data.markdown, depth });

    const filename = sanitizeFilename(`${String(VISITED.size).padStart(3, '0')}_${data.title}`);
    writeFileSync(join(OUTPUT_DIR, `${filename}.md`), `# ${data.title}\n\nSource: ${normalizedUrl}\n\n---\n\n${data.markdown}`);
    console.log(`${prefix}  -> ${filename}.md`);

    for (const link of data.childLinks) {
      await crawlPage(browser, link, depth + 1, maxDepth);
    }
  } catch (err) {
    console.error(`${prefix}  ERROR: ${err.message.substring(0, 150)}`);
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('=== Notion Crawler ===\n');
  const browser = await chromium.launch({ headless: true });
  try {
    await crawlPage(browser, ROOT_URL);

    let combined = '# 사주명리학 개념정리 - 전체 내용\n\n';
    combined += `> 총 ${ALL_PAGES.length}개 페이지 추출\n\n`;
    combined += '## 목차\n\n';
    ALL_PAGES.forEach((p, i) => {
      combined += `${'  '.repeat(p.depth)}- [${p.title}](#page-${i + 1})\n`;
    });
    combined += '\n---\n\n';
    ALL_PAGES.forEach((p, i) => {
      combined += `<a id="page-${i + 1}"></a>\n\n`;
      combined += `${'#'.repeat(Math.min(p.depth + 1, 4))} ${p.title}\n\n`;
      combined += `> Source: ${p.url}\n\n`;
      combined += p.markdown + '\n\n---\n\n';
    });
    writeFileSync(join(OUTPUT_DIR, '_COMBINED.md'), combined);
    console.log(`\n=== Done: ${ALL_PAGES.length} pages -> ${OUTPUT_DIR}/_COMBINED.md ===`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
