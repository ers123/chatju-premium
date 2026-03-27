# GEO Audit Report: SoMyung (소명)

**Audit Date:** 2026-03-26
**URL:** https://somyung.cc
**Business Type:** SaaS / Digital Service (AI-powered Korean Saju child temperament analysis)
**Pages Analyzed:** 4 (Homepage, /robots.txt, /sitemap.xml, /llms.txt)

---

## Executive Summary

**Overall GEO Score: 30/100 (Critical)**

SoMyung is optimized for conversion but nearly invisible to AI search engines. The site has strong product design and Korean-language content, but suffers from critical infrastructure gaps: no robots.txt, no sitemap, no llms.txt, and zero JSON-LD structured data. The i18n architecture is entirely client-side, meaning AI crawlers always see Korean-only content regardless of the 10 supported languages. Brand presence outside the website is virtually nonexistent.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 38/100 | 25% | 9.5 |
| Brand Authority | 12/100 | 20% | 2.4 |
| Content E-E-A-T | 38/100 | 20% | 7.6 |
| Technical GEO | 24/100 | 15% | 3.6 |
| Schema & Structured Data | 48/100 | 10% | 4.8 |
| Platform Optimization | 18/100 | 10% | 1.8 |
| **Overall GEO Score** | | | **29.7 → 30/100** |

---

## Critical Issues (Fix Immediately)

### 1. No sitemap.xml
- **Status:** 404 Not Found
- **Impact:** AI crawlers cannot discover any pages. This is the primary discovery mechanism for all AI platforms.
- **Fix:** Create `/frontend/public/sitemap.xml` with hreflang entries for all 10 languages.

### 2. No llms.txt
- **Status:** 404 Not Found
- **Impact:** Claude, ChatGPT, Perplexity crawlers check for this file. Absence = ambiguous permission signal.
- **Fix:** Create `/frontend/public/llms.txt` with explicit AI crawler permissions.

### 3. No robots.txt
- **Status:** 404 Not Found
- **Impact:** No explicit AI crawler signaling, no sitemap pointer, no duplicate content prevention for `?lang=` params.
- **Fix:** Create `/frontend/public/robots.txt`.

### 4. Client-Side i18n — AI Crawlers See Korean Only
- **Location:** `frontend/app/layout.tsx` — `<html lang="ko">` hardcoded
- **Impact:** All 10 languages are React state only. Server response is always Korean. AI crawlers don't run JavaScript.
- **Fix:** Path-based routing (`/en/`, `/ja/`) or SSR middleware for language detection.

### 5. og:locale Always ko_KR
- **Location:** `frontend/app/layout.tsx:18`
- **Impact:** All AI indexers classify site as Korean-only. Global markets invisible.
- **Fix:** Dynamic og:locale per language.

---

## High Priority Issues

| Issue | Location | Fix |
|---|---|---|
| FAQ answers too short (avg 40 words, need 134-167) | `frontend/app/page.tsx` FAQ section | Expand each answer |
| No FAQPage JSON-LD schema | `frontend/app/layout.tsx` | Add schema (code below) |
| No hreflang tags | `frontend/app/layout.tsx` | Add `alternates.languages` |
| No Organization schema | `frontend/app/layout.tsx` | Add JSON-LD (code below) |
| Conflicting user count (10,000+ vs 5,200+) | layout metadata vs page banner | Reconcile to single number |
| No /about page | — | Create with founder credentials |
| No author attribution | homepage | Add expert/founder bio |

---

## Medium Priority Issues

- No Product/Service schema (pricing exists, not marked up)
- No Review/AggregateRating schema (3 testimonials exist)
- Anonymous testimonials (no dates, no verification)
- `og:image` is empty (`images: []`)
- Twitter card image missing
- No educational content for non-Korean users ("What is Saju?")
- `noreply@somyung.cc` main contact email (negative trust signal)
- ?lang= params create duplicate content risk

---

## Low Priority Issues

- No BreadcrumbList schema on conversion funnel pages
- No LinkedIn company page for Harmonion
- No WebSite SearchAction schema
- Missing canonical tags on deep pages

---

## Category Deep Dives

