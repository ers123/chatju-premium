# SoMyung — Launch Readiness Progress

> Branch: `codex/somyung-launch-ready` · Last updated: **2026-06-25**
> Live: backend on AWS Lambda (`*.lambda-url.ap-northeast-2.on.aws`), frontend on Cloudflare Pages (somyung.cc).

---

## Status at a glance

| Area | State |
|---|---|
| Security (IDOR / admin / headers / deps) | ✅ Fixed + independently re-verified |
| 만세력 accuracy (KST + foreign TZ + unknown time) | ✅ Fixed + verified (60/60 backend tests) |
| Privacy/legal copy (GDPR/COPPA/CCPA/PIPA, 10 langs) | ✅ In place; ⚠️ lawyer review still required |
| Guardian consent (the central minor-data fix) | ✅ Fixed + live-verified |
| UX criticals (DOB, PPP pricing, KR gating, i18n errors) | ✅ Fixed |
| Production wiring (Lambda env, Pages branch, API URL) | ✅ Fixed (incl. localhost-build regression) |
| Full premium report **render** eyeball-check | ⏳ Not yet verified end-to-end in browser |
| Lawyer review (SCC, ToS, disclaimers) | ⏳ Required before scaling EU/US |

**Bottom line:** engineering blockers are closed and deployed. Remaining items are (1) one clean end-to-end browser run to see a report+PDF render, and (2) non-code legal review.

---

## Done (commit history, newest first)

| Commit | What |
|---|---|
| `56873ee` | **Guardian consent CRITICAL fix** — real "I am the child's parent/legal guardian" checkbox (10 langs) now drives `consent.guardian` (was mis-mapped to a "14+" self-attestation); 14+ stored separately as `userAge14`; backend records client IP + language; `/saju/calculate-promo` now REQUIRES consent (was optional → child PII could be stored with no consent). Copy: "unknown time → omit hour pillar" (10 langs); KR banner no longer shows US$4.99. |
| `43b8c80` | **Prod API URL repair** — built frontend was calling `localhost:3000` (`.env.local` shadowed `.env.production` at build time); moved dev URLs to `.env.development`. Also: results page crash when birth time unknown (hour pillar omitted), 429 rate-limit shown as proper "free preview limit" message (10 langs), CSP `connect-src` missing Lambda URL + GA. |
| `9d5b545` | CPO (개인정보보호책임자) name designated in privacy policy, all 10 languages (PIPA Art.31). |
| `28e7fa0` | De-duplicated fortune-cycle keywords/advice/descriptions (same stem/branch ten-god produced doubled text). |
| `778999d` | Lambda deploy fix — native `useDotenv`, corrected env var names (`SUPABASE_SERVICE_KEY`, `FRONTEND_URL`). |
| `83c005b` | PPP per-locale pricing, KR PayPal gating → free/promo, a11y labels, `public/_headers` CSP, client claim-key polling. |
| `6ca5f7d` | **Security** — closed unauthenticated report IDOR (emailed-OTP + client claim-key), admin role gate (fail-closed), dedicated `ACCESS_TOKEN_SECRET`, atomic promo counter, consent persistence. |
| `d40127e` | 만세력 — correct Four Pillars for non-KST births (UTC solar-term frame) + unknown-time handling. |

### Verification evidence
- Backend: **60/60 Jest tests pass.**
- Frontend: `tsc --noEmit` clean, production build clean, **zero `localhost:3000` refs** in bundle.
- IDOR: live-attacked on prod — both vectors return `400 MISSING_OTP`; garbage claim → no leak.
- Foreign TZ: New York 2024-02-04 05:00 → 갑진/병인 (correct, not the old buggy 계묘/을축).
- Consent: live `/saju/calculate-promo` returns `400 CONSENT_REQUIRED` without consent or with `guardian:false`.
- PDF: live download returns `200 application/pdf` with a valid token; `401` without.
- Browser QA (somyung.cc): 5-step input flow, DOB accepts 2026 births, consent boxes default-unchecked, guardian copy live.

---

## Remaining before public launch

### Engineering (small)
- [ ] **One clean end-to-end browser run** from a fresh IP: input → free preview → promo (TEST2026) → premium report → PDF, eyeballing the actual report render. (Previously blocked by self-inflicted preview rate-limit, 10/hr/IP.)
- [ ] Minor: page `<title>` is English while body is Korean on funnel pages (SSR `lang` mismatch) — cosmetic/SEO.

### Legal (lawyer required — NOT code)
- [ ] **SCC truthfulness** — policy claims EU-Commission-approved Standard Contractual Clauses, but a KR sole proprietor likely has no executed DPAs / no GDPR Art.27 EU representative. Either sign processor DPAs or soften the wording. **Do not run EU paid marketing until resolved.**
- [ ] **Terms of Service** — no limitation-of-liability, no warranty disclaimer, no governing law / dispute resolution. Add before global paid launch.
- [ ] **Entertainment disclaimer placement** — surface "for entertainment/self-reflection only, not predictive/medical/psychological advice" at checkout and on the report/PDF, not only buried in Terms.
- [ ] **US COPPA** — highest-risk market for children's data; have US counsel bless the verifiable-parental-consent posture before US marketing spend.

### Market / growth (later)
- [ ] Add **zh-Traditional (Taiwan/Singapore/HK diaspora)** locale — highest cultural fit (八字 is native), PayPal works there; currently missing.
- [ ] KR stays free + promo only (PayPal can't accept domestic KRW); paid KR needs a domestic gateway (Toss/KakaoPay).

---

## Known constraints (by design, not bugs)
- **Korea**: PayPal cannot process domestic KRW → KR is free preview + promo-code only. Funnel gates `lang=ko` away from PayPal.
- **Free preview rate limit**: 10 / hour / IP (intentional abuse guard).
- **Payments**: PayPal Guest + Google Pay only. Brazil has no PayPal guest checkout (deferred until Stripe/Pix via a US entity).
