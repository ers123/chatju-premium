# GEO Audit Report: SoMyung (somyung.cc)

**Audit Date:** 2026-08-31
**URL:** https://somyung.cc
**Business Type:** Hybrid — SaaS-like productized service (one-time purchase) + Publisher (18-post blog)
**Pages Analyzed:** 78 built pages (34 in sitemap), 10 locales
**Branch:** `redesign/doorframe`

---

## Executive Summary

**Overall GEO Score: 40/100 (Poor) → 49/100 (Poor) after this session's fixes**

SoMyung's on-site fundamentals were better than the score suggests — rich JSON-LD, explicit AI-crawler permissions, `llms.txt`, 10-locale hreflang, real credentials. But four defects were silently cancelling that work: every blog post and localized sub-page declared a *homepage* canonical, the site's single most quotable statistic rendered as `0` in HTML, social/AI titles were truncated mid-sentence, and the AI-facing `llms.txt` published a price 4x below the real one.

All four are now fixed and verified. What the fixes cannot touch is the real ceiling: **SoMyung has effectively zero third-party footprint.** Brand Authority + Platform Optimization are 30% of the GEO score and both score near zero. No amount of on-site markup makes an AI cite an entity that no independent source has ever mentioned.

### Score Breakdown

| Category | Weight | Before | After fixes | Weighted (after) |
|---|---|---|---|---|
| AI Citability | 25% | 57 | 62 | 15.5 |
| Brand Authority | 20% | 8 | 8 | 1.6 |
| Content E-E-A-T | 20% | 55 | 57 | 11.4 |
| Technical GEO | 15% | 45 | 78 | 11.7 |
| Schema & Structured Data | 10% | 62 | 78 | 7.8 |
| Platform Optimization | 10% | 5 | 5 | 0.5 |
| **Overall** | | **40** | | **48.5 → 49** |

---

## Critical Issues

### C1. 65 pages canonicalized to a homepage — FIXED (49 of 65)
`app/(app)/layout.tsx:47` hardcoded `canonical: "https://somyung.cc/ko/"`. Every route without its own canonical inherited it.

Affected: all 18 blog posts, `/blog/`, and 30 localized `/about` `/privacy` `/terms` pages (each pointing at its language homepage). This tells Google and AI crawlers the entire content surface is duplicate content and must not be indexed independently.

**Verified live before fix:**
```
https://somyung.cc/blog/wood-element-child/  →  <link rel="canonical" href="https://somyung.cc/ko/">
```
**Fix:** added `generateMetadata` with a self-referential canonical to the blog post route, blog index, and the three localized sub-pages. Wrong canonicals: **65 → 16**.

The remaining 16 are app/utility routes (`/auth/*`, `/payment/*`, `/admin/settings`, `/saju/input`, `/chat`, `/report/pdf`) — these should carry `robots: noindex` rather than a canonical. Tracked as H4 below.

### C2. The site's most quotable number rendered as `0` — FIXED
`useAnimatedCounter` in `components/landing/LandingContent.tsx` used `useState(0)`, so server-rendered HTML contained a literal `0`:
```html
<p ...>0</p><p ...>Saju combinations</p>
```
`grep -c '518,400' out/en/index.html` → **0**, on all 10 locales. Every crawler, AI model, and no-JS visitor saw "0 Saju combinations" and "0x more precise".

**Fix:** counter seeds with the real target and resets to 0 in a client layout effect (before paint, so the animation is unchanged), and skips the reset entirely when `IntersectionObserver` is absent or `prefers-reduced-motion` is set. Verified: `518,400` and `32,400` now present in all 10 locale HTML files.

---

## High Priority

### H1. `llms.txt` published a 4x-wrong price — FIXED
The one file written specifically for AI stated `Premium report $4.99`; the real price is $19.99 (raised 2026-08-13). A factual contradiction in the AI-facing file poisons trust in everything else it asserts. Replaced with the full per-market table, including `ko: paid checkout unavailable`.

