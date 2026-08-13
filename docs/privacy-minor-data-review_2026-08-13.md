# 미성년자 데이터 프라이버시 — 시장별 리스크 조사 (2026-08-13)

**질문**: 서비스 대상 지역에서 미성년자 정보 처리로 문제가 될 소지가 있는가.
**결론 요약**: 구조적으로 유리한 위치다(사용자가 부모이고, 아동은 사용자가 아니다).
실질 갭은 2개 — **EU/UK 대표자 지정 문제**와 **DPIA 문서 부재**. 나머지는
현행 동의 체계로 커버되거나, 사용자 0명 시장이라 마케팅을 안 하는 것으로 족하다.

---

## 0. 전제 — 우리가 실제로 하는 것 (조사의 기준점)

| 항목 | 실태 |
|---|---|
| 수집 데이터 | 아이 생년월일·출생시간·성별·이름(선택), 부모 생년월일(선택), 구매자 이메일 |
| 사용자 | **부모/법정대리인.** 아이는 서비스를 사용하지 않는다 — 아동으로부터의 수집이 없다 |
| 저장 | 프리뷰는 미저장(설계 약속). 유료 리포트만 저장, 보존기간·자동삭제 있음(`retention-cleanup`) |
| 동의 UI | 필수 4종: 14세 이상 본인 확인 · 법정대리인 확인 · 개인정보 수집이용 · 국외 AI/클라우드 처리 (2026-08-13 라이브 실측) |
| 정책 문서 | privacy policy 9섹션: GDPR Art.6 근거·아동·국외이전·보유기간·보안·권리·CCPA/CPRA·Privacy Officer (8/13 라이브 실측) |
| 국외 처리 | OpenAI/Anthropic/Google (국외이전 동의 취득), Supabase, AWS |
| 계측 | funnel_daily: (날짜·이벤트·언어·숫자)만. PII 0 |

이 구조가 대부분 법역에서 결정적이다: **아동 대상 서비스(child-directed)가 아니고,
아동 데이터의 처리 동의를 법정대리인이 직접 제공한다.**

---

## 1. 시장별 판정

### 미국 — COPPA + 주법 · **LOW**

- COPPA는 "아동으로부터의 온라인 수집" 또는 "아동 대상 서비스"에 붙는다.
  SoMyung은 둘 다 아니다 — 부모가 자기 아이 정보를 입력하는 부모 대상 서비스.
- **2025 개정 룰**(2025-06-23 발효, 컴플라이언스 데드라인 **2026-04-22**)이
  child-directed 판정 기준을 넓혔다: 마케팅 자료·외부 표현·유사 서비스의 이용
  연령까지 본다. → **운영 가드레일: 마케팅 크리에이티브가 아이들에게 어필하는
  형태(만화 캐릭터, 아동 화법)가 되지 않게 유지.** 오늘 만든 소셜 콘텐츠는 전부
  부모 화법이라 문제없음. 이 가드레일만 지키면 COPPA 비적용 포지션이 견고하다.
- 주법(CCPA/CPRA 등): 아동 데이터 "판매/공유" 없음, 광고 SDK 없음, GA는 동의
  게이트 뒤. 정책에 CCPA 섹션 존재. 특이 리스크 없음.

### EU — GDPR · **MEDIUM (실질 갭 2개)**

- 동의 구조는 적법: 아동이 정보주체, 법정대리인이 동의 — Art 8(아동에게 직접
  제공되는 서비스의 아동 본인 동의 연령) 이슈 자체가 발생하지 않는 구조.
- Art 22(자동화 결정): 리포트는 법적 효력·중대 효과를 만들지 않는 조언 콘텐츠 —
  비적용 주장 가능. 정책에 프로파일링 설명이 이미 있음.
- **갭 1 — Art 27 EU 대표자.** es/fr/pt 로케일에 EUR 가격을 붙여 팔고 있는 이상
  "EU 거주자에게 서비스 제공"이 명백해서, 역내 미설립 컨트롤러는 EU 대표자를
  지정해야 한다. 기업 규모 예외는 없고 "occasional processing" 예외는 상시
  유료 서비스에는 적용을 주장하기 어렵다. 대표자 대행 서비스 연 €100~500.
  → **§3 결정 필요 항목.**
