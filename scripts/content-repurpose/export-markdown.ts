#!/usr/bin/env npx tsx
/**
 * SoMyung Content Repurpose — Markdown export.
 *
 * Why: the generators emit JSON, which is right for machines and wrong for the
 * person who actually has to post. This turns a calendar into something you can
 * open, read top to bottom, and copy a post out of without editing anything.
 *
 * Usage:
 *   npx tsx scripts/content-repurpose/export-markdown.ts            # all languages found
 *   npx tsx scripts/content-repurpose/export-markdown.ts --lang ko
 *
 * Output: output/calendar-<lang>.md
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT = path.join(__dirname, "output");

interface Post { platform: string; type: string; text: string; hashtags: string[]; charCount: number }
interface Day { date: string; dayOfWeek: string; element: string; posts: Post[] }
interface Calendar { generatedAt: string; totalDays: number; startDate: string; endDate: string; totalPosts: number; lang?: string; calendar: Day[] }

const HEADINGS: Record<string, { title: string; note: string; copy: string }> = {
  en: {
    title: "SoMyung — Social Content Calendar",
    note: "Each block is one post, ready as-is. Hashtags are suggestions; drop any that don't fit the platform.",
    copy: "copy below",
  },
  ko: {
    title: "소명 — 소셜 콘텐츠 캘린더",
    note: "블록 하나가 게시물 하나입니다. 그대로 올려도 됩니다. 해시태그는 제안이니 안 맞으면 빼세요.",
    copy: "아래 그대로 복사",
  },
  ja: {
    title: "SoMyung — ソーシャル投稿カレンダー",
    note: "1ブロックが1投稿です。そのまま投稿できます。ハッシュタグは提案なので、合わなければ外してください。",
    copy: "以下をそのままコピー",
  },
};

function render(cal: Calendar, lang: string): string {
  const h = HEADINGS[lang] || HEADINGS.en;
  const L: string[] = [];
  L.push(`# ${h.title} (${lang})`);
  L.push("");
  L.push(`${cal.startDate} → ${cal.endDate} · ${cal.totalDays} days · ${cal.totalPosts} posts`);
  L.push("");
  L.push(`> ${h.note}`);
  if (lang !== "en") {
    L.push(">");
    L.push("> Character counts are weighted for X (CJK counts as 2 units against the 280 limit).");
  }
  L.push("");

  for (const day of cal.calendar) {
    L.push(`## ${day.date} (${day.dayOfWeek}) — ${day.element}`);
    L.push("");
    for (const post of day.posts) {
      L.push(`**${post.type}** · ${post.platform} · ${post.charCount} units — ${h.copy}:`);
      L.push("");
      // Fenced so Markdown never reflows the line breaks the post depends on.
      L.push("```");
      L.push(post.text);
      L.push("");
      L.push(post.hashtags.join(" "));
      L.push("```");
      L.push("");
    }
  }
  return L.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const langArg = args.indexOf("--lang") >= 0 ? args[args.indexOf("--lang") + 1] : null;

  const candidates: Array<[string, string]> = [
    ["en", path.join(OUT, "daily-content.json")],
    ["ko", path.join(OUT, "daily-content.ko.json")],
    ["ja", path.join(OUT, "daily-content.ja.json")],
  ].filter(([l]) => !langArg || l === langArg) as Array<[string, string]>;

  let wrote = 0;
  for (const [lang, file] of candidates) {
    if (!fs.existsSync(file)) {
      console.log(`skip ${lang}: ${path.basename(file)} not generated yet`);
      continue;
    }
    const cal: Calendar = JSON.parse(fs.readFileSync(file, "utf-8"));
    const dest = path.join(OUT, `calendar-${lang}.md`);
    fs.writeFileSync(dest, render(cal, lang), "utf-8");
    console.log(`${lang}: ${cal.totalPosts} posts → ${dest}`);
    wrote++;
  }
  if (!wrote) {
    console.error("Nothing exported. Run daily-content.ts first.");
    process.exit(1);
  }
}

main();
