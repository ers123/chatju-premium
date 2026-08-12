// 리포트 생성을 HTTP 요청 밖으로 내보내는 경로.
//
// 지키려는 것 네 가지:
//   1. 비동기로 띄웠으면 요청은 202로 즉시 끝난다(30초 게이트웨이 한도를 넘지 않는다).
//   2. 띄우지 못하면 예전처럼 그 자리에서 만들어 200으로 준다 — 리포트를 잃지 않는다.
//   3. 프로모 소진은 **생성 성공 뒤에만** 일어난다. 실패하면 코드는 다시 쓸 수 있다.
//   4. 같은 claim key로 이미 만들어진 리포트가 있으면 두 번 만들지 않는다.

const readings = [];

jest.mock('../src/config/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: (_col, value) => Promise.resolve({
          count: readings.filter((r) => r.claim_key_hash === value).length,
          error: null,
        }),
      }),
    }),
  },
  handleSupabaseError: (e) => e,
}));

jest.mock('../src/services/saju.service', () => ({
  generateSajuReading: jest.fn(),
}));
jest.mock('../src/services/promo.service', () => ({
  usePromoCode: jest.fn(),
}));

const sajuService = require('../src/services/saju.service');
const promoService = require('../src/services/promo.service');
const { runReportJob, dispatchReportJob, isReportJobEvent, JOB_MARKER } = require('../src/services/report-job');

beforeEach(() => {
  readings.length = 0;
  jest.clearAllMocks();
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  delete process.env.SAJU_ASYNC_REPORTS;
  sajuService.generateSajuReading.mockResolvedValue({ readingId: 'r-1' });
});

describe('isReportJobEvent', () => {
  it('HTTP 이벤트를 잡으로 착각하지 않는다', () => {
    expect(isReportJobEvent({ requestContext: {}, headers: {} })).toBe(false);
    expect(isReportJobEvent(null)).toBe(false);
    expect(isReportJobEvent({ __marker: JOB_MARKER })).toBe(true);
  });
});

describe('runReportJob', () => {
  it('생성 후 프로모를 소진한다 — 순서가 뒤집히면 안 된다', async () => {
    const order = [];
    sajuService.generateSajuReading.mockImplementation(async () => {
      order.push('generate'); return { readingId: 'r-9' };
    });
    promoService.usePromoCode.mockImplementation(async () => { order.push('promo'); });

    await runReportJob({
      reading: { birthDate: '2017-06-14' },
      promo: { promoCodeId: 'p1', email: 'a@b.com' },
    });

    expect(order).toEqual(['generate', 'promo']);
    expect(promoService.usePromoCode).toHaveBeenCalledWith(expect.objectContaining({ readingId: 'r-9' }));
  });

  it('생성이 실패하면 프로모를 소진하지 않는다', async () => {
    sajuService.generateSajuReading.mockRejectedValue(new Error('AI down'));
    await expect(runReportJob({
      reading: {},
      promo: { promoCodeId: 'p1', email: 'a@b.com' },
    })).rejects.toThrow('AI down');
    expect(promoService.usePromoCode).not.toHaveBeenCalled();
  });

  it('같은 claim key의 리포트가 이미 있으면 다시 만들지 않는다', async () => {
    readings.push({ claim_key_hash: 'hash-1' });
    const result = await runReportJob({ reading: { claimKeyHash: 'hash-1' } });
    expect(result.skipped).toBe(true);
    expect(sajuService.generateSajuReading).not.toHaveBeenCalled();
  });
});

describe('dispatchReportJob', () => {
  it('Lambda 밖에서는 인라인으로 실행한다', async () => {
    const dispatch = await dispatchReportJob({ reading: { birthDate: '2017-06-14' } });
    expect(dispatch.mode).toBe('inline');
    expect(sajuService.generateSajuReading).toHaveBeenCalled();
  });

  it('SAJU_ASYNC_REPORTS=0이면 Lambda 안에서도 인라인이다', async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'somyung-prod-api';
    process.env.SAJU_ASYNC_REPORTS = '0';
    const dispatch = await dispatchReportJob({ reading: {} });
    expect(dispatch.mode).toBe('inline');
  });

  it('비동기 호출이 실패하면 인라인으로 되돌아간다 — 리포트를 잃지 않는다', async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'somyung-prod-api';
    jest.doMock('@aws-sdk/client-lambda', () => {
      throw new Error('SDK missing');
    }, { virtual: true });

    const dispatch = await dispatchReportJob({ reading: {} });
    expect(dispatch.mode).toBe('inline');
    expect(sajuService.generateSajuReading).toHaveBeenCalled();
  });
});