- **갭 2 — DPIA 부재.** 아동 데이터 + 성격 프로파일링 조합은 DPIA 트리거로
  보는 감독기구가 많다. 규모가 작아 의무 여부는 다퉈볼 수 있으나, **한 장짜리
  DPIA를 만들어 두는 비용이 논쟁 비용보다 싸다.** 에이전트가 초안 가능(반나절).

### 영국 — UK GDPR + Children's Code · **LOW-MEDIUM**

- ICO Children's Code(AADC)는 "아동이 접근할 개연성이 높은(likely to be
  accessed by children, U18)" 서비스에 적용. 사주 기반 육아 분석은 아동에게
  "particular appeal"이 없고 사용자는 부모다. **비적용 평가를 한 문단으로
  문서화**해 두면 족하다(DPIA에 포함시키면 됨).
- UK도 Art 27 상당의 UK 대표자 요건이 있다. en 시장에 UK 구매자가 섞인다.
  EU 대표자와 같은 결정 묶음.

### 일본 — APPI · **LOW**

- APPI에 아동 동의 연령 명문 규정 없음(실무 가이드: 12~15세 미만은 법정대리인
  동의). 우리는 애초에 부모 동의만 받는다. 국외 제공은 동의 취득 완료 구조.
- 워치 항목: 차기 APPI 개정 논의에 아동 데이터 규정 신설 방향이 있다.
  ja가 2위 시장이므로 개정 확정 시 재점검.

### 한국 — 개인정보보호법 · **LOW (기처리)**

- 만 14세 미만 법정대리인 동의: 2026-06 법무 리뷰에서 CRITICAL로 잡아
  6/26에 수정 완료. 동의 증적(IP·타임스탬프·정책버전) 저장 중.
- 잔여 리스크는 프라이버시가 아니라 **경쟁 환경**(유사 서비스 다수, 개보위
  민원 관행). 결제 없는 현 구조(무료+프로모)는 오히려 노출면이 작다.

### 태국 — PDPA · **LOW (사용자 0)**

- 10세 미만: 법정대리인 동의 필수. 10~20세: 본인+대리인 이중 동의.
  대상 아동이 대부분 10세 미만이지만 **동의 주체가 이미 부모**라 구조 충족.
- 사용자 0명 — 마케팅 비대상 유지가 곧 리스크 관리.

### 베트남 — PDPL (신법) · **LOW (사용자 0, 단 법은 강함)**

- **2026-01-01 신법 발효**(PDPL, 2025-06 통과) + 시행령 Decree 356/2025.
  구 Decree 13을 대체. 7세 이상 아동의 사생활 공개엔 본인+대리인 이중 동의 등
  요건이 촘촘하고 데이터 현지화 계열 규제도 강하다.
- 사용자 0명. **vi 마케팅은 하지 않는 현 방침 유지**가 결론. 진입하려면
  그때 전면 재조사.

### 인도네시아 — PDP Law + PP Tunas · **LOW (사용자 0)**

- PDP Law: 아동(18세 미만) 데이터는 부모/후견인 동의 필수 — 구조 충족.
- 2025년 아동 전자시스템 보호 규정(통칭 PP Tunas)이 추가로 발효, 아동 대상
  플랫폼에 위험평가·등급 의무. 우리는 아동 대상 플랫폼이 아니나, 진입 시 재조사.
- 사용자 0명. 마케팅 비대상 유지.

### 중국(zh) — PIPL 외 · **회피 권고**

- PIPL: 14세 미만 개인정보는 **민감정보** — 별도 동의 + 전담 처리규칙 요구.
- 프라이버시 이전의 문제: **점술·미신 콘텐츠 자체가 중국 내 인터넷 규제
  대상**이고, 결제 수단도 없다(CNY 수취 불가).
- zh 로케일은 해외 중화권(대만·홍콩·화교) 대상으로만 이해하고, **중국 본토
  마케팅은 하지 않는다**를 명시적 방침으로. (별도 차단까지는 불요.)

### 브라질 — LGPD · **LOW-MEDIUM (pt 로케일)**

- Art 14: 아동 데이터는 부모 동의 + 아동 최선의 이익 원칙 — 구조 충족.
- LGPD는 EU식 역외 대표자 의무가 없다(현행 ANPD 실무 기준). BR 결제는 이미
  보류 상태(guest checkout 불가)라 pt는 사실상 포르투갈 대상 = EU 문제로 귀속.

