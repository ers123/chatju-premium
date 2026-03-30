# 소명(SoMyung) 작업 진행 현황 — 2026-03-30

## 오늘 세션 완료

### 1. QA & 버그 수정 (6건)
- CF Pages i18n 라우팅 안정화 (`trailingSlash: true`)
- 루트 한국어 접근 불가 해결 (SUPPORTED에 'ko' 추가 → `/ko/` 경로)
- `/saju` 404 해결 (`_redirects` 리다이렉트)
- 언어 전환 시 URL 불변 해결 (`mode='navigate'`)
- hreflang/canonical URL trailing slash 통일
- sitemap.xml `/ko/` 경로 반영

### 2. PPP 기반 가격 조정 (10개국)
| 시장 | 이전 | 변경 | 근거 |
|------|------|------|------|
| 한국 | ₩6,900 | **₩4,900** | 아메리카노 한 잔 |
| 일본 | ¥750 | **¥490** | 원코인 (500엔 동전) |
| 베트남 | ₫125,000 | **₫49,000** | PPP 39% |
| 인도네시아 | Rp79,000 | **Rp39,000** | PPP 49% |
| 태국 | ฿175 | **฿89** | PPP 50% |
| 중국 | ¥35 | **¥19.9** | PPP 55% |
| 스페인어권 | €4,49 | **€3,49** | 남유럽 가격민감도 |
| 프랑스 | €4,49 | **€3,99** | 서유럽 기준 |
| 브라질 | R$25 | **R$9,90** | PPP 36% |
| 영어 | $4.99 | **$4.99** | 유지 |

### 3. Google Pay 추가
- PayPal SDK에 `googlepay` 컴포넌트 추가
- 결제 페이지에 Google Pay 버튼 (지원 기기에서만 자동 표시)
- 백엔드 변경 없음 (동일 PayPal Orders v2 API)
- CSP 업데이트 (`pay.google.com` 허용)

### 4. GTM 심층 리서치 (3개 병렬 에이전트)
- 10개 시장 규모/경쟁사/가격/결제수단/문화 분석
- PPP 가격 전략 + 심리적 가격대 연구
- 문화별 마케팅 pitch 차별화 전략
- 바이럴 사례 연구 (Co-Star, Pattern, AstroTalk, 16Personalities, Cosmos Persona)
- 제로예산 바이럴 플레이북 Top 10

### 5. 결제수단 조사 & 결론
- **Stripe**: 한국 국적자 가입 불가
- **Paddle**: pseudoscience 사유 거부
- **Lemon Squeezy**: Stripe 계정 필요 (Stripe 인수 후) → 불가
- **Dodo Payments**: 인도 스타트업, 자금동결 리스크, 점술 정책 제한적 → 비추
- **Gumroad**: Stripe 필요 → 불가
- **결론**: PayPal Guest Checkout (카드 직접 입력) + Google Pay로 10개국 결제 가능
- **장기**: MVP 검증 후 US LLC ($300-500) → Stripe 해금

---

## 현재 상태 (2026-03-30)

### 라이브 — somyung.cc
- 10개 언어 i18n 라우트 정상 (`/ko/`, `/en/`, ... `/th/`)
- PPP 기반 가격 반영
- Google Pay 추가
- GEO 인프라 (robots.txt, sitemap.xml, llms.txt, JSON-LD)
- 콘솔 에러 0

### 결제
- PayPal Guest Checkout: 카드 직접 입력 가능 (PayPal 계정 불필요)
- Google Pay: Android + Chrome에서 원터치 결제
- 10개국 모두 결제 가능

---

## 남은 할 일 (우선순위)

### Phase 1 — 바이럴 인프라 (이번 주)
1. **공유 가능한 5행 결과 카드 디자인** — 인스타 스토리/TikTok 공유용
2. **"형제 비교" 기능 추가** — 1유저 → 2분석 바이럴 루프
3. **마케팅 카피 10개 언어 문화 차별화** — translations.ts 업데이트

### Phase 2 — 콘텐츠 & 시딩 (1-2주)
4. **TikTok 계정 개설 + 첫 리액션 영상** — 최고 ROI 채널
5. **마이크로 인플루언서 50명 시딩** — 무료 분석 제공 (원가 $0.01/건)
6. **"Korean Astrology" 교육 콘텐츠** — Reddit/X에 "사주 vs MBTI" 프레이밍
7. **SEO 블로그 콘텐츠** — 5행 가이드, 사주 설명, 기질별 육아법

### Phase 3 — 런칭 (2-4주)
8. **Product Hunt 런칭** — 30일 커뮤니티 활동 후
9. **시즌 캠페인 준비** — 어린이날(5/5), 어버이날(5/8)

### Phase 4 — 결제 확장 (매출 검증 후)
10. **Apple Pay 도메인 인증** — Google Pay 검증 후
11. **US LLC 설립** — 매출 $500/월 초과 시 → Stripe/Lemon Squeezy 해금

### 기술 부채
- NanumGothic 폰트 제거 (~4MB 절감)
- Cloudflare auto-deploy 복구
- PayPal webhook 설정
- 환불 API 자동화

---

## 커밋 이력 (이번 세션)
- `eff25a7` — fix: CF Pages i18n routing, language switcher navigation, URL consistency
- `4a162b6` — feat: PPP-adjusted pricing per market + Google Pay via PayPal SDK

## 배포
```bash
cd /Users/yohan/Projects/fortune/chatju-premium/frontend
npm run build
npx wrangler pages deploy out --project-name=somyung --branch=somyung
```

## 참고 문서
| 문서 | 위치 |
|------|------|
| GTM 리서치 | `memory/gtm-research-2026-03.md` |
| 바이럴 플레이북 | `memory/virality-playbook-2026-03.md` |
| 마케팅 플랜 | `memory/marketing-plan-2026-03.md` |
| GEO 감사 리포트 | `docs/GEO-AUDIT-REPORT.md` |