### AI Citability — 38/100
FAQ section exists (7 questions) but answers average 40 words — less than 30% of the 134-167 word minimum for AI citation blocks. Content is single-page, conversion-focused with no deep educational pages. Client-side rendering means AI crawlers see Korean content only.

**Best opportunity:** Expand FAQ answers to 150+ words each and add FAQPage schema. This alone could push citability score to 65+.

### Brand Authority — 12/100
Zero detectable presence on Reddit, YouTube, Wikipedia, LinkedIn, or any parenting/education platform. "10,000+ parents trusted" claim is unverifiable and conflicts with "5,200+ parents" shown in the banner. Brand is essentially invisible outside somyung.cc.

**Best opportunity:** Product Hunt launch + 3–5 parenting influencer partnerships (micro, 10K–100K followers).

### Content E-E-A-T — 38/100
Business registration is disclosed (good). Legal pages exist (good). But no About page, no founder/expert credentials, no author attribution, no third-party validation, and no methodology explanation. The AI model's training basis is entirely unexplained.

**Best opportunity:** Create `/about` page with founder bio + methodology explanation. This is foundational trust.

### Technical GEO — 24/100
Three critical files missing (robots.txt, sitemap.xml, llms.txt). The `output: 'export'` in `next.config.ts` means SSR i18n is not possible without a routing change. Static export + ?lang= params = AI crawlers always index Korean.

**Best opportunity:** Create the 3 public files immediately (2–3 hours work). High impact, low effort.

### Schema & Structured Data — 48/100
No JSON-LD anywhere. Basic meta tags (og:title, og:description, Twitter card) provide partial credit, but no Organization, FAQPage, Product, or Review schema. hreflang completely absent for a 10-language site.

**Best opportunity:** Add 3 JSON-LD blocks to `layout.tsx` (Organization + WebSite + FAQPage). See code below.

### Platform Optimization — 18/100
Website is the only active channel. No social media accounts discoverable. No app store listing confirmed. No Product Hunt, no Reddit presence, no YouTube content.

**Best opportunity:** Register LinkedIn company page + create Instagram/TikTok accounts immediately (free, fast).

---

## Quick Wins (This Week)

1. **Create `/frontend/public/robots.txt`** — 30 min, allows AI crawlers explicitly (see code below)
2. **Create `/frontend/public/sitemap.xml`** — 1 hour, enables page discovery for all AI platforms
3. **Create `/frontend/public/llms.txt`** — 30 min, explicit LLM crawler permission
4. **Add Organization + FAQPage JSON-LD to `layout.tsx`** — 1 hour, immediate structured data signal
5. **Add hreflang to `layout.tsx` metadata** — 30 min, fixes multilingual SEO for all 10 markets

---

## 30-Day Action Plan

### Week 1: Infrastructure (Technical GEO 24→55)
- [ ] Create robots.txt
- [ ] Create sitemap.xml with hreflang
- [ ] Create llms.txt
- [ ] Add Organization + FAQPage + WebSite JSON-LD
- [ ] Fix og:locale to be dynamic per language
- [ ] Fix og:image (add actual image)

### Week 2: Content Depth (AI Citability 38→60)
- [ ] Expand FAQ answers to 150+ words each
- [ ] Create `/about` page with founder bio and methodology
- [ ] Add "What is Saju?" educational section to homepage
- [ ] Reconcile user count claim (10,000 vs 5,200)

### Week 3: E-E-A-T (E-E-A-T 38→60)
- [ ] Add Product/Service JSON-LD with pricing
- [ ] Add Review/AggregateRating schema
- [ ] Add verifiable testimonials (dates, names optional but add context)
- [ ] Replace noreply@ with contact email
- [ ] Register LinkedIn company page for Harmonion

### Week 4: Brand Authority (Brand 12→30)
- [ ] Launch Product Hunt
- [ ] Create Instagram + TikTok accounts
- [ ] Reach out to 5 Korean parenting micro-influencers (Tier 1: Thailand, Vietnam, Japan)
- [ ] Submit to Korean startup directories (Naver, Kakao, 크런치베이스)

---

## Code: Files to Create & Modify