---

## 2. 지금 바로 지킬 운영 가드레일 (비용 0)

1. **마케팅은 항상 부모 화법.** 아이에게 어필하는 크리에이티브(만화체, 아동
   말투, 키즈 콘텐츠 포맷)를 만들지 않는다 — COPPA·AADC의 "아동 대상" 판정을
   원천 차단하는 가장 싼 방법. 콘텐츠 엔진 산출물은 현재 전부 적합.
2. **아동 데이터를 늘리지 않는다.** 새 필드 추가 제안이 나오면 이 문서를 먼저
   본다. 특히 아이 사진·음성(2025 COPPA 개정에서 생체정보 명시)은 금지선.
3. **프리뷰 미저장 약속 유지.** 퍼널 계측이 PII 0으로 설계된 이유이기도 하다.
4. **vi/id/th/zh 마케팅 안 함** — 컴플라이언스 재조사 전에는 사용자 0 유지가 방어.

## 3. 결정 필요 (사용자 판단 항목)

| # | 결정 | 선택지 | 비용 |
|---|---|---|---|
| D1 | **EU/UK 대표자** | (a) 대행 지정 (b) es/fr/pt 판매 중단, EU 트래픽에 en 무료만 (c) 리스크 인수(집행 확률 극히 낮음, 단 아동 데이터라 민원 시 인상 나쁨) | (a) 연 €100~500 (b) EUR 매출 0 (현재 어차피 0) (c) 0 |
| D2 | **DPIA 작성** | 에이전트 초안 → 파운더 검토 | 반나절 |

권고: **D2는 그냥 하고**, D1은 EUR 매출이 실제로 발생하기 시작할 때 (a)로.
그 전까지는 (c)를 인지된 리스크로 기록해 두는 것이 합리적 — 매출 0 시장에
고정비를 먼저 태울 이유가 없다. 단 "몰랐다"와 "알고 미뤘다"는 다르므로
이 문서가 그 기록이다.

---

## 4. 출처 (2026-08-13 검색 검증)

- COPPA 2025 개정: [Federal Register 최종 룰](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) · [FTC 보도자료](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data) · [Davis Polk 발효 정리](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect) · [Hunton 데드라인](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches)
- 베트남 PDPL: [Tilleke & Gibbins](https://www.tilleke.com/insights/vietnams-new-personal-data-protection-law-a-closer-look/) · [EY Legal Alert](https://www.ey.com/en_vn/technical/tax/tax-and-law-updates/legal-alert-july-2025-personal-data-protection-law) · [Decree 356/2025](https://ppc.land/vietnam-implements-comprehensive-personal-data-decree-on-final-day-of-2025/)
- UK Children's Code: [ICO Services covered](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/services-covered-by-this-code/) · [likely-to-be-accessed 가이드](https://www.insideprivacy.com/childrens-privacy/uk-ico-provides-guidance-on-when-a-service-is-likely-to-be-accessed-by-children-and-needs-to-comply-with-its-age-appropriate-design-code/)
- GDPR Art 27: [조문 해설·예외](https://gdprinfo.eu/gdpr-article-27-explained-eu-representative-requirement-for-non-eu-controllers-and-processors-with-practical-examples) · [IAPP 실무](https://iapp.org/news/a/eu-representative-on-how-to-operationalize-article-27-of-the-gdpr)
- 태국 PDPA 아동: [Tilleke & Gibbins 가이드라인](https://www.tilleke.com/insights/thailand-issues-guidelines-on-pdpa-consent-and-notification-requirements/) · [Securiti 동의 요건](https://securiti.ai/blog/consent-requirements-under-thailands-data-protection-framework/)
- 인도네시아: [Securiti PDP 정리](https://securiti.ai/blog/indonesia-personal-data-protection-law-and-consent-requirements/) · [PP Tunas](https://robere.co.id/pp-tunas-child-data-protection-digital-age/)
- 일본 APPI·중국 PIPL·브라질 LGPD·CCPA: 모델 지식 기준(2026-05 컷오프), 웹 재검증 미실시.
  이 네 곳은 판정이 법 개정에 민감하지 않은 구조적 결론(비대상/기처리/회피)이라
  검증 우선순위를 낮췄다. 진입 결정 시 개별 재확인 요.
