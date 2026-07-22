#!/usr/bin/env node
// Deterministic, local-only Korean reference report. It makes one local
// mansae calculation and intentionally makes no network, database, payment,
// AI request, or secret lookup.

const fs = require('fs');
const path = require('path');
const { generateReportPDF } = require('../src/services/pdf.service');
const { calculateMansae } = require('../src/utils/mansae-wrapper');

const REFERENCE_DATE = '2026-07-22';
const FIXTURE_INPUT = Object.freeze({ birthDate: '2015-11-12', birthTime: '09:26', gender: '여', birthPlace: '서울' });
const ELEMENT_NAMES = Object.freeze({ 목: '목', 화: '화', 토: '토', 금: '금', 수: '수' });
const ELEMENT_HANJA = Object.freeze({ 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' });
const fixtureMansae = calculateMansae(FIXTURE_INPUT.birthDate, FIXTURE_INPUT.birthTime, FIXTURE_INPUT.gender, { birthPlace: FIXTURE_INPUT.birthPlace });

if (fixtureMansae.error) throw new Error(`Reference fixture calculation failed: ${fixtureMansae.error}`);

function buildFixtureBasis(mansae) {
  const pillars = ['year', 'month', 'day', 'hour'].map((key) => mansae.pillars[key].hanja).join('·');
  const dayElement = mansae.pillars.day.element.split(' + ')[0];
  const dayMaster = `${mansae.pillars.day.heavenlyStem}${ELEMENT_NAMES[dayElement]}(${mansae.pillars.day.hanja[0]}${ELEMENT_HANJA[dayElement]})`;
  const distribution = [['목', 'wood'], ['화', 'fire'], ['토', 'earth'], ['금', 'metal'], ['수', 'water']]
    .map(([label, key]) => `${label}${mansae.elements[key]}`).join('·');
  return `현재 산출된 사주(${pillars})에서 일간 ${dayMaster}, 오행 분포 ${distribution}를 기질을 읽는 참고 언어로 보았습니다.`;
}

const fixtureBasis = buildFixtureBasis(fixtureMansae);

const presentation = {
  cover: {
    kicker: '아이의 기질을 오늘의 양육 언어로',
    title: '민서의 속도를 지키는\n양육 참고 리포트',
    child: '민서 | 초등 고학년',
    date: `생성일: ${REFERENCE_DATE}`,
  },
  opening: {
    title: '부모를 위한 30초 요약',
    items: [
      { title: '세 가지 기질', text: '생각을 충분히 정리한 뒤 움직이는 편, 기준이 분명할 때 편안한 편, 낯선 전환에는 시간이 필요한 편입니다.' },
      { title: '이번 달의 초점', text: '시작을 재촉하기보다 예고와 첫 단계로 문턱을 낮춰 주세요. 끝낸 양보다 다시 시작할 수 있었는지를 봅니다.', accent: '#5A7A66' },
      { title: '부모의 한 문장', text: '“지금 다 하지 않아도 돼. 첫 단계만 같이 정해 보자.”', accent: '#556B7E' },
    ],
    note: '이 문서는 사주 명리의 기질 언어를 부모가 관찰할 수 있는 장면과 작은 대응으로 번역한 참고 자료입니다. 아이의 발달, 감정, 선택을 단정하거나 예측하지 않습니다.',
  },
  sections: [
    {
      number: 1,
      title: '한눈에 보는 기질',
      blocks: [{ type: 'insight', title: '보이는 근거에서 오늘의 대응까지', basis: fixtureBasis, behavior: '새 과제 앞에서 먼저 순서와 기준을 확인하고, 준비가 부족하다고 느끼면 시작을 늦출 수 있습니다.', action: '“언제 끝낼까?”보다 “첫 줄과 필요한 준비물은 무엇일까?”를 함께 정해 주세요.' }],
    },
    {
      number: 2,
      title: '오해를 풀어 보는 번역',
      blocks: [
        { type: 'translator', title: '느린 시작', looksLike: '고집을 부리거나 일부러 미루는 것처럼 보입니다.', actual: '실패 가능성을 줄이려고 마음속 순서를 먼저 만들고 있을 수 있습니다.', response: '“하기 싫은지, 어디부터 할지 모르겠는지” 둘 중 하나만 골라 보게 해 주세요.' },
        { type: 'translator', title: '짧은 대답', looksLike: '관심이 없거나 말하기를 거부하는 것처럼 보입니다.', actual: '하루의 자극을 정리할 시간이 아직 필요할 수 있습니다.', response: '귀가 후 15분은 질문 대신 물과 간식, 조용한 시간을 먼저 건네 보세요.' },
      ],
    },
    {
      number: 3,
      title: '세 가지 행동 시그니처',
      blocks: [
        { type: 'insight', title: '1. 시작 전 준비가 길어질 때', basis: '안정과 기준을 중시하는 기질 언어를 참고했습니다.', behavior: '공책을 고르고 책상을 정리하다가 과제 시작이 늦어질 수 있습니다.', action: '준비 시간은 3분 타이머로, 과제는 첫 문제 한 개로 분리해 주세요.' },
        { type: 'insight', title: '2. 수정이 반복될 때', basis: '정확함을 선호하는 패턴을 참고했습니다.', behavior: '틀린 답보다 지운 흔적에 더 오래 머물며 다시 쓰기를 반복할 수 있습니다.', action: '오늘의 기준을 “완벽”이 아니라 “한 번 검토 후 제출”로 함께 적어 주세요.' },
        { type: 'insight', title: '3. 전환에서 말수가 줄 때', basis: '변화 전에 마음의 여백이 필요한 기질을 참고했습니다.', behavior: '게임 종료나 방과후 일정 변경 직후 말이 짧아지거나 표정이 굳을 수 있습니다.', action: '전환 10분 전 예고 후, 끝내는 방법 두 가지 중 하나를 고르게 해 주세요.' },
      ],
    },
    {
      number: 4,
      title: '상황별 대화 플레이북',
      blocks: [
        { type: 'script', title: '숙제를 미루는 저녁', before: '“왜 또 안 했어? 지금 당장 시작해.”', after: '“시작이 막혔구나. 문제 하나와 제목 쓰기 중 무엇부터 할래?”', signal: '고개를 끄덕이거나 한 가지를 고른 뒤 5분 안에 손이 움직이면 충분합니다.' },
        { type: 'script', title: '게임을 끄는 순간', before: '“그만! 바로 꺼.”', after: '“10분 뒤에 끝낼 거야. 저장하고 끌지, 목표 하나를 마치고 끌지 고르자.”', signal: '종료 뒤에도 대화가 이어지거나 다음 행동으로 옮기면 전환이 작동한 것입니다.' },
      ],
    },
    {
      number: 5,
      title: '강점이 자라는 조건',
      blocks: [
        { type: 'insight', title: '꼼꼼함은 책임감의 씨앗', basis: '정리와 기준을 찾는 행동을 강점의 재료로 보았습니다.', behavior: '역할과 마감 기준이 분명하면 끝까지 품질을 챙기는 모습을 보일 수 있습니다.', action: '주 1회 가족의 작은 정리 담당을 맡기고, 기준을 아이와 먼저 합의해 보세요.' },
        { type: 'note', title: '읽는 방법', text: '강점은 직업 예측이 아닙니다. 아이가 편안하게 몰입하는 환경을 찾아보는 관찰의 출발점입니다.' },
      ],
    },
    {
      number: 6,
      title: '이번 시기의 참고 흐름',
      blocks: [{ type: 'timeline', title: '8월부터 11월까지', items: [
        { label: '8월', text: '새 일정은 하루 전 미리 보여 주세요. 적응 속도보다 예고가 있었는지를 관찰합니다.' },
        { label: '9월', text: '학습은 작은 완료 기준을 실험해 보세요. 숙제 양이 아닌 시작 횟수를 기록합니다.' },
        { label: '10월', text: '관계 갈등은 바로 해결보다 감정 이름 붙이기를 먼저 연습합니다.' },
        { label: '11월', text: '잘된 방식을 가족 언어로 남깁니다. “민서에게는 예고가 도움이 됐어.”' },
      ] }, { type: 'note', title: '읽는 방법', text: '이 흐름은 미래를 맞히는 예언이 아닙니다. 계절과 일정 변화에서 아이의 반응을 안전하게 살피기 위한 참고선입니다.' }],
    },
    {
      number: 7,
      title: '7일 양육 실험',
      blocks: [{ type: 'checklist', title: '작고 반복 가능한 한 주', items: [
        { label: '1일', text: '귀가 후 15분 회복 시간을 지키기' }, { label: '2일', text: '숙제 첫 단계만 함께 정하기' }, { label: '3일', text: '전환 10분 전 예고하기' }, { label: '4일', text: '완료 기준을 한 문장으로 적기' }, { label: '5일', text: '실수 한 개를 발견하면 원인만 함께 보기' }, { label: '6일', text: '잘된 전환 한 번을 구체적으로 칭찬하기' }, { label: '7일', text: '아이에게 “무엇이 편했어?” 한 가지만 묻기' },
      ] }, { type: 'note', title: '읽는 방법', text: '저항이 있어도 실험은 실패가 아닙니다. 한 번이라도 시작이 쉬워졌거나 회복 시간이 짧아졌다면 그 조건을 다음 주에도 남겨 보세요.' }],
    },
    {
      number: 8,
      title: '곁에 두는 양육 카드',
      blocks: [{ type: 'parenting-card', title: '스크린샷으로 남겨 두세요', stop: '“왜 이렇게 느려?” “다른 아이는 하는데.” “그 정도도 못 해?”', start: '“첫 단계만 고르자.” “생각할 시간 줄게.” “틀린 곳 한 군데만 같이 보자.”', steps: '즉시: 목소리와 요구를 낮춥니다. 5분 후: 물이나 조용한 자리로 전환합니다. 안정 후: 다음 한 걸음만 다시 합의합니다.' }],
    },
    {
      number: 9,
      title: '읽는 방법과 마무리',
      startOnNewPage: false,
      blocks: [{ type: 'close', title: '민서에게 남기고 싶은 기준', text: '민서의 속도는 고쳐야 할 문제가 아니라, 함께 읽어야 할 신호일 수 있습니다. 오늘 한 번 더 관찰하고, 한 문장만 바꿔 보세요. 아이가 안전하다고 느끼는 순간이 관계의 다음 걸음을 만듭니다.' }, { type: 'note', title: '방법과 한계', text: '방법과 한계: 이 리포트는 사주 명리의 일간과 오행 균형을 문화적 기질 언어로 참고하고, 부모가 관찰할 수 있는 장면과 대응으로 번역합니다. 의료, 발달, 성격 진단이나 미래 예측을 제공하지 않습니다.' }],
    },
  ],
};

function createReferenceParams() {
  return {
    childName: '민서', birthDate: FIXTURE_INPUT.birthDate, gender: 'female', language: 'ko', generatedAt: '2026-07-22T00:00:00.000Z',
    manseryeok: fixtureMansae, aiInterpretation: { presentationStatus: 'ready', presentation },
  };
}

async function main() {
  const output = path.resolve(__dirname, '../../output/pdf/somyung-premium-reference-ko.pdf');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const pdf = await generateReportPDF(createReferenceParams());
  fs.writeFileSync(output, pdf);
  console.log(output);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exit(1); });

module.exports = { FIXTURE_INPUT, fixtureMansae, fixtureBasis, presentation, buildFixtureBasis, createReferenceParams };
