# 이메일 배달 + 프로모 코드 시스템 설계

## 1. 이메일 배달 시스템

### 유저 플로우
```
결제 페이지에서 이메일 입력 (필수)
  ↓
PayPal 결제 완료
  ↓
웹에서 바로 결과 확인 (즉시 만족)
  ↓
서버에서 PDF 생성 → 이메일 발송 (1~2분 후)
  ↓
이메일 도착: "소명 프리미엄 기질 분석 리포트가 도착했습니다"
```

### 이메일 문구 (Draft)
```
Subject: ✨ {아이이름}의 기질 분석 리포트가 도착했습니다 — 소명

안녕하세요, {부모호칭}님.

{아이이름}을 더 깊이 이해하고 싶은 마음으로 찾아주셔서 감사합니다.
첨부된 PDF에 아이의 타고난 기질과 맞춤 양육 가이드가 담겨 있습니다.

📎 첨부: {아이이름}_소명_기질분석리포트.pdf

💡 Tip: 리포트의 "오늘부터 실천 가이드" 섹션을 냉장고에 붙여두시면
  일상에서 바로 활용하실 수 있습니다.

궁금한 점이 있으시면 언제든 support@harmonyon.kr로 연락주세요.

따뜻한 하루 보내세요,
소명 팀 드림

---
소명(SoMyung) — 아이를 이해하는 첫 걸음
https://somyung.kr
```

### 기술 구현
- **이메일 서비스:** AWS SES (Lambda에서 바로 호출 가능, 서울 리전)
  - 또는 Resend.com (개발자 친화적, 월 3000건 무료)
- **PDF 생성:** Puppeteer (서버사이드 HTML → PDF) 또는 jsPDF (서버 내 생성)
  - Lambda에서 Puppeteer는 무거움 → jsPDF + 마크다운 → HTML → PDF가 현실적
  - 또는 `@react-pdf/renderer` (React 컴포넌트 → PDF)
- **타이밍:** 결제 완료 후 비동기 (SQS 큐 또는 직접 async)

### DB 변경
```sql
-- readings 테이블에 이메일 추가
ALTER TABLE readings ADD COLUMN delivery_email TEXT;
ALTER TABLE readings ADD COLUMN email_sent_at TIMESTAMPTZ;
ALTER TABLE readings ADD COLUMN email_status TEXT DEFAULT 'pending'; -- pending, sent, failed
```

### 프론트엔드 변경
- 결제 페이지에 이메일 입력 필드 추가 (required)
- sessionStorage에 이메일 저장 → /saju/calculate 호출 시 전달

---

## 2. 프로모 코드 시스템

### 유저 플로우
```
결제 페이지에 "프로모션 코드" 입력란
  ↓
코드 입력 (예: "GITAN2026")
  ↓
서버에서 코드 검증
  ↓
유효하면: 결제 없이 바로 프리미엄 리포트 생성
  ↓
백엔드에서 기록: 이 사용자는 "GITAN2026" 코드로 왔음
  ↓
기탄교육에 주기적으로 사용 현황 리포트 제공
```

### 프로모 코드 구조

```sql
-- 새 테이블: promo_codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,        -- 예: "GITAN2026"
  partner_name VARCHAR(100) NOT NULL,      -- 예: "기탄교육"
  discount_type VARCHAR(20) NOT NULL,      -- 'free' | 'percent' | 'fixed'
  discount_value DECIMAL(10,2) DEFAULT 0,  -- free=0, percent=100, fixed=4.99
  max_uses INTEGER,                         -- null = 무제한
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,                  -- null = 무기한
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',              -- 파트너별 추가 데이터
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 새 테이블: promo_usage (기탄에서 관리할 데이터)
CREATE TABLE promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id),
  user_email TEXT NOT NULL,                 -- 이메일 (기탄 관리용)
  child_name TEXT,                          -- 아이 이름
  child_birth_date TEXT,                    -- 생년월일
  reading_id UUID REFERENCES readings(id),  -- 생성된 리포트
  used_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'               -- 추가 데이터 (UTM 등)
);

-- 인덱스
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_usage_code ON promo_usage(promo_code_id);
CREATE INDEX idx_promo_usage_email ON promo_usage(user_email);
```

### API 엔드포인트

```
POST /promo/validate
Body: { code: "GITAN2026" }
Response: { valid: true, partner: "기탄교육", discountType: "free" }

POST /promo/apply
Body: { code: "GITAN2026", email: "parent@email.com", childName: "..." }
Response: { orderId: "PROMO-xxx", bypassPayment: true }
```

### 결제 페이지 변경
```
┌─────────────────────────────────┐
│  프리미엄 리포트 $4.99          │
│  (정가 $9.99 — 오픈 기념 50%)  │
│                                 │
│  📧 이메일: [            ]     │  ← 새로 추가 (필수)
│                                 │
│  🎟️ 프로모션 코드 (선택):      │  ← 새로 추가
│     [           ] [적용]        │
│     ✅ 기탄교육 제휴 코드 적용! │
│     → 무료로 리포트를 받습니다  │
│                                 │
│  [PayPal로 결제하기]            │  ← 프로모 시 숨김
│  또는                           │
│  [무료로 리포트 받기]           │  ← 프로모 시 표시
└─────────────────────────────────┘
```

### 기탄교육 관리 기능

1. **관리자 API:** `GET /admin/promo/GITAN2026/usage`
   - 사용 횟수, 이메일 목록, 기간별 통계

2. **주기적 리포트:**
   - 주간/월간 이메일로 기탄에 사용 현황 발송
   - CSV 다운로드 가능

3. **기탄 측에서 활용:**
   - 소명 서비스를 체험한 학부모 이메일 확보
   - "기질에 맞는 기탄 교재 추천" 후속 마케팅 가능
   - 소명 리포트에 "기탄교육 추천 교재" 섹션 추가 (옵션)

---

## 구현 우선순위

1. **프론트: 결제 페이지에 이메일 + 프로모 코드 UI** (1세션)
2. **백엔드: promo_codes + promo_usage 테이블 + API** (1세션)
3. **백엔드: 프로모 코드 결제 바이패스 로직** (같은 세션)
4. **백엔드: 이메일 발송 (AWS SES 또는 Resend)** (1세션)
5. **백엔드: 서버사이드 PDF 생성** (1세션)
6. **기탄교육 관리자 API** (나중에)

## 참고: 기탄교육 제안 시 포인트
- "학부모에게 무료 기질 분석 → 기질에 맞는 기탄 교재 추천"
- 기탄 측 비용: 0 (소명이 AI 비용 부담, 건당 ~10원)
- 기탄 측 혜택: 학부모 이메일 확보 + "기질 맞춤 교재" 마케팅 채널
- 소명 측 혜택: 기탄 네트워크 통한 유저 획득 + 브랜드 신뢰도