### H2. og:title / twitter:title truncated mid-sentence — FIXED
`metadata.ts` built social titles from `t.hero.title1` alone — the *first fragment* of a three-part headline. Live output: `SoMyung | Struggling to`. It also dropped `title2`, which left Spanish with an unclosed `¿` and Chinese without its `？`.

Additionally, CJK/Thai were joined with a space (`お子様との コミュニケーション`). Fixed with a spaceless-language join set. All 10 locales now emit complete, correctly punctuated sentences.

### H3. Blog posts had no Article schema and carried the homepage's sales FAQ — FIXED
All 18 posts shipped `Organization + WebSite + FAQPage + Product` — the homepage's product-sales graph — and zero `Article`/`BlogPosting`. No `datePublished`, no `author`, no `headline`. Shipping an identical 7-question sales FAQ across 18 unrelated articles is worse than shipping none: it signals duplicate markup and tells a model the page is a sales page.

**Fix:** per-post `BlogPosting` with `headline`, `datePublished`, `dateModified`, `keywords`, and `author` (SungHa + credential), plus `og:type=article` and `article:published_time`. Verified 18/18.

*Not fixed:* the inherited homepage `FAQPage`/`Product` graph still renders on blog posts. It comes from the shared `(app)` layout. Recommend scoping that graph to the landing route only.

### H4. Utility routes are indexable
`/auth/signin`, `/auth/signup`, `/auth/callback`, `/payment/`, `/payment/success`, `/payment/fail`, `/admin/settings`, `/report/pdf`, `/saju/results` all return `robots: index, follow` from the root layout. `robots.txt` disallows some, but the meta tag contradicts it. Add explicit `robots: { index: false }` to these routes.

### H5. All 10 localized `/about` pages are missing from sitemap.xml
Only the Korean `/about` is listed. `/about` is the E-E-A-T page — the one carrying 명리심리상담사 1급 and the MS — and it is the page an AI most needs to resolve "who is behind this". 44 built pages are absent from the sitemap overall.

---

## Medium Priority

### M1. `sameAs` contains no third-party profiles
```json
"sameAs": ["https://somyung.cc", "mailto:support@somyung.cc"]
```
`sameAs` exists to *disambiguate an entity against external references*. Self-URL and a mailto do nothing. This is the schema field that most directly addresses the name-collision problem in B1.

### M2. Blog is English-only on a 10-locale site
`/ko/blog/`, `/ja/blog/` → 404. No hreflang on any post. Content citability in 9 of 10 markets is ~0 — including Korean and Japanese, where "사주 아이 기질" / "四柱推命 子供 性格" have actual volume and where the founder's credential carries most weight.

### M3. `Product` has 3 `Review` nodes but no `aggregateRating`
The site collects real star ratings (rating widget live since 2026-08-13) but publishes none of them as `aggregateRating`. Also verify the three embedded reviews are genuine customer text — self-authored reviews in Product schema violate Google's structured-data policy.

### M4. Founder home address published in structured data
```json
"address": {"streetAddress": "197 Seoun-ro, 106-dong 804-ho, Seocho-gu", ...}
```
`106-dong 804-ho` is an apartment unit — a residential address, for a solo founder and parent of three, in machine-readable markup on every page. Korean e-commerce disclosure requires a business address be *available*; it does not require it in JSON-LD on every page. Consider a virtual office or restricting it to the legal-notice page.

### M5. Answer-first rewriting
Headings are slogans ("Sound familiar?", "How does it help?") rather than questions, and posts open with scenes rather than definitions. The site already demonstrates the right pattern — `birth-time-personality-science`'s explicit DOES / DOES NOT list is the most quotable block on the site. Propagate it.

### M6. Study citations lack authors/titles/DOIs
`"A 2012 study in Comprehensive Psychiatry found..."` — models are trained to distrust exactly this shape. Full citations, plus an explicit hedge about what the study does *not* show, raise citability rather than lower it.

