#!/usr/bin/env npx tsx
/**
 * SoMyung Content Repurpose — Blog Post Generator
 *
 * Usage:
 *   npx tsx scripts/content-repurpose/generate.ts <path-to-blog-post.md>
 *
 * Takes a Markdown blog post and generates:
 *   - 5 tweet-sized posts (< 280 chars)
 *   - 3 Threads/LinkedIn posts (500-1000 chars)
 *   - 1 newsletter excerpt (200-300 words)
 *
 * Output: scripts/content-repurpose/output/<slug>-repurposed.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  CONTENT_BANK,
  DEFAULT_HASHTAGS,
  TWEET_TEMPLATES,
  THREAD_TEMPLATES,
  type ContentSnippet,
} from "./templates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RepurposedContent {
  source: string;
  generatedAt: string;
  tweets: TweetPost[];
  threads: ThreadPost[];
  newsletter: NewsletterExcerpt;
}

interface TweetPost {
  id: number;
  text: string;
  charCount: number;
  hashtags: string[];
}

interface ThreadPost {
  id: number;
  text: string;
  charCount: number;
  hashtags: string[];
}

interface NewsletterExcerpt {
  text: string;
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Strip Markdown syntax so nothing ships with `**`, `##`, or `- ` still in it.
 *
 * Why this exists: the first version fed raw Markdown straight into tweets, so
 * real output looked like `**What works:** - Project-based learning where they`.
 * Nobody can post that. Anything the engine emits must be publishable as-is —
 * a draft that needs hand-cleaning is not a draft, it's homework.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")   // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^#{1,6}\s+/gm, "")       // headings
    .replace(/^\s*[-*+]\s+/gm, "")     // bullets
    .replace(/^\s*\d+\.\s+/gm, "")     // numbered lists
    .replace(/^\s*>\s?/gm, "")         // blockquotes
    .replace(/\*\*(.+?)\*\*/g, "$1")   // bold
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1") // italic
    .replace(/`([^`]+)`/g, "$1")       // inline code
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Is this a complete, quotable sentence — not a heading or a chopped clause? */
function isCompleteSentence(s: string): boolean {
  if (s.length < 40 || s.length > 240) return false;
  if (!/[.!?]$/.test(s)) return false;           // must actually end
  if (!/^[A-Z"'“]/.test(s)) return false;        // must actually begin
  if (/[:|]$/.test(s)) return false;             // list lead-ins
  if ((s.match(/,/g) || []).length > 4) return false; // run-on list dumps
  return true;
}

function splitSentences(text: string): string[] {
  return stripMarkdown(text)
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sentences safe to publish verbatim. Used by every blog-derived strategy. */
function extractQuotableSentences(md: string): string[] {
  return splitSentences(md).filter(isCompleteSentence);
}

function extractParagraphs(md: string): string[] {
  return md
    .split(/\n{2,}/)
    .filter((p) => !p.startsWith("![") && !p.startsWith("```"))
    // A paragraph made of bullets reads as a fragment pile once flattened.
    .filter((p) => !/^\s*[-*+]\s/m.test(p))
    .map((p) => stripMarkdown(p))
    .filter((p) => p.length > 80 && /[.!?]$/.test(p));
}

function extractHeadings(md: string): string[] {
  const headingRe = /^#{1,3}\s+(.+)$/gm;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(md))) results.push(m[1].trim());
  return results;
}

function extractKeyPhrases(md: string): string[] {
  // Pull bold and italic phrases as key ideas
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) results.push((m[1] || m[2]).trim());
  return results;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function truncateTo(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars - 3);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : maxChars - 3) + "...";
}

/**
 * Cut to a length boundary WITHOUT ending mid-thought: drop whole sentences
 * from the end until it fits. Threads were being sliced at an arbitrary
 * character and ending on "...and how to me".
 */
function trimToLastSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastEnd = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return lastEnd > 0 ? cut.slice(0, lastEnd + 1).trim() : truncateTo(text, maxChars);
}

function pickHashtags(count: number = 3): string[] {
  return pickRandom(DEFAULT_HASHTAGS, count);
}

// ---------------------------------------------------------------------------
// Tweet Generation
// ---------------------------------------------------------------------------

