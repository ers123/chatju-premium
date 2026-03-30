# 소명(SoMyung) 작업 진행 현황 — 2026-03-27 (Updated 03-30)

## 이번 세션에서 완료한 것

### 1. GEO 감사 (geo-seo-claude)
- geo-seo-claude 설치 완료 (`~/.claude/skills/geo/`)
- somyung.cc 전체 감사 실행
- 감사 리포트 저장: `docs/GEO-AUDIT-REPORT.md`
- **초기 GEO 점수: 30/100 (Critical)**

### 2. Founder 스토리 반영 (E-E-A-T 핵심)
- **파운더**: 성하(SungHa) — 명리심리상담사 1급 + MS Decision Making & Applied Analytics + 세 자녀 부모
- 랜딩 페이지에 Founder Story 섹션 신규 추가
- Trust Badge에 자격증 배지 추가 (10개 언어)
- FAQ #1 자격증/학위 언급으로 확장 — **10개 언어 전체 완료**

### 3. GEO 인프라 파일 신규 생성
- `frontend/public/robots.txt` — AI 크롤러 7종 명시적 허용
- `frontend/public/sitemap.xml` — hreflang 10개 언어 포함 (랜딩 + about)
- `frontend/public/llms.txt` — LLM 인덱싱 명시적 허용

### 4. SSR i18n 라우트 (가장 임팩트 큰 작업)
- **아키텍처**: `app/(app)/` (한국어 기본) + `app/(i18n)/[lang]/` (9개 외국어) route groups
- **정적 생성**: `generateStaticParams()`로 en, ja, zh, vi, id, es, pt, fr, th 9개 경로 SSG
- **`<html lang>` 동적 설정**: 각 언어 경로마다 올바른 lang 속성 (예: `/th` → `lang="th"`)
- **About 페이지**: 10개 언어 버전 생성 (`/about`, `/en/about`, `/ja/about`, ... `/th/about`)
- **컴포넌트 분리**: `LandingContent`, `AboutContent` 공통 컴포넌트로 추출

### 5. JSON-LD 스키마 대량 추가
- **i18n layout**: Organization + WebSite + FAQPage + Product (가격/리뷰 포함) + Speakable
- **About 페이지**: Person (자격증 상세) + Article + BreadcrumbList
- **Product 스키마**: $4.99 프리미엄 리포트 + AggregateRating

### 6. 현지 통화 가격 표시
- 각 언어별 현지 통화: ₩6,900 / $4.99 / ¥750 / ¥35 / ₫125.000 / Rp79.000 / €4,49 등
- USD 기준 결제 안내 문구 (currencyNote) 전 언어 추가

### 7. 모바일 반응형 개선
- CSS `clamp()` 기반 반응형 타이포그래피/스페이싱
- Auto-fit grid 레이아웃
- Flexbox 반응형 래핑

### 8. OG 이미지 + 소셜 카드
- `og:image` → `/assets/images/key_nature_sprout_new.png` (1024×1024)
- Twitter `summary_large_image` 카드 설정 완료

### 9. 마케팅 플랜 수립 & 저장
- 시장 우선순위: 태국(th) > 베트남(vi) > 일본(ja)
- 메모리 저장: `memory/marketing-plan-2026-03.md`

### 10. 배포 완료
- Cloudflare Pages 라이브: **https://somyung.cc**

---

## GEO 점수 변화

| 카테고리 | 감사 전 | 감사 후 (예상) |
|---|---|---|
| AI Citability | 38 | ~70 |
| Brand Authority | 12 | ~40 |
| Content E-E-A-T | 38 | ~75 |
| Technical GEO | 24 | ~80 |
| Schema & Structured Data | 48 | ~85 |
| Platform Optimization | 18 | ~30 |
| **종합** | **30** | **~75** |

SSR i18n + JSON-LD 스키마 + About 페이지 + 현지 가격까지 반영한 예상치.

---

## 현재 라이브 상태 점검 (2026-03-30)

### 정상 동작
- `somyung.cc/en` → 200, `lang="en"` ✓
- `somyung.cc/th` → 200, `lang="th"` ✓
- `somyung.cc/en/about` → 200 ✓
- `robots.txt`, `sitemap.xml`, `llms.txt` — 라이브 정상 ✓
- OG 이미지 설정 ✓

### 발견된 이슈
1. **루트(`/`) → `/en` 리다이렉트 (301)** — 한국어 사용자가 somyung.cc 접속 시 영어 페이지로 이동됨. `(app)/page.tsx`의 `LandingContent`는 한국어 기본이지만, Cloudflare Pages 라우팅에서 `/en`으로 리다이렉트하는 것으로 보임
2. **`/ko` 경로 없음 (404)** — SUPPORTED 배열에 'ko' 미포함. sitemap에서는 `hreflang="ko"`가 `/`를 가리키지만 실제로 `/`가 `/en`으로 리다이렉트되어 불일치
3. **sitemap.xml hreflang 불일치** — `hreflang="ko" href="somyung.cc/"` 인데 해당 URL이 `/en`으로 리다이렉트됨

---

## 다음 할 일 (우선순위)

### P0 — 즉시 수정 (루트 한국어 접근 깨짐)
- **루트(`/`) 리다이렉트 문제 해결** — 한국어 랜딩이 접근 불가한 상태
- 방안 A: `(app)/` route group이 정상 작동하도록 Cloudflare Pages 설정 확인
- 방안 B: SUPPORTED에 'ko' 추가하여 `/ko` 경로 생성 + 루트에서 `/ko` 리다이렉트

### P1 — 단기
- 관리자 프로모 현황 API — `GET /admin/promo/:code/usage`
- NanumGothic 폰트 제거 (~4MB 절감)
- Cloudflare auto-deploy 복구

### P2 — 중기
- Instagram 공유 카드
- PayPal webhook 설정
- 환불 API 자동화
- Product Hunt 런칭 준비

### P3 — 시장별 마케팅 실행
- **태국**: TikTok/LINE/Facebook, 키워드 `ดูดวงเกาหลี`
- **베트남**: Facebook/Zalo/TikTok, 키워드 `xem bói Hàn Quốc`
- **일본**: X(Twitter)/Instagram, 키워드 `韓国占い / 四柱推命 AI`
- **공통**: Product Hunt, LinkedIn 회사 페이지(Harmonion)

---

## 파일 위치 참고

| 파일 | 경로 |
|---|---|
| GEO 감사 리포트 | `docs/GEO-AUDIT-REPORT.md` |
| 마케팅 플랜 | `memory/marketing-plan-2026-03.md` |
| 파운더 프로필 | `memory/founder-profile.md` |
| 번역 파일 | `frontend/app/lib/i18n/translations.ts` |
| 랜딩 컴포넌트 | `frontend/components/landing/LandingContent.tsx` |
| About 컴포넌트 | `frontend/components/about/AboutContent.tsx` |
| i18n 레이아웃 | `frontend/app/(i18n)/[lang]/layout.tsx` |
| 앱 레이아웃 | `frontend/app/(app)/layout.tsx` |
| robots.txt | `frontend/public/robots.txt` |
| sitemap.xml | `frontend/public/sitemap.xml` |
| llms.txt | `frontend/public/llms.txt` |

## 배포 명령어

```bash
cd /Users/yohan/Projects/fortune/chatju-premium/frontend
npm run build
npx wrangler pages deploy out --project-name=somyung --branch=somyung
```
