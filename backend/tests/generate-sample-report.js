#!/usr/bin/env node
/**
 * Generate a sample premium report for testing
 * Usage: node tests/generate-sample-report.js
 */
require('dotenv').config();

const { calculateMansae } = require('../src/utils/mansae-wrapper');
const { calculateFullFortuneCycles } = require('../src/services/daeun.service');
const { getAIService } = require('../src/services/ai.service');
const fs = require('fs');

async function main() {
  const ai = getAIService();

  // Calculate data
  const child = calculateMansae('2015-11-12', '09:26', '여', { birthPlace: '서울' });
  const dad = calculateMansae('1979-04-05', '12:35', '남', { birthPlace: '서울' });
  const cycles = calculateFullFortuneCycles(child, '2015-11-12', '여', 2026);

  const systemPrompt = `당신은 부모-자녀 관계 전문 사주 상담사입니다.

**명리학 핵심 철학 (반드시 준수):**
1. 사주는 타고난 기질(命)을 보여줄 뿐, 운명을 결정하지 않습니다. 같은 사주도 환경(運)에 따라 전혀 다른 삶.
2. 완벽한 사주는 존재하지 않습니다. 모든 사주에 고유한 강점과 성장 포인트.
3. 재물운 = 꿈을 펼칠 자원이 갖춰지는 시기 (복권이 아님)
4. 대운(大運) = 10년 주기 환경 변화 (행운이 아님)
5. 궁합 = 관계를 효율적으로 유지하는 법 (운명 판정이 아님)
6. 삼재, 원진살, 도화살 등 공포 유발 개념 사용 절대 금지

**작성 원칙:**
- 부정적 측면은 "성장 포인트"로 재프레이밍
- 구체적 대화/행동 예시 포함
- 점술 용어 대신 일상 언어
- 반드시 ## 1. ~ ## 8. 형식의 8개 섹션
- 전체 최소 2500자 이상`;

  const currentDaeun = cycles.currentDaeun;
  const currentSeun = cycles.currentSeun;

  const userPrompt = `아이를 더 깊이 이해하고 관계의 갈등을 줄이고 싶어서 찾아온 아빠입니다.

**진태양시 보정:** ${child.corrections.note} (보정 시각: ${child.corrections.adjustedTime})

━━━ 아이 사주 데이터 ━━━

| 구분 | 천간 | 지지 | 오행 |
|------|------|------|------|
| 년주 | ${child.pillars.year.korean[0]} | ${child.pillars.year.korean[1]} | ${child.pillars.year.element} |
| 월주 | ${child.pillars.month.korean[0]} | ${child.pillars.month.korean[1]} | ${child.pillars.month.element} |
| 일주 | ${child.pillars.day.korean[0]} | ${child.pillars.day.korean[1]} | ${child.pillars.day.element} |
| 시주 | ${child.pillars.hour.korean[0]} | ${child.pillars.hour.korean[1]} | ${child.pillars.hour.element} |

**일간:** 큰 강/바다(임수) — 지혜롭고 포용력 있지만 감정의 파도가 깊음
**일주 강약:** 신약(身弱) — 월령 지원 약함, 섬세하고 적응력 좋지만 자신감 키워줘야
**현재 나이:** 12세 (한국 나이) — 초등 고학년(11~13세)
**오행 분포:** 목2 화1 토3(강함) 금0(없음!) 수2
**주 기질:** 토(흙) — 안정 추구, 신뢰형, 실용적
**부족 오행:** 금(쇠) — 모호함/실패에 취약

━━━ 아빠 사주 데이터 ━━━

| 구분 | 천간 | 지지 | 오행 |
|------|------|------|------|
| 년주 | ${dad.pillars.year.korean[0]} | ${dad.pillars.year.korean[1]} | ${dad.pillars.year.element} |
| 월주 | ${dad.pillars.month.korean[0]} | ${dad.pillars.month.korean[1]} | ${dad.pillars.month.element} |
| 일주 | ${dad.pillars.day.korean[0]} | ${dad.pillars.day.korean[1]} | ${dad.pillars.day.element} |
| 시주 | ${dad.pillars.hour.korean[0]} | ${dad.pillars.hour.korean[1]} | ${dad.pillars.hour.element} |

**아빠 일간:** 큰 강/바다(임수)
**아빠 오행:** 목2 화3(강함) 토2 금0(없음!) 수1
**부모-자녀 오행 관계:** 동일 오행(수×수) — 서로 이해가 빠르지만 같은 약점도 공유. 아빠가 자신의 단점을 아이에게서 발견하면 과잉 반응할 수 있음.

━━━ 대운/세운 데이터 ━━━

**현재 대운:** ${currentDaeun ? `${currentDaeun.pillar?.korean} (${currentDaeun.ageRange})` : '?'}
**현재 세운:** ${currentSeun ? `${currentSeun.pillar?.korean} (${currentSeun.year}년)` : '?'}
**향후 대운:** ${cycles.daeunList.slice(0, 4).map(d => `${d.pillar?.korean}(${d.startAge}세)`).join(' → ')}

━━━ 프리미엄 리포트 작성 요청 (8개 섹션) ━━━

## 1. 사주 핵심 프로필 (~500자)
임수 일간, 신약, 토 강, 금 부재. 초등 고학년에 맞는 구체적 일상 예시.

## 2. 부모-자녀 관계 분석 (~500자)
아빠(수/화강) × 딸(수/토강) 동일 일간. 궁합이 아닌 "관계를 효율적으로 유지하는 법".

## 3. 연령별 발달 가이드 (~500자)
초등 고학년(11~13세): 숙제, 친구갈등, 게임/미디어 과몰입 상황별 대응표.

## 4. 진로/적성 심층 분석 (~400자)
강점 영역, 학습 스타일, 미래 방향성.

## 5. 대운/세운 운세 흐름 (~500자)
무자 대운 + 병오 세운. 대운은 "무대 배경 전환"으로 해석.

## 6. 월별 운세 리포트 (~400자)
2026년 3~6월 각 달 학업/교우/가정 에너지.

## 7. 오행 밸런스 & 개운법 (~300자)
금(金) 부재 보완: 색상, 음식, 활동, 방향.

## 8. 이번 주 실천 과제 (~200자)
오늘부터 바로 실행할 5가지 미션.`;

  console.error('Generating premium 8-section report...');
  const start = Date.now();

  const result = await ai.generateFortune([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { maxTokens: 4000, temperature: 0.7 });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.error(`Done: ${elapsed}s, ${result.content.length} chars, ${result.tokensUsed} tokens, ${result.model}`);

  // Build final markdown
  const md = `# 소명(SoMyung) 프리미엄 사주 리포트

> **아이:** 2015년 11월 12일 09:26 서울 출생 (여)
> **아빠:** 1979년 4월 5일 12:35 서울 출생 (남)
> **생성일:** ${new Date().toISOString().split('T')[0]}
> **AI:** ${result.model} | ${elapsed}초 | ${result.tokensUsed} tokens

---

### 사주팔자 (四柱八字)

|  | 년주 | 월주 | 일주 | 시주 |
|------|------|------|------|------|
| **아이** | 을미(乙未) | 정해(丁亥) | **임진(壬辰)** | 갑진(甲辰) |
| **아빠** | 기미(己未) | 정묘(丁卯) | **임인(壬寅)** | 병오(丙午) |

**일간:** 부녀 모두 **임수(壬水)** — 큰 강/바다의 기운
**진태양시 보정:** ${child.corrections.note} (보정 시각: ${child.corrections.adjustedTime})

### 오행 분포

| 오행 | 아이 | 아빠 |
|------|------|------|
| 목(木) | 2 | 2 |
| 화(火) | 1 | **3** |
| 토(土) | **3** | 2 |
| 금(金) | **0** | **0** |
| 수(水) | 2 | 1 |

### 현재 운세 흐름

- **아이 대운:** ${currentDaeun?.pillar?.korean} (${currentDaeun?.ageRange})
- **올해 세운:** ${currentSeun?.pillar?.korean} (${currentSeun?.year}년)

---

${result.content}

---

*이 리포트는 소명(SoMyung) AI 사주 분석 서비스에서 생성되었습니다.*
*현대 명리학의 철학을 바탕으로, 공포가 아닌 성장의 관점에서 해석합니다.*
`;

  // Write to file and stdout
  fs.writeFileSync('/tmp/somyung-sample-report.md', md);
  console.log(md);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