### `/frontend/public/robots.txt`
```
User-agent: *
Allow: /

User-agent: anthropic-ai
Allow: /
Crawl-delay: 1

User-agent: GPTBot
Allow: /
Crawl-delay: 1

User-agent: PerplexityBot
Allow: /
Crawl-delay: 1

User-agent: ClaudeBot
Allow: /
Crawl-delay: 1

User-agent: Google-Extended
Allow: /

Disallow: /admin
Disallow: /auth
Disallow: /payment

Sitemap: https://somyung.cc/sitemap.xml
```

### `/frontend/public/llms.txt`
```
# SoMyung — AI Crawler Permissions
# Saju-based child temperament analysis service

## About
SoMyung provides AI-powered Korean Saju (Four Pillars of Destiny) analysis
for understanding children's innate temperament and learning styles.
Supported languages: ko, en, ja, zh, vi, id, es, pt, fr, th

## Permissions
Indexing: allowed
Citation: allowed
Training: allowed

## Disallow
/admin
/auth
/payment

## Contact
support@harmonyon.kr
```

### `/frontend/public/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://somyung.cc/</loc>
    <lastmod>2026-03-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="https://somyung.cc/?lang=ko"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://somyung.cc/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ja" href="https://somyung.cc/?lang=ja"/>
    <xhtml:link rel="alternate" hreflang="zh" href="https://somyung.cc/?lang=zh"/>
    <xhtml:link rel="alternate" hreflang="vi" href="https://somyung.cc/?lang=vi"/>
    <xhtml:link rel="alternate" hreflang="id" href="https://somyung.cc/?lang=id"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://somyung.cc/?lang=es"/>
    <xhtml:link rel="alternate" hreflang="pt" href="https://somyung.cc/?lang=pt"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://somyung.cc/?lang=fr"/>
    <xhtml:link rel="alternate" hreflang="th" href="https://somyung.cc/?lang=th"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://somyung.cc/"/>
  </url>
  <url>
    <loc>https://somyung.cc/privacy</loc>
    <lastmod>2026-03-26</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://somyung.cc/terms</loc>
    <lastmod>2026-03-26</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### JSON-LD to add in `frontend/app/layout.tsx`
Add inside `<head>` via a `<Script>` or inline `<script>` tag:

```json
// Organization
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://somyung.cc",
  "name": "SoMyung",
  "alternateName": "소명",
  "url": "https://somyung.cc",
  "email": "support@harmonyon.kr",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Seoul",
    "addressCountry": "KR"
  },
  "taxID": "341-15-02349",
  "knowsAbout": ["Saju", "Four Pillars of Destiny", "Korean Astrology", "Child Temperament Analysis"]
}

// FAQPage — add to page.tsx
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [/* expand each FAQ to 150+ words */]
}
```

### hreflang in `frontend/app/layout.tsx` metadata
```typescript
alternates: {
  canonical: "https://somyung.cc",
  languages: {
    "ko": "https://somyung.cc/?lang=ko",
    "en": "https://somyung.cc/?lang=en",
    "ja": "https://somyung.cc/?lang=ja",
    "zh": "https://somyung.cc/?lang=zh",
    "vi": "https://somyung.cc/?lang=vi",
    "id": "https://somyung.cc/?lang=id",
    "es": "https://somyung.cc/?lang=es",
    "pt": "https://somyung.cc/?lang=pt",
    "fr": "https://somyung.cc/?lang=fr",
    "th": "https://somyung.cc/?lang=th",
    "x-default": "https://somyung.cc"
  }
}
```

---

## Appendix: Pages Analyzed

| URL | Status | Issues Found |
|---|---|---|
| https://somyung.cc | 200 OK | No JSON-LD, Korean-only SSR, og:locale hardcoded |
| https://somyung.cc/robots.txt | 404 | MISSING |
| https://somyung.cc/sitemap.xml | 404 | MISSING |
| https://somyung.cc/llms.txt | 404 | MISSING |
| https://somyung.cc/about | 404 | MISSING |
| https://somyung.cc/?lang=en | 200 (Korean content) | SSR returns Korean regardless of lang param |
| https://somyung.cc/?lang=th | 200 (Korean content) | Same as above |

---

*GEO Audit powered by geo-seo-claude | https://github.com/zubair-trabzada/geo-seo-claude*
