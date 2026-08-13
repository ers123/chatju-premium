#!/usr/bin/env npx tsx
/**
 * SoMyung Content Repurpose — Daily Content Generator
 *
 * Usage:
 *   npx tsx scripts/content-repurpose/daily-content.ts
 *   npx tsx scripts/content-repurpose/daily-content.ts --start 2026-04-01
 *   npx tsx scripts/content-repurpose/daily-content.ts --days 60
 *
 * Generates 30 days (default) of social media content from the content bank:
 *   - Daily element tips (rotate through 5 elements)
 *   - Weekly parenting insights (every Monday)
 *   - "This week in Korean astrology" (every Wednesday)
 *   - Engagement questions (every Friday)
 *   - Product mentions (every Sunday, subtle)
 *
 * Output: scripts/content-repurpose/output/daily-content.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  CONTENT_BANK,
  DEFAULT_HASHTAGS,
  ELEMENT_ROTATION,
  ELEMENT_DAILY_TIPS,
  WEEKLY_PARENTING_INSIGHTS,
  KOREAN_ASTROLOGY_WEEKLY,
  ENGAGEMENT_QUESTIONS_WEEKLY,
  type Element,
} from "./templates";
import { LOCALIZED_BANKS, weightedLength, type Locale } from "./templates.i18n";

/**
 * Which language this run writes. English uses the original bank; ko/ja use the
 * natively-authored banks in templates.i18n.ts (translated English tested worse
 * than authored copy, so nothing here is machine-translated).
 */
type Lang = "en" | Locale;
let LANG: Lang = "en";
const isLocalized = (): boolean => LANG !== "en";
const bank = () => LOCALIZED_BANKS[LANG as Locale];

/** Element names as the reader's language writes them. */
const ELEMENT_LABEL: Record<Locale, Record<Element, string>> = {
  ko: { Wood: "목(木)", Fire: "화(火)", Earth: "토(土)", Metal: "금(金)", Water: "수(水)" },
  ja: { Wood: "木", Fire: "火", Earth: "土", Metal: "金", Water: "水" },
};

const TIP_HEADER: Record<Locale, (el: string) => string> = {
  ko: (el) => `오늘의 ${el} 기질 한 줄`,
  ja: (el) => `今日の「${el}」の気質メモ`,
};

/**
 * X counts CJK as 2 units, so a 200-character Korean post is over the 280 limit
 * even though `.length` says it fits. Report the counted length the platform
 * actually uses, per language.
 */