---

## Low Priority

- **L1.** Blog `BlogPosting.inLanguage` hardcoded `'en'` — correct today, revisit when M2 lands.
- **L2.** Root `/privacy`, `/terms`, `/refund` still canonicalize to `/ko/` (duplicates of `/ko/*` — pick one).
- **L3.** `og:locale` on the `(app)` root layout is hardcoded `ko_KR` for all non-i18n routes including the English blog.
- **L4.** `saju-vs-mbti` claims "32,400 times more precise" — combination count is not precision. A model will flag this rather than quote it.

---

## Category Deep Dives

### AI Citability (57 → 62)
Content quality is genuinely above average for content marketing: specific, numerate, and unusually honest — the birth-time post opens by conceding the skeptic's case. Strongest pages: `birth-time-personality-science` (74), `what-is-korean-saju` (71), `twins-different-personality-saju` (68). Weakest: `k-astrology-trend-2026` (41, trend-piece marketing), `wood-element-child` (55, anecdote-first with no definitional sentence).

The gap was never the writing — it was delivery: broken canonicals, missing Article schema, and the `0` statistic. Those are fixed. What remains is structural (answer-first headings, real citations, multilingual content).

### Brand Authority (8) — the binding constraint
Across 11 searches (English web, Korean web, Naver blog/cafe, npm, GitHub): **not one independent mention** of somyung.cc, the brand, or the founder. No review, listicle, forum post, or directory entry.

Compounding it, the name is severely ambiguous. "소명" is a common Korean noun (*calling/vocation*) and a common given name. Competing entities with far stronger signals already own the string: Somyung Co. (manufacturer, PitchBook profile), two Somyung churches (`somyung.net`, `.org`), and — worst — **Gil Somyung (길소명)**, a webtoon character with Namu Wiki, Fandom, TV Tropes and Personality-Database pages, described in exactly this product's vocabulary (personality, temperament, mother-child relationship). Asked about "SoMyung child temperament" today, models return the webtoon character.

The one distribution asset is broken: `somyung-saju-mcp@1.0.0` on npm points to `github.com/somyung/mcp-server`, which **404s**, and it is absent from Smithery and Glama — the registries AI agents actually query.

> ⚠️ The research agent also reported that `site:somyung.cc` returns nothing, i.e. the domain may be unindexed. I could not independently confirm this — it may reflect the search backend rather than Google itself. **Check Google Search Console directly before acting on it.** Given C1 shipped a homepage canonical across the whole content surface, genuine under-indexing is plausible.

### Content E-E-A-T (55 → 57)
Strong and unusually legible credentials: 명리심리상담사 1급, MS in Decision Making & Applied Analytics, parent of three, all present in `Organization.founder.hasCredential`. `/en/about` is properly localized (an earlier report that it rendered Korean headings was wrong — that was `/about`, the Korean default route; verified `/en/about` renders "Why SoMyung Exists / The Methodology / Credentials").

The weakness is corroboration, not claims: every credential is first-party and unverifiable. No LinkedIn, no bylines, no external profile. Blog posts had no author markup until this session.

### Technical GEO (45 → 78)
`robots.txt` is genuinely excellent — GPTBot, ClaudeBot, PerplexityBot, CCBot, Google-Extended, ChatGPT-User all explicitly allowed with crawl-delay. `llms.txt` present. Sitemap present. 10-locale hreflang with x-default. Static export = no JS-rendering barrier.

The score was held down entirely by C1 (canonicals) and C2 (the `0`), both now fixed. Remaining: H4 (noindex on utility routes), H5 (sitemap coverage).

