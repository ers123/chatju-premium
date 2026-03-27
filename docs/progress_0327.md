# 소명(SoMyung) 작업 진행 현황 — 2026-03-27

## 이번 세션에서 완료한 것

### 1. GEO 감사 (geo-seo-claude)
- geo-seo-claude 설치 완료 (`~/.claude/skills/geo/`)
- somyung.cc 전체 감사 실행
- 감사 리포트 저장: `docs/GEO-AUDIT-REPORT.md`
- **종합 GEO 점수: 30/100 (Critical)**

| 카테고리 | 감사 점수 | 이번 세션 후 예상 |
|---|---|---|
| AI Citability | 38 | ~52 |
| Brand Authority | 12 | ~25 |
| Content E-E-A-T | 38 | ~65 |
| Technical GEO | 24 | ~55 |
| Schema & Structured Data | 48 | ~58 |
| Platform Optimization | 18 | 18 (미변경) |
| **종합** | **30** | **~46** |

### 2. Founder 스토리 반영 (E-E-A-T 핵심)
- **파운더**: 성하(SungHa) — 명리심리상담사 1급 + MS Decision Making & Applied Analytics + 세 자녀 부모
- `frontend/app/page.tsx` — Problems 섹션 뒤에 Founder Story 섹션 신규 추가
- `frontend/app/lib/i18n/translations.ts` — 10개 언어 `founder` 섹션 추가
- Trust Badge에 자격증 배지 추가 (10개 언어)
- FAQ #1 자격증/학위 언급으로 확장 (ko, en 완료)

### 3. GEO 인프라 파일 신규 생성
- `frontend/public/robots.txt` — AI 크롤러 7종 명시적 허용
- `frontend/public/sitemap.xml` — hreflang 10개 언어 포함
- `frontend/public/llms.txt` — LLM 인덱싱 명시적 허용

### 4. layout.tsx 개선
- 메타데이터 author → SungHa, description에 자격증 포함
- hreflang alternates 10개 언어 추가
- JSON-LD 신규 추가: Organization + Person (credentials) + WebSite

### 5. 마케팅 플랜 수립 & 저장
- 시장 우선순위: 태국(th) > 베트남(vi) > 일본(ja)
- 채널/키워드/포지셔닝 전략 수립
- 메모리 저장: `memory/marketing-plan-2026-03.md`

### 6. 배포 완료
```
https://57be45ee.somyung.pages.dev (Cloudflare Pages)
```

---

## 다음 세션에서 할 것

### Priority 1 — 즉시 (30분~1시간)

#### 1-1. FAQ #1 확장 — 나머지 8개 언어
- **파일**: `frontend/app/lib/i18n/translations.ts`
- **작업**: ja, zh, vi, id, es, pt, fr, th의 FAQ 첫 번째 항목(미신 아닌가요?) 답변을 150+ 단어로 확장, 자격증/학위/세 자녀 경험 언급
- ko, en은 이미 완료됨

#### 1-2. FAQPage JSON-LD 스키마 추가
- **파일**: `frontend/app/page.tsx` 또는 `frontend/app/layout.tsx`
- **작업**: 현재 7개 FAQ를 JSON-LD FAQPage 스키마로 마크업
- **왜 중요**: AI 인용 가능성 가장 크게 높이는 단일 조치
- **참고**: `docs/GEO-AUDIT-REPORT.md`에 JSON-LD 코드 스니펫 있음

#### 1-3. Product/Service JSON-LD 추가
- **파일**: `frontend/app/layout.tsx`
- **작업**: $4.99 프리미엄 리포트 + 3개 후기를 Product + AggregateRating 스키마로 마크업
- **참고**: `docs/GEO-AUDIT-REPORT.md`에 코드 스니펫 있음

### Priority 2 — 이번 주 내 (1~2시간)

#### 2-1. og:image / Twitter card image 추가
- **파일**: `frontend/app/layout.tsx`
- **현재 상태**: `images: []` 비어있음 — 소셜 공유 미리보기 없음
- **작업**: OG 이미지 생성 또는 기존 이미지 경로 지정
- **참고**: `frontend/public/assets/images/` 에 기존 이미지 있음

#### 2-2. /about 페이지 신규 생성
- **파일**: `frontend/app/about/page.tsx` (신규)
- **내용**: 파운더 성하 소개, 명리심리상담사 1급 자세한 설명, MDA 학위, 세 자녀 스토리, 소명 개발 동기, 방법론
- **왜 중요**: E-E-A-T 권위(Authoritativeness) 신호 강화, AI 크롤러가 인용할 독립 페이지
- Footer의 "서비스" 컬럼에 링크 추가

### Priority 3 — 장기 (아키텍처 변경 필요)

#### 3-1. SSR i18n 수정 (가장 임팩트 크지만 가장 어려운 작업)
- **현재 문제**: `<html lang="ko">` 하드코딩, 언어 전환이 클라이언트 사이드만 → AI 크롤러는 항상 한국어 HTML을 받음
- **해결 방안 A** (추천): 경로 기반 라우팅 — `/en/`, `/ja/`, `/th/` 등 별도 경로 생성
- **해결 방안 B**: Next.js middleware로 `Accept-Language` 헤더 감지 후 lang 쿠키 설정 + SSR에서 읽기
- **제약**: `output: 'export'` (정적 내보내기) 사용 중 → Cloudflare Pages 배포 구조상 동적 SSR 불가
- **현실적 접근**: 최소한 영어(`/en`)와 태국어(`/th`) 정적 페이지 별도 생성

#### 3-2. 시장별 마케팅 실행 (콘텐츠/채널)
- **태국**: TikTok/LINE/Facebook, 키워드 `ดูดวงเกาหลี`, 한류 팬 마이크로 인플루언서
- **베트남**: Facebook/Zalo/TikTok, 키워드 `xem bói Hàn Quốc`, K-drama 커뮤니티
- **일본**: X(Twitter)/Instagram, 키워드 `韓国占い / 四柱推命 AI`, 점술 관련 계정
- **공통**: Product Hunt 런칭, LinkedIn 회사 페이지(Harmonion) 등록

---

## 파일 위치 참고

| 파일 | 경로 |
|---|---|
| GEO 감사 리포트 | `docs/GEO-AUDIT-REPORT.md` |
| 마케팅 플랜 | `memory/marketing-plan-2026-03.md` |
| 파운더 프로필 | `memory/founder-profile.md` |
| 번역 파일 | `frontend/app/lib/i18n/translations.ts` |
| 홈페이지 | `frontend/app/page.tsx` |
| 레이아웃/메타 | `frontend/app/layout.tsx` |
| robots.txt | `frontend/public/robots.txt` |
| sitemap.xml | `frontend/public/sitemap.xml` |
| llms.txt | `frontend/public/llms.txt` |

## 배포 명령어

```bash
cd /Users/yohan/Projects/fortune/chatju-premium/frontend
npm run build
npx wrangler pages deploy out --project-name=somyung --branch=somyung
```