function generateTweets(md: string, headings: string[], keyPhrases: string[]): TweetPost[] {
  const tweets: TweetPost[] = [];
  const paragraphs = extractParagraphs(md);
  // Only whole sentences from here on. Truncating mid-thought to hit a char
  // limit produced "...conducting experiments, acting out historical events "
  // — technically under 280, unpostable in practice.
  const sentences = extractQuotableSentences(md);

  // Strategy 1: Key-phrase sentences — the bolded idea, quoted in full.
  for (const phrase of pickRandom(keyPhrases, 2)) {
    const clean = stripMarkdown(phrase);
    const context = sentences.find((s) => s.includes(clean));
    if (context && !tweets.find((t) => t.text === context)) {
      tweets.push({ id: tweets.length + 1, text: context, charCount: context.length, hashtags: pickHashtags() });
    }
  }

  // Strategy 2: Heading as hook, a whole sentence as body.
  for (const heading of pickRandom(headings, 1)) {
    const hook = stripMarkdown(heading);
    const firstWord = hook.toLowerCase().split(" ")[0];
    const relatedPara = paragraphs.find((p) => p.toLowerCase().includes(firstWord));
    const body = (relatedPara ? extractQuotableSentences(relatedPara)[0] : undefined) || sentences[0];
    if (!body) continue;
    const template = pickRandom(TWEET_TEMPLATES, 1)[0];
    const text = template.replace("{HOOK}", hook).replace("{BODY}", body);
    // Built from whole parts — if the assembled tweet is too long, drop it
    // rather than cut it. There are always bank snippets to fall back on.
    if (text.length <= 250) {
      tweets.push({ id: tweets.length + 1, text, charCount: text.length, hashtags: pickHashtags() });
    }
  }

  // Strategy 3: Content bank matches — find snippets whose keywords overlap with the blog
  const blogLower = md.toLowerCase();
  const relevant = CONTENT_BANK.filter(
    (s) =>
      s.platform.includes("twitter") &&
      s.text
        .toLowerCase()
        .split(/\s+/)
        .some(
          (word) =>
            word.length > 5 && blogLower.includes(word)
        )
  );
  for (const snippet of pickRandom(relevant.length > 0 ? relevant : CONTENT_BANK.filter((s) => s.platform.includes("twitter")), 3)) {
    // Bank snippets are hand-written and already fit. Never cut them.
    const text = snippet.text;
    if (text.length <= 250 && !tweets.find((t) => t.text === text)) {
      tweets.push({ id: tweets.length + 1, text, charCount: text.length, hashtags: pickHashtags() });
    }
  }

  // Ensure exactly 5
  while (tweets.length < 5) {
    const snippet = pickRandom(
      CONTENT_BANK.filter((s) => s.platform.includes("twitter") && !tweets.find((t) => t.text.includes(s.text.slice(0, 30)))),
      1
    )[0];
    if (snippet) {
      const text = snippet.text; // hand-written and already within limits
      if (text.length > 250) continue;
      tweets.push({ id: tweets.length + 1, text, charCount: text.length, hashtags: pickHashtags() });
    } else break;
  }

  return tweets.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Thread / LinkedIn Generation
// ---------------------------------------------------------------------------

function generateThreads(md: string, headings: string[], keyPhrases: string[]): ThreadPost[] {
  const threads: ThreadPost[] = [];
  const paragraphs = extractParagraphs(md);

  // Strategy 1: Use thread templates + blog paragraphs as body
  const templates = pickRandom(THREAD_TEMPLATES, 2);
  for (const template of templates) {
    const bodyParas = pickRandom(paragraphs, 2);
    const body = bodyParas.join("\n\n");
    let text = template.replace("{BODY}", body);
    // Ensure 500-1000 chars
    if (text.length > 1000) text = trimToLastSentence(text, 1000);
    if (text.length < 500) {
      // Pad with a CTA
      text += "\n\nUnderstanding your child's temperament changes everything.\n\nLearn more at somyung.cc";
    }
    threads.push({
      id: threads.length + 1,
      text,
      charCount: text.length,
      hashtags: [...DEFAULT_HASHTAGS],
    });
  }

  // Strategy 3: Educational build from key phrases + content bank
  const longSnippets = CONTENT_BANK.filter(
    (s) => s.platform.includes("threads") && s.text.length > 200
  );
  if (longSnippets.length > 0) {
    const snippet = pickRandom(longSnippets, 1)[0];
    let text = snippet.text;
    // Append blog-specific context
    const relevantPara = paragraphs.find((p) => p.length > 100);
    if (relevantPara) {
      text += "\n\n" + trimToLastSentence(relevantPara, 400);
    }
    while (text.length < 500) {
      // Keep appending blog paragraphs until we hit 500
      const unusedPara = paragraphs.find((p) => p.length > 80 && !text.includes(p.slice(0, 40)));
      if (unusedPara) {
        text += "\n\n" + trimToLastSentence(unusedPara, 300);
      } else {
        text += "\n\nDiscover your child's unique element balance — 518,400 profiles based on 1,000 years of Korean wisdom.\n\nTry the free preview at somyung.cc";
        break;
      }
    }
    if (text.length > 1000) text = trimToLastSentence(text, 1000);
    threads.push({
      id: threads.length + 1,
      text,
      charCount: text.length,
      hashtags: [...DEFAULT_HASHTAGS],
    });
  }

  return threads.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Newsletter Excerpt Generation
// ---------------------------------------------------------------------------

function generateNewsletter(md: string, headings: string[]): NewsletterExcerpt {
  const paragraphs = extractParagraphs(md);
  const sentences = splitSentences(md);

  // Build a 200-300 word excerpt
  const parts: string[] = [];

  // Opening hook from first heading
  if (headings.length > 0) {
    parts.push(`**${headings[0]}**`);
  }

  // Pull the strongest paragraphs (longer = more substantive)
  const ranked = [...paragraphs].sort((a, b) => b.length - a.length);
  for (const para of ranked.slice(0, 4)) {
    parts.push(para);
    const currentWords = parts.join("\n\n").split(/\s+/).length;
    if (currentWords >= 200) break;
  }

  // Closing CTA
  parts.push(
    "---\n\nWant to understand your child's unique temperament? SoMyung generates a personalized report based on Korean Saju analysis — 518,400 possible profiles, powered by AI.\n\nTry the free preview at somyung.cc"
  );

  let text = parts.join("\n\n");
  const wordCount = text.split(/\s+/).length;

  // Trim if too long — on a sentence boundary, not a word count boundary.
  if (wordCount > 350) {
    const words = text.split(/\s+/).slice(0, 300).join(" ");
    text = trimToLastSentence(words, words.length);
  }

  return { text, wordCount: text.split(/\s+/).length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/content-repurpose/generate.ts <path-to-blog-post.md>");
    console.error("");
    console.error("Example:");
    console.error("  npx tsx scripts/content-repurpose/generate.ts blog/saju-parenting-guide.md");
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(inputPath, "utf-8");
  const headings = extractHeadings(md);
  const keyPhrases = extractKeyPhrases(md);

  console.log(`Repurposing: ${path.basename(inputPath)}`);
  console.log(`  Headings found: ${headings.length}`);
  console.log(`  Key phrases found: ${keyPhrases.length}`);
  console.log(`  Paragraphs: ${extractParagraphs(md).length}`);
  console.log("");

  const tweets = generateTweets(md, headings, keyPhrases);
  const threads = generateThreads(md, headings, keyPhrases);
  const newsletter = generateNewsletter(md, headings);

  const result: RepurposedContent = {
    source: path.basename(inputPath),
    generatedAt: new Date().toISOString(),
    tweets,
    threads,
    newsletter,
  };

  // Write output
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const slug = slugify(inputPath);
  const outputPath = path.join(outputDir, `${slug}-repurposed.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  // Summary
  console.log("Generated content:");
  console.log(`  Tweets: ${tweets.length}`);
  for (const t of tweets) {
    console.log(`    [${t.charCount} chars] ${t.text.slice(0, 60)}...`);
  }
  console.log(`  Threads/LinkedIn: ${threads.length}`);
  for (const t of threads) {
    console.log(`    [${t.charCount} chars] ${t.text.slice(0, 60)}...`);
  }
  console.log(`  Newsletter: ${newsletter.wordCount} words`);
  console.log("");
  console.log(`Output: ${outputPath}`);
}

main();
