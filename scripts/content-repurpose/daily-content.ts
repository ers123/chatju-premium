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
  calendar: DailyContent[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
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
  const base = pickRandom(DEFAULT_HASHTAGS, 3);
  return [...new Set([...base, ...extra])];
}

// ---------------------------------------------------------------------------
// Content generators for each slot
// ---------------------------------------------------------------------------

function generateDailyElementTip(element: Element, dayIndex: number): DailyPost {
  const tips = ELEMENT_DAILY_TIPS[element];
  const tip = tips[dayIndex % tips.length];
  const text = `${element} Element Tip of the Day:\n\n${tip}`;
  return {
    platform: "twitter",
    type: "element-tip",
    text,
    hashtags: pickHashtags([`#${element}Element`, "#FiveElements"]),
    charCount: text.length,
  };
}

function generateWeeklyParenting(weekIndex: number): DailyPost {
  const insight = WEEKLY_PARENTING_INSIGHTS[weekIndex % WEEKLY_PARENTING_INSIGHTS.length];
  return {
    platform: "threads",
    type: "weekly-parenting",
    text: insight,
    hashtags: pickHashtags(["#ParentingInsight"]),
    charCount: insight.length,
  };
}

function generateKoreanAstrologyWeekly(weekIndex: number): DailyPost {
  const fact = KOREAN_ASTROLOGY_WEEKLY[weekIndex % KOREAN_ASTROLOGY_WEEKLY.length];
  return {
    platform: "twitter",
    type: "korean-astrology-weekly",
    text: fact,
    hashtags: pickHashtags(["#FourPillars", "#사주"]),
    charCount: fact.length,
  };
}

function generateEngagementQuestion(weekIndex: number): DailyPost {
  const question = ENGAGEMENT_QUESTIONS_WEEKLY[weekIndex % ENGAGEMENT_QUESTIONS_WEEKLY.length];
  return {
    platform: "twitter",
    type: "engagement-question",
    text: question,
    hashtags: pickHashtags(["#AskParents"]),
    charCount: question.length,
  };
}

function generateProductMention(): DailyPost {
  const mentions = CONTENT_BANK.filter((s) => s.category === "product-mention");
  const snippet = pickRandom(mentions, 1)[0];
  return {
    platform: "twitter",
    type: "product-mention",
    text: snippet.text,
    hashtags: pickHashtags(["#SoMyung"]),
    charCount: snippet.text.length,
  };
}

function generateBonusPost(dayIndex: number): DailyPost {
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
      posts.push(generateProductMention());
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

function parseArgs(): { startDate: Date; days: number } {
  const args = process.argv.slice(2);
  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let days = 30;

  for (let i = 0; i < args.length; i++) {
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

  return { startDate, days };
}

function main() {
  const { startDate, days } = parseArgs();

  console.log(`Generating ${days} days of content starting ${formatDate(startDate)}...`);
  console.log("");

  const calendar = buildCalendar(startDate, days);
  const totalPosts = calendar.reduce((sum, day) => sum + day.posts.length, 0);

  const output: DailyContentOutput = {
    generatedAt: new Date().toISOString(),
    totalDays: days,
    startDate: formatDate(startDate),
    endDate: formatDate(addDays(startDate, days - 1)),
    totalPosts,
    calendar,
  };

  // Write output
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "daily-content.json");
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