### Schema & Structured Data (62 → 78)
Above average. `@graph` with `Organization` (founder + `hasCredential`), `WebSite`, `FAQPage` (7 Q&A), `Product` with correct `19.99` `Offer`, plus a `WebPage` node with `speakable` and `breadcrumb`. `BlogPosting` now added across 18 posts. Gaps: M1 (`sameAs`), M3 (`aggregateRating`), H3-remainder (sales FAQ leaking onto articles), M4 (home address).

### Platform Optimization (5)
Zero presence on Wikipedia/Wikidata, Reddit, YouTube, LinkedIn, X, Threads, Product Hunt, Naver blog/cafe. npm package exists but is undiscoverable and has a dead repo link.

Notably, **the niche is uncontested.** Competitors that AI does cite — sajugpt.net, sajumuse.com, seoulsaju.com, k-mudang.com — are all adult self-readings: love, career, wealth, daily fortune. None own child temperament / parenting. The positioning is defensible; there is simply no citable footprint to claim it with.

---

## Quick Wins

1. ~~Fix the homepage canonical on 49 content pages~~ — **done**
2. ~~Server-render 518,400 / 32,400~~ — **done**
3. ~~Correct `llms.txt` pricing~~ — **done**
4. ~~Complete og/twitter titles across 10 locales~~ — **done**
5. ~~Add `BlogPosting` schema to 18 posts~~ — **done**
6. **Fix the npm package's 404 GitHub link and list it on Smithery + Glama.** Same-day. Creates a real third-party page carrying the brand name next to the exact phrase "child temperament analysis," on registries AI agents read directly. Highest off-site ROI available.
7. **Add the 10 localized `/about` pages to sitemap.xml.**
8. **Populate `sameAs`** with every profile that exists, and create the missing ones.

## 30-Day Action Plan

### Week 1 — Stop the bleeding (mostly done)
- [x] Self-referential canonicals on all content pages
- [x] Server-rendered statistics
- [x] `llms.txt` price correction
- [x] Complete social titles, `BlogPosting` schema
- [ ] Verify indexing in Google Search Console — submit sitemap, request re-index of `/blog/*`
- [ ] `robots: noindex` on `/auth/*`, `/payment/*`, `/admin/*`, `/report/pdf`
- [ ] Add localized `/about` pages to sitemap

### Week 2 — Become a findable entity
- [ ] Fix `somyung-saju-mcp` repo link; publish the GitHub repo publicly
- [ ] Submit to Smithery, Glama, and MCP registries
- [ ] Create founder LinkedIn tying SungHa → SoMyung → the credential
- [ ] Populate `sameAs` with all of the above
- [ ] Adopt a disambiguated name string everywhere: never bare "SoMyung", always "SoMyung — Korean Saju child temperament reports"

### Week 3 — Earn third-party mentions
- [ ] Pitch tool-review sites (toolspedia.io reviewed a direct competitor)
- [ ] Target "best saju site" roundups
- [ ] Naver blog/cafe presence — the largest gap in the home market
- [ ] Add `aggregateRating` from the live rating widget

### Week 4 — Content leverage
- [ ] Translate the 5 strongest posts into ko + ja with hreflang
- [ ] Rewrite H2s as questions; add answer-first opening sentences
- [ ] Upgrade study citations to full author/title/journal/DOI + explicit hedges
- [ ] Scope the homepage `FAQPage`/`Product` graph off blog routes; add per-post FAQ

---

## Note on Methodology

Findings were verified against both the local build (`out/`) and the live site. Two agent-reported findings were checked and corrected:

- **"English `/about` renders Korean headings"** — false. The agent fetched `/about` (the Korean default route). `/en/about` is correctly localized.
- **"Domain is unindexed"** — unconfirmed; may be a search-backend artifact. Verify in Search Console.

The counter animation (C2) could not be visually confirmed: the browser pane runs `document.visibilityState: "hidden"`, which suspends `IntersectionObserver` and `requestAnimationFrame`. Production exhibits identical behavior under the same harness, confirming no regression. **The scroll animation should be eyeballed in a real browser before deploy.**
