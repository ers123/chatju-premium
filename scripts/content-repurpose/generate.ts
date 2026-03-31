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

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractParagraphs(md: string): string[] {
  return md
    .split(/\n{2,}/)
    .map((p) => p.replace(/^#+\s+/gm, "").trim())
    .filter((p) => p.length > 40 && !p.startsWith("![") && !p.startsWith("```"));
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

function pickHashtags(count: number = 3): string[] {
  return pickRandom(DEFAULT_HASHTAGS, count);
}

// ---------------------------------------------------------------------------
// Tweet Generation
// ---------------------------------------------------------------------------

function generateTweets(md: string, headings: string[], keyPhrases: string[]): TweetPost[] {
  const tweets: TweetPost[] = [];
  const paragraphs = extractParagraphs(md);
  const sentences = splitSentences(md);

  // Strategy 1: Key phrase hooks from blog
  for (const phrase of pickRandom(keyPhrases, 2)) {
    const context = sentences.find((s) => s.includes(phrase));
    if (context) {
      const text = truncateTo(context, 250);
      tweets.push({ id: tweets.length + 1, text, charCount: text.length, hashtags: pickHashtags() });
    }
  }

  // Strategy 2: Heading-based hooks
  for (const heading of pickRandom(headings, 1)) {
    const relatedPara = paragraphs.find((p) => p.toLowerCase().includes(heading.toLowerCase().split(" ")[0]));
    const body = relatedPara ? splitSentences(relatedPara)[0] : sentences[0];
    const template = pickRandom(TWEET_TEMPLATES, 1)[0];
    const text = truncateTo(template.replace("{HOOK}", heading).replace("{BODY}", body || ""), 250);
    tweets.push({ id: tweets.length + 1, text, charCount: text.length, hashtags: pickHashtags() });
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
    const text = truncateTo(snippet.text, 250);
    if (!tweets.find((t) => t.text === text)) {
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
      const text = truncateTo(snippet.text, 250);
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
    if (text.length > 1000) text = truncateTo(text, 1000);
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
      text += "\n\n" + truncateTo(relevantPara, 400);
    }
    while (text.length < 500) {
      // Keep appending blog paragraphs until we hit 500
      const unusedPara = paragraphs.find((p) => p.length > 80 && !text.includes(p.slice(0, 40)));
      if (unusedPara) {
        text += "\n\n" + truncateTo(unusedPara, 300);
      } else {
        text += "\n\nDiscover your child's unique element balance — 518,400 profiles based on 1,000 years of Korean wisdom.\n\nTry the free preview at somyung.cc";
        break;
      }
    }
    if (text.length > 1000) text = truncateTo(text, 1000);
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

  // Trim if too long
  if (wordCount > 350) {
    const words = text.split(/\s+/).slice(0, 300);
    text = words.join(" ") + "...";
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
