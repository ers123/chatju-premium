# Content Repurpose Scripts

Generate social media content for SoMyung from blog posts and a pre-built content bank.

## Scripts

### 1. Blog Post Repurposer

Takes a Markdown blog post and generates platform-ready social content.

```bash
npx tsx scripts/content-repurpose/generate.ts <path-to-blog-post.md>
```

**Output:** `output/<slug>-repurposed.json` containing:
- 5 tweet-sized posts (< 280 chars each)
- 3 Threads/LinkedIn posts (500-1000 chars each)
- 1 newsletter excerpt (200-300 words)

Everything it emits is meant to be postable as-is. Blog-derived posts are built
only from complete sentences with Markdown stripped — the first version pasted
raw Markdown into tweets (`**What works:** - Project-based learning where...`)
and cut sentences mid-word to hit the character limit. Assembled posts that
don't fit are now dropped rather than truncated; there are always bank snippets
to fall back on.

### 2. Daily Content Calendar

Generates 30 days of scheduled social media content from the content bank.

```bash
# Default: 30 days starting today, English
npx tsx scripts/content-repurpose/daily-content.ts

# Korean / Japanese
npx tsx scripts/content-repurpose/daily-content.ts --lang ko
npx tsx scripts/content-repurpose/daily-content.ts --lang ja

# Custom start date
npx tsx scripts/content-repurpose/daily-content.ts --start 2026-04-01

# Custom duration (up to 365 days)
npx tsx scripts/content-repurpose/daily-content.ts --days 60
```

**Output:** `output/daily-content.json` (en), `output/daily-content.ko.json`,
`output/daily-content.ja.json` — date-keyed posts.

### Languages

`--lang` accepts `en`, `ko`, `ja` and nothing else. The other seven supported
UI locales have zero real users, so copy for them would be inventory, not reach.

ko/ja are **authored, not translated** (`templates.i18n.ts`). The two English
content sources were compared against each other: hand-written bank snippets
came out publishable, machine-sliced blog text came out as Markdown fragments.
Translating the sliced text would have carried that defect into two more
languages and stacked a translation-quality problem on top.

`charCount` for ko/ja is **weighted**: X counts CJK as 2 units, so a
200-character Korean post is over the 280 limit even though `.length` says it
fits. Each run prints a warning naming any post that exceeds the limit.

**Weekly schedule:**
| Day | Content |
|-----|---------|
| Mon | Element tip + Weekly parenting insight |
| Tue | Element tip + Bonus content bank post |
| Wed | Element tip + Korean astrology weekly |
| Thu | Element tip + Bonus content bank post |
| Fri | Element tip + Engagement question |
| Sat | Element tip + Bonus content bank post |
| Sun | Element tip + Product mention (subtle) |

## Content Bank

`templates.ts` contains 50+ pre-written snippets across these categories:

- **stat-comparison** — The 518,400 vs 12/16 comparison
- **element-tip** — Tips for each of the 5 elements (Wood, Fire, Earth, Metal, Water)
- **parent-tip** — Actionable parenting advice per element
- **myth-vs-reality** — Saju misconceptions corrected
- **quote** — Inspirational quotes about understanding children
- **engagement-question** — Polls and discussion starters
- **sibling-twin** — Why siblings/twins differ
- **korean-astrology-fact** — Educational facts about Saju
- **product-mention** — Subtle SoMyung references with CTA

## Tone Guidelines

- **Tweets:** Punchy, provocative, hook-first
- **Threads:** Educational, storytelling, relatable parent scenarios
- **Never say** "fortune-telling" — use "temperament analysis" or "personality mapping"
- **Hashtags:** #KoreanAstrology #Saju #ParentingTips #ChildTemperament #KWave

## Output Format

All output is JSON. Example tweet entry:

```json
{
  "id": 1,
  "text": "MBTI gives you 1 of 16 labels.\n\nSaju gives you 1 of 518,400 unique profiles.\n\nYour child is not a type. They're one of a kind.",
  "charCount": 124,
  "hashtags": ["#KoreanAstrology", "#Saju", "#ParentingTips"]
}
```

## Adding Content

Edit `templates.ts` to add new snippets to `CONTENT_BANK`, element tips to `ELEMENT_DAILY_TIPS`, or weekly content to the respective arrays.
