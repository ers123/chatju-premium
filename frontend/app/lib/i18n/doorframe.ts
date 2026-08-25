import type { Language } from './translations'

/**
 * Doorframe redesign copy (docs/redesign-plan-doorframe.md §Phase 1/4).
 * Kept out of translations.ts so the 437KB file is touched once, in Phase 4.
 * ko/en are authored now; the other eight languages fall back to en until
 * Phase 4 fills them (deliberate: en is the largest paying market).
 */
export interface DoorframeCopy {
  /** MARK n / 5 caption next to the logo */
  markOf: (n: number, total: number) => string
  /** E-question headline + sub per step (1–5) */
  q: { title: string; sub: string }[]
  /** rail labels */
  childFallback: string
  motherShort: string
  fatherShort: string
  familyLine: string
  /** pencil micro-notes */
  noteNameReady: (name: string) => string
  noteZodiac: (name: string, animal: string) => string
  noteHourPending: string
  noteHourSet: string
  noteParentMark: (who: string) => string
  noteFamilyDone: (name: string) => string
  /** buttons */
  drawNext: string
  drawLast: string
  /** casting overlay pillar names */
  pillars: [string, string, string, string]
  /** landing questions band (E-copy) */
  band: {
    floats: string[]
    title1: string
    titleAccent: string
    title2: string
    sub: string
  }
}

const ko: DoorframeCopy = {
  markOf: (n, total) => `눈금 ${n} / ${total}`,
  q: [
    { title: '누굴 닮은 걸까요 — 먼저, 이름부터', sub: '풀이에서 아이를 이름으로 부르기 위해서만 쓰고, 저장하지 않습니다.' },
    { title: '왜 그런 걸까요 — 태어난 날이 바탕입니다', sub: '기둥에 첫 눈금이 그어집니다.' },
    { title: '그 시각의 하늘까지', sub: '시각을 알면 네 번째 기둥, 시주까지 읽을 수 있어요. 몰라도 괜찮습니다.' },
    { title: '당신의 눈금도 함께 그어 볼까요', sub: '부모의 사주를 알면 아이와의 합까지 풀 수 있어요. 건너뛰어도 됩니다.' },
    { title: '이제 나란히 섰습니다', sub: '적은 내용을 확인하고, 동의만 남았어요.' },
  ],
  childFallback: '아이',
  motherShort: '엄마',
  fatherShort: '아빠',
  familyLine: '가족의 눈금',
  noteNameReady: (name) => `${name} — 좋은 이름이에요. 이제 이름으로 부를게요.`,
  noteZodiac: (name, animal) => `${animal} ${name} — 기둥에 첫 눈금이 준비됐어요`,
  noteHourPending: '시각을 넣으면 마지막 기둥이 밝혀져요',
  noteHourSet: '네 기둥이 모두 준비됐어요',
  noteParentMark: (who) => `${who}의 눈금이 아이 곁에 그어졌어요`,
  noteFamilyDone: (name) => `${name}의 곁에, 가족의 눈금이 나란히 섰어요`,
  drawNext: '눈금 긋고 다음으로',
  drawLast: '이제 풀이를 시작할게요',
  pillars: ['년주', '월주', '일주', '시주'],
  band: {
    floats: [
      '왜 이렇게 낯을 가릴까',
      '누굴 닮은 걸까',
      '혼자 노는 걸 좋아하는 게 괜찮은 걸까',
      '왜 한 가지에만 저렇게 빠져들까',
      '내가 잘 키우고 있는 걸까',
      '뭘 좋아하는 아이로 자랄까',
      '동생이랑은 왜 이렇게 다를까',
    ],
    title1: '아이에 대한 질문이 많다는 건,',
    titleAccent: '그만큼 깊이 보고 있다',
    title2: '는 뜻입니다',
    sub: '그 질문들에, 태어난 순간의 기록으로 답해 드립니다.',
  },
}

const en: DoorframeCopy = {
  markOf: (n, total) => `Mark ${n} / ${total}`,
  q: [
    { title: 'Who do they take after? — First, a name', sub: 'Used only to call your child by name in the reading. Never stored.' },
    { title: 'Why are they like this? — It starts with their birth day', sub: 'The first mark goes on the doorframe.' },
    { title: 'Down to the hour of that sky', sub: 'With the hour we can read the fourth pillar. It is fine not to know.' },
    { title: 'Shall we draw your mark too?', sub: 'With a parent’s chart we can read your match with your child. You may skip this.' },
    { title: 'Now you stand side by side', sub: 'Check what you wrote — only consent remains.' },
  ],
  childFallback: 'child',
  motherShort: 'Mom',
  fatherShort: 'Dad',
  familyLine: 'family marks',
  noteNameReady: (name) => `${name} — a lovely name. We’ll use it from here.`,
  noteZodiac: (name, animal) => `${animal} ${name} — the first mark is ready`,
  noteHourPending: 'Add the hour to light the last pillar',
  noteHourSet: 'All four pillars are ready',
  noteParentMark: (who) => `${who}’s mark now sits beside your child’s`,
  noteFamilyDone: (name) => `Beside ${name}, the family’s marks stand together`,
  drawNext: 'Draw the mark, continue',
  drawLast: 'Begin the reading',
  pillars: ['Year', 'Month', 'Day', 'Hour'],
  band: {
    floats: [
      'Why so shy with strangers?',
      'Who do they take after?',
      'Is it okay that they love playing alone?',
      'Why do they fixate on one thing?',
      'Am I raising them well?',
      'What will they grow to love?',
      'Why are they so different from their sibling?',
    ],
    title1: 'Having many questions about your child means',
    titleAccent: 'you are watching them closely',
    title2: '',
    sub: 'We answer those questions with the record of the moment they were born.',
  },
}

const byLang: Partial<Record<Language, DoorframeCopy>> = { ko, en }

export function doorframeCopy(lang: Language): DoorframeCopy {
  return byLang[lang] ?? en
}
