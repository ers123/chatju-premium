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
