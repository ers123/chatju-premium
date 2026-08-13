// 동의 증적의 계약.
//
// 왜 이 파일이 있나: 2026-08-13 점검에서, 화면은 4개 동의를 따로 받는데 저장된
// 증적에는 3개만 남고 있었다. 클라이언트가 개인정보처리 동의와 **국외이전 동의를
// AND 로 합쳐** 한 필드로 보냈고, 합쳐진 값에서는 둘을 되분리할 수 없었다.
// 즉 "국외이전에 동의했는가"라는 질문에 DB가 답할 수 없는 상태였다 —
// 정작 그 동의야말로 OpenAI·Anthropic·Google 로 아이 데이터가 나가는 근거인데.
//
// 지키려는 것:
//   1. 법이 별개로 요구하는 동의는 증적에서도 별개다.
//   2. "보내지 않음"과 "거부함"은 다른 값이다. 섞이면 구버전 사용자가 거부자로
//      기록되고, 그 반대도 된다.
//   3. 필수 동의가 없으면 리포트를 만들지 않는다(유료·프로모 동일).

// 라우트 모듈은 최상단에서 Supabase 설정을 요구하는 서비스들을 끌고 온다.
// 여기서 검사하려는 것은 순수 함수 하나이므로, 그 의존성들을 세우지 않는다.
jest.mock('../src/config/supabase', () => ({ supabaseAdmin: {}, handleSupabaseError: (e) => e }));
jest.mock('../src/middleware/rateLimit', () => {
  const pass = (_req, _res, next) => next();
  return new Proxy({}, { get: (_t, k) => (k === 'createRateLimiter' ? () => pass : pass) });
});
jest.mock('../src/middleware/auth', () => { const m = (_q, _s, n) => n(); m.optionalAuth = m; m.requireAdmin = m; return m; });
jest.mock('../src/services/saju.service', () => ({}));
jest.mock('../src/services/promo.service', () => ({}));
jest.mock('../src/services/reportLookupOtp.service', () => ({}));
jest.mock('../src/services/report-job', () => ({ dispatchReportJob: jest.fn() }));

const { validateConsent } = require('../src/routes/saju.routes');

const base = {
  dataProcessing: true,
  guardian: true,
  userAge14: true,
  crossBorder: true,
  marketing: false,
  policyVersion: '2026-06-12',
  timestamp: '2026-08-13T00:00:00.000Z',
};

describe('필수 동의', () => {
  test('법정대리인 동의가 없으면 거부한다', () => {
    expect(validateConsent({ ...base, guardian: false }).ok).toBe(false);
  });

  test('개인정보 처리 동의가 없으면 거부한다', () => {
    expect(validateConsent({ ...base, dataProcessing: false }).ok).toBe(false);
  });

  test('동의 객체 자체가 없으면 거부한다', () => {
    expect(validateConsent(undefined).ok).toBe(false);
    expect(validateConsent(null).ok).toBe(false);
    expect(validateConsent('true').ok).toBe(false);
  });

  test('문자열 "true" 같은 유사값은 동의가 아니다', () => {
    expect(validateConsent({ ...base, guardian: 'true' }).ok).toBe(false);
    expect(validateConsent({ ...base, dataProcessing: 1 }).ok).toBe(false);
  });
});

describe('국외이전 동의는 별개로 기록된다', () => {
  test('동의하면 true 로 남는다', () => {
    const { normalized } = validateConsent(base);
    expect(normalized.crossBorder).toBe(true);
    // 개인정보처리 동의와 같은 칸에 합쳐지지 않는다.
    expect(normalized.dataProcessing).toBe(true);
  });

  test('거부하면 false 로 남는다 — dataProcessing 을 덮어쓰지 않는다', () => {
    const { ok, normalized } = validateConsent({ ...base, crossBorder: false });
    expect(ok).toBe(true);
    expect(normalized.crossBorder).toBe(false);
    expect(normalized.dataProcessing).toBe(true);
  });

  test('필드를 보내지 않던 구버전 클라이언트는 null — 거부(false)와 구분된다', () => {
    const { crossBorder, ...noField } = base;
    const { normalized } = validateConsent(noField);
    expect(normalized.crossBorder).toBeNull();
    expect(normalized.crossBorder).not.toBe(false);
  });
});

describe('증적의 나머지', () => {
  test('서버 시각과 IP 를 스스로 기록한다 — 클라이언트 시각만 믿지 않는다', () => {
    const { normalized } = validateConsent(base, { ip: '203.0.113.9', language: 'ko' });
    expect(normalized.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(normalized.ip).toBe('203.0.113.9');
    expect(normalized.language).toBe('ko');
    expect(normalized.timestamp).toBe('2026-08-13T00:00:00.000Z');
  });

  test('정책 버전을 남긴다 — 어떤 문구에 동의했는지가 증적의 핵심이다', () => {
    expect(validateConsent(base).normalized.policyVersion).toBe('2026-06-12');
  });

  test('마케팅 동의는 선택이고 기본이 false 다', () => {
    const { marketing, ...noMarketing } = base;
    expect(validateConsent(noMarketing).normalized.marketing).toBe(false);
  });

  test('깨진 timestamp 는 null 로 떨어지고 recordedAt 은 살아 있다', () => {
    const { normalized } = validateConsent({ ...base, timestamp: 'not-a-date' });
    expect(normalized.timestamp).toBeNull();
    expect(normalized.recordedAt).toBeTruthy();
  });

  test('증적에 아이 개인정보가 섞이지 않는다', () => {
    // 동의 기록은 "무엇에 동의했는가"의 증거지, 데이터 사본이 아니다.
    const { normalized } = validateConsent({ ...base, birthDate: '2018-05-05', subjectName: '민서' });
    expect(Object.keys(normalized).sort()).toEqual([
      'crossBorder', 'dataProcessing', 'guardian', 'ip', 'language',
      'marketing', 'policyVersion', 'recordedAt', 'timestamp', 'userAge14',
    ]);
  });
});
