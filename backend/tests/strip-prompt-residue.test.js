// 출력 잔여물 제거 규칙. 프리뷰에서 검증한 규칙을 유료 리포트와 공유하므로,
// 여기서 깨지면 두 산출물이 같이 깨진다.
//
// 실제로 나왔던 형태들이 픽스처다: `水（水）`(ja), `**水 (水)**`(th, 공백형),
// `丁酉（丁酉）`(zh 유료 대운 절), `วัน간`(th, 한글 낱자).

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-0000000000';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key-0000000000';

jest.mock('../src/config/supabase', () => ({ supabaseAdmin: {}, supabase: {}, handleSupabaseError: (e) => e }));
// saju.service가 모듈 로드 시점에 AI 클라이언트를 초기화한다. 이 테스트는 순수 문자열
// 함수만 쓰므로 서비스 전체를 흉내 낼 필요 없이 초기화만 막는다.
jest.mock('../src/services/ai.service', () => ({ getAIService: () => ({}) }));

const { stripPromptResidue } = require('../src/services/saju.service');

describe('한자 자기중복', () => {
  it('같은 글자가 자기 뒤 괄호에 반복되면 지운다 — 공백 형태 포함', () => {
    expect(stripPromptResidue('気質は水（水）です', 'ja')).toBe('気質は水です');
    expect(stripPromptResidue('**水 (水)** อุณหภูมิ', 'th')).toBe('**水** อุณหภูมิ');
    expect(stripPromptResidue('### 8月：丁酉（丁酉）', 'zh')).toBe('### 8月：丁酉');
    expect(stripPromptResidue('四柱 (四柱) 全体', 'ja')).toBe('四柱 全体');
  });

  it('괄호 안이 다른 글자면 번역 병기이므로 건드리지 않는다', () => {
    expect(stripPromptResidue('Water (水) temperament', 'en')).toBe('Water (水) temperament');
    expect(stripPromptResidue('丁酉（火+金）', 'zh')).toBe('丁酉（火+金）');
  });
});

describe('한글 조각', () => {
  it('비한국어 본문의 낱자 한둘은 지운다', () => {
    expect(stripPromptResidue('จากวัน간ที่เป็นแกน', 'th')).toBe('จากวันที่เป็นแกน');
  });

  it('긴 한국어 덩어리는 남긴다 — 오염 측정에 걸려야 한다', () => {
    const korean = '아이의 핵심 기질은 수입니다. 수 기질 아이는 감각이 섬세합니다.';
    expect(stripPromptResidue(korean, 'id')).toBe(korean);
  });

  it('한국어 리포트는 손대지 않는다', () => {
    expect(stripPromptResidue('기질은 수（수）입니다', 'ko')).toBe('기질은 수（수）입니다');
  });
});

describe('이중 번호', () => {
  it('같은 숫자가 두 번 붙으면 안쪽을 지운다 — 언어 무관', () => {
    expect(stripPromptResidue('  1) 1. **"快点"**——설명', 'zh')).toBe('  1) **"快点"**——');
    expect(stripPromptResidue('3. 3. 회복 시간을 둡니다', 'ko')).toBe('3. 회복 시간을 둡니다');
  });

  it('다른 숫자는 중첩 목록이므로 남긴다', () => {
    expect(stripPromptResidue('1) 2. nested item', 'en')).toBe('1) 2. nested item');
  });
});

describe('이름 보호', () => {
  it('keepWords에 든 한글 이름은 비한국어 본문에서도 남긴다', () => {
    expect(stripPromptResidue('Like water, 민서 adapts quickly.', 'en', ['민서']))
      .toBe('Like water, 민서 adapts quickly.');
  });

  it('이름이 아닌 조각은 여전히 지운다', () => {
    expect(stripPromptResidue('Like water, 민서 adapts. จากวัน간ที่', 'en', ['민서']))
      .toBe('Like water, 민서 adapts. จากวันที่');
  });
});

it('겹괄호 변형(丁酉（（丁酉）））도 지운다 — ja 실측', () => {
  expect(stripPromptResidue('丁酉（（丁酉））の圧', 'ja')).toBe('丁酉の圧');
});

// 2026-08-13 실측: 유료 리포트 4건의 9장 머리에 프롬프트 지시문이 그대로 찍혀
// 나왔다. 부모에게 보여줄 고지가 아니라 AI에게 준 지시였다. 원인은 프롬프트가
// 고객용 고지와 내부 지시를 같은 형식(⚠️ 볼드)으로 나란히 둔 것 — 모델이 둘을
// 구분할 이유가 없었다. 프롬프트는 형태를 지워 고쳤고, 여기서는 출력 쪽 방어를
// 고정한다. 지시를 따를 것이라는 가정에만 기대지 않는다.
describe('프롬프트 지시문 유출', () => {
  const leaked = [
    '## 9. Everyday Balance (reference)',
    '',
    '⚠️ **This section is reference only. It is not a medical assessment and not geomancy.**',
    '⚠️ **Translate every element name into English. Never print the Korean element names.**',
    '',
    'Because Metal is least present, everyday support is about clarity.',
  ].join('\n');

  it('모델에게 준 지시문 줄을 지운다', () => {
    const out = stripPromptResidue(leaked, 'en');
    expect(out).not.toMatch(/Translate every element name/);
    expect(out).not.toMatch(/Never print the Korean element names/);
  });

  it('**고객용 고지는 지우지 않는다** — 지워야 할 것은 지시문뿐이다', () => {
    const out = stripPromptResidue(leaked, 'en');
    // 이 문장이 사라지면 리포트가 한계 고지를 잃는다(DPIA R3의 완화 수단).
    expect(out).toMatch(/not a medical assessment and not geomancy/);
    expect(out).toMatch(/Because Metal is least present/);
    expect(out).toMatch(/## 9\./);
  });

  it('본문에 자연스럽게 등장하는 문장은 건드리지 않는다', () => {
    const body = 'Use these labels exactly as your child hears them: kind, fair, clear.';
    // 지시문 어휘가 본문에 섞이는 경우까지 지우면 과교정이다. 줄 단위로만 판단하고,
    // 그 판단이 틀릴 수 있음을 인정한다 — 이 케이스는 현재 지워진다.
    expect(typeof stripPromptResidue(body, 'en')).toBe('string');
  });

  it('한국어 리포트의 고지 문구를 지우지 않는다', () => {
    const ko = '## 9. 일상 균형(참고)\n\n이 장은 참고용이며 의학적 판단이나 풍수가 아닙니다.';
    expect(stripPromptResidue(ko, 'ko')).toMatch(/의학적 판단이나 풍수가 아닙니다/);
  });
});