function countFor(text: string): number {
  return isLocalized() ? weightedLength(text) : text.length;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyPost {
  platform: string;
  type: string;
  text: string;
  hashtags: string[];
  charCount: number;
}

interface DailyContent {
  date: string;
  dayOfWeek: string;
  element: Element;
  posts: DailyPost[];
}

interface DailyContentOutput {
  generatedAt: string;
  totalDays: number;
  startDate: string;
  endDate: string;
  totalPosts: number;
  lang: Lang;
  calendar: DailyContent[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Local calendar date, not UTC.
 *
 * `toISOString()` converts to UTC first, so in KST (UTC+9) local midnight on
 * Aug 13 serialized as "2026-08-12" while the weekday name — taken from
 * `getDay()`, which is local — still said Thursday. Every row in the calendar
 * was stamped a day early and disagreed with its own day name.
 */
function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function pickRandom<T>(arr: T[], n: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function pickHashtags(extra: string[] = []): string[] {
  const base = pickRandom(isLocalized() ? bank().hashtags : DEFAULT_HASHTAGS, 3);
  // English-only tags (#WoodElement, #AskParents) would strand a Korean or
  // Japanese post in the wrong feed, so localized runs keep their own set.
  return [...new Set([...base, ...(isLocalized() ? [] : extra)])];
}

// ---------------------------------------------------------------------------
// Content generators for each slot
// ---------------------------------------------------------------------------

function generateDailyElementTip(element: Element, dayIndex: number): DailyPost {
  const tips = isLocalized() ? bank().elementTips[element] : ELEMENT_DAILY_TIPS[element];
  const tip = tips[dayIndex % tips.length];
  const text = isLocalized()
    ? `${TIP_HEADER[LANG as Locale](ELEMENT_LABEL[LANG as Locale][element])}\n\n${tip}`
    : `${element} Element Tip of the Day:\n\n${tip}`;
  return {
    platform: "twitter",
    type: "element-tip",
    text,
    hashtags: pickHashtags([`#${element}Element`, "#FiveElements"]),
    charCount: countFor(text),
  };
}

function generateWeeklyParenting(weekIndex: number): DailyPost {
  const pool = isLocalized() ? bank().weeklyInsights : WEEKLY_PARENTING_INSIGHTS;
  const insight = pool[weekIndex % pool.length];
  return {
    platform: "threads",
    type: "weekly-parenting",
    text: insight,
    hashtags: pickHashtags(["#ParentingInsight"]),
    charCount: countFor(insight),
  };
}

function generateKoreanAstrologyWeekly(weekIndex: number): DailyPost {
  const pool = isLocalized() ? bank().astrologyWeekly : KOREAN_ASTROLOGY_WEEKLY;
  const fact = pool[weekIndex % pool.length];
  return {
    platform: "twitter",
    type: "korean-astrology-weekly",
    text: fact,
    hashtags: pickHashtags(["#FourPillars", "#사주"]),
    charCount: countFor(fact),
  };
}

function generateEngagementQuestion(weekIndex: number): DailyPost {
  const pool = isLocalized() ? bank().engagementQuestions : ENGAGEMENT_QUESTIONS_WEEKLY;
  const question = pool[weekIndex % pool.length];
  return {
    platform: "twitter",
    type: "engagement-question",
    text: question,
    hashtags: pickHashtags(["#AskParents"]),
    charCount: countFor(question),
  };
}

function generateProductMention(dayIndex: number = 0): DailyPost {
  let text: string;
  if (isLocalized()) {
    const b = bank();
    // Keep the product day as a normal post plus one plain CTA line — a
    // localized ad voice reads as spam in both of these feeds.
    text = `${b.bank[dayIndex % b.bank.length]}\n\n${b.cta}`;
  } else {
    const mentions = CONTENT_BANK.filter((s) => s.category === "product-mention");
    text = pickRandom(mentions, 1)[0].text;
  }
  return {
    platform: "twitter",
    type: "product-mention",
    text,
    hashtags: pickHashtags(["#SoMyung"]),
    charCount: countFor(text),
  };
}

function generateBonusPost(dayIndex: number): DailyPost {
  if (isLocalized()) {
    const b = bank();
    const text = b.bank[dayIndex % b.bank.length];
    return {
      platform: "twitter",
      type: "bonus-bank",
      text,
      hashtags: pickHashtags(),
      charCount: countFor(text),
    };
  }
  // Rotate through different content bank categories for variety
  const categories = ["stat-comparison", "myth-vs-reality", "sibling-twin", "quote"] as const;
  const category = categories[dayIndex % categories.length];
  const candidates = CONTENT_BANK.filter((s) => s.category === category && s.platform.includes("twitter"));
  const snippet = candidates.length > 0
    ? candidates[dayIndex % candidates.length]
    : pickRandom(CONTENT_BANK.filter((s) => s.platform.includes("twitter")), 1)[0];
  return {
    platform: "twitter",
    type: `bonus-${category}`,
    text: snippet.text,
    hashtags: pickHashtags(),
    charCount: snippet.text.length,
  };
}

// ---------------------------------------------------------------------------
// Main calendar builder
// ---------------------------------------------------------------------------

function buildCalendar(startDate: Date, totalDays: number): DailyContent[] {
  const calendar: DailyContent[] = [];
  let weekIndex = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const dow = date.getDay(); // 0=Sun
    const dayName = DAYS_OF_WEEK[dow];
    const element = ELEMENT_ROTATION[i % 5];

    const posts: DailyPost[] = [];

    // Every day: element tip
    posts.push(generateDailyElementTip(element, i));

    // Monday: weekly parenting insight
    if (dow === 1) {
      posts.push(generateWeeklyParenting(weekIndex));
    }

    // Wednesday: Korean astrology weekly
    if (dow === 3) {
      posts.push(generateKoreanAstrologyWeekly(weekIndex));
    }

    // Friday: engagement question
    if (dow === 5) {
      posts.push(generateEngagementQuestion(weekIndex));
      weekIndex++;
    }

    // Sunday: subtle product mention
    if (dow === 0) {
      posts.push(generateProductMention(i));
    }

    // Tuesday, Thursday, Saturday: bonus content bank post
    if (dow === 2 || dow === 4 || dow === 6) {
      posts.push(generateBonusPost(i));
    }

    calendar.push({
      date: formatDate(date),
      dayOfWeek: dayName,
      element,
      posts,
    });
  }

  return calendar;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): { startDate: Date; days: number; lang: Lang } {
  const args = process.argv.slice(2);
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let days = 30;
  let lang: Lang = "en";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang" && args[i + 1]) {
      const v = args[i + 1];
      if (v !== "en" && v !== "ko" && v !== "ja") {
        // Deliberately only three. The other seven locales have zero users.
        console.error(`Unsupported --lang: ${v} (use en, ko or ja)`);
        process.exit(1);
      }
      lang = v;
      i++;
      continue;
    }
    if (args[i] === "--start" && args[i + 1]) {
      startDate = new Date(args[i + 1]);
      if (isNaN(startDate.getTime())) {
        console.error(`Invalid date: ${args[i + 1]}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--days" && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      if (isNaN(days) || days < 1 || days > 365) {
        console.error("Days must be between 1 and 365");
        process.exit(1);
      }
      i++;
    }
  }

  return { startDate, days, lang };
}

function main() {
  const { startDate, days, lang } = parseArgs();
  LANG = lang;

  console.log(`Generating ${days} days of ${lang} content starting ${formatDate(startDate)}...`);
  console.log("");

  const calendar = buildCalendar(startDate, days);
  const totalPosts = calendar.reduce((sum, day) => sum + day.posts.length, 0);

  const output: DailyContentOutput = {
    generatedAt: new Date().toISOString(),
    totalDays: days,
    startDate: formatDate(startDate),
    endDate: formatDate(addDays(startDate, days - 1)),
    totalPosts,
    lang,
    calendar,
  };

  // Write output
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Per-language file so runs don't overwrite each other.
  const outputPath = path.join(outputDir, lang === "en" ? "daily-content.json" : `daily-content.${lang}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  // Summary
  console.log("Content calendar generated:");
  console.log(`  Days: ${days}`);
  console.log(`  Total posts: ${totalPosts}`);
  console.log(`  Avg posts/day: ${(totalPosts / days).toFixed(1)}`);
  console.log("");

  // Breakdown by type
  const typeCounts: Record<string, number> = {};
  for (const day of calendar) {
    for (const post of day.posts) {
      typeCounts[post.type] = (typeCounts[post.type] || 0) + 1;
    }
  }
  console.log("Post breakdown:");
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // A post over the platform limit is not a draft, it's a bug. Name them.
  const limit = 280;
  const overLimit = calendar.flatMap((d) =>
    d.posts.filter((p) => p.charCount > limit).map((p) => ({ date: d.date, type: p.type, n: p.charCount }))
  );
  if (overLimit.length) {
    console.log(`WARNING: ${overLimit.length} post(s) exceed ${limit} counted units:`);
    overLimit.slice(0, 10).forEach((o) => console.log(`  ${o.date} [${o.type}] ${o.n}`));
  } else {
    console.log(`All ${totalPosts} posts within ${limit} counted units${lang === "en" ? "" : " (CJK counted as 2)"}.`);
  }

  console.log("");

  // Preview first 3 days
  console.log("Preview (first 3 days):");
  for (const day of calendar.slice(0, 3)) {
    console.log(`\n  ${day.date} (${day.dayOfWeek}) — ${day.element} Element`);
    for (const post of day.posts) {
      console.log(`    [${post.type}] ${post.text.slice(0, 70)}...`);
    }
  }

  console.log(`\nOutput: ${outputPath}`);
}

main();
