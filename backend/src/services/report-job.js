// 유료·프로모 리포트 생성을 HTTP 요청 밖으로 내보낸다.
//
// 왜:
//   리포트 한 건을 만드는 데 40~50초가 걸린다. Lambda 타임아웃은 60초지만 그 앞의
//   **API Gateway는 30초에서 끊는다**(HTTP API의 고정 한도. 늘릴 수 없다). 그래서
//   정상적으로 성공하는 리포트조차 클라이언트에게는 503으로 보였다. Lambda는 계속
//   돌아서 리포트를 끝내고, 프론트가 claim key 폴링으로 주워 담아 왔다 — 사용자 피해는
//   없었지만 **결제한 사람이 에러 응답을 한 번 받는 경로**였고, 폴링이 실패하면 그대로
//   실패였다.
//
// 어떻게:
//   요청 핸들러는 검증만 끝내고 같은 Lambda를 **비동기(Event) 호출**한 뒤 202를 준다.
//   워커 호출은 API Gateway 뒤에 있지 않으므로 60초를 다 쓸 수 있다. 클라이언트는
//   이미 있는 `GET /saju/reading-check?claim=`으로 결과를 받아 간다.
//
// 하지 않은 것:
//   "202를 먼저 보내고 같은 호출 안에서 계속 생성하기"는 안 된다. serverless-http가
//   응답을 끝내는 순간 핸들러 프로미스가 resolve되고 Lambda는 컨테이너를 얼린다.
//   남은 작업은 다음 호출 때 재개되거나 그냥 사라진다. 결제 경로에 쓸 수 없다.
//
// 안전장치 세 가지:
//   1. 디스패치가 어떤 이유로든 실패하면 **그 자리에서 동기 생성으로 되돌아간다**.
//      최악의 경우 오늘과 똑같이 동작한다(503 + 폴링). 리포트를 잃지는 않는다.
//   2. 워커는 claim key 해시로 **이미 만들어진 리포트가 있으면 그냥 끝낸다**. 비동기
//      호출이 재시도되더라도 같은 사람에게 리포트가 두 번 만들어지지 않는다.
//   3. `SAJU_ASYNC_REPORTS=0`이면 전부 동기로 돌아간다. 재배포 없이 끌 수 있다.

// supabase는 필요할 때 불러온다. 이 모듈은 라우트가 최상단에서 require하는데,
// 모듈 로드 시점에 Supabase 설정을 요구하면 그 설정이 없는 테스트·도구가 전부 깨진다.
const JOB_MARKER = 'somyung.report-job';

function asyncEnabled() {
  // 명시적으로 끈 경우가 아니면 켜져 있다. Lambda 밖(로컬·테스트)에서는 어차피
  // 호출할 함수가 없으므로 아래 dispatch가 인라인으로 떨어진다.
  return process.env.SAJU_ASYNC_REPORTS !== '0';
}

function isReportJobEvent(event) {
  return !!event && event.__marker === JOB_MARKER;
}

/**
 * 같은 claim key로 만들어진 리포트가 이미 있는가.
 * 판단이 불가능하면 false — 리포트를 안 만드는 것보다 중복 위험이 낫다.
 */
async function readingAlreadyExists(claimKeyHash) {
  if (!claimKeyHash) return false;
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { count, error } = await supabaseAdmin
      .from('readings')
      .select('id', { count: 'exact', head: true })
      .eq('claim_key_hash', claimKeyHash);
    if (error) return false;
    return (count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * 워커. HTTP 요청이 아니라 Lambda 이벤트로 들어온다.
 *
 * @param {object} job - { __marker, reading, promo? }
 * @param {object} job.reading - generateSajuReading에 그대로 넘길 파라미터
 * @param {object} [job.promo] - 성공 후 소진할 프로모 { promoCodeId, email, childName, childBirthDate }
 */
async function runReportJob(job) {
  const sajuService = require('./saju.service');
  const promoService = require('./promo.service');
  const params = job.reading || {};

  if (await readingAlreadyExists(params.claimKeyHash)) {
    console.log('[Report Job] Reading already exists for this claim key — skipping');
    return { skipped: true };
  }

  const reading = await sajuService.generateSajuReading(params);

  // 프로모는 생성 성공 뒤에 소진한다. 실패했으면 코드는 다시 쓸 수 있어야 한다.
  if (job.promo) {
    await promoService.usePromoCode({
      promoCodeId: job.promo.promoCodeId,
      email: job.promo.email,
      childName: job.promo.childName,
      childBirthDate: job.promo.childBirthDate,
      readingId: reading.readingId,
    });
  }

  // 프로모 리포트는 돈이 0원이라 payments에 흔적이 없다. 퍼널에서 빠지면 "리포트는
  // 나갔는데 결제가 없다"로 보인다. 비동기·인라인 폴백 둘 다 이 함수를 지난다 —
  // 동기 경로는 라우트에서 따로 센다(같은 요청이 두 경로를 타지는 않는다).
  if (job.promo) {
    const { recordFunnelEvent, EVENTS } = require('./funnel.service');
    await recordFunnelEvent(EVENTS.PROMO_REPORT, params.language);
  }

  console.log('[Report Job] Done:', { readingId: reading.readingId, promo: !!job.promo });
  // reading 본문은 인라인 폴백에서 쓴다. 비동기 호출의 반환값은 아무도 읽지 않는다.
  return { readingId: reading.readingId, reading };
}

/**
 * 잡을 비동기로 띄운다. 띄우지 못하면 그 자리에서 동기로 실행한다.
 *
 * @returns {Promise<{mode: 'async'|'inline', reading?: object}>}
 *   mode==='inline'이면 reading에 완성된 리포트가 들어 있다(오늘까지의 동작).
 */
async function dispatchReportJob(payload) {
  const job = { ...payload, __marker: JOB_MARKER };
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (!functionName || !asyncEnabled()) {
    const result = await runReportJob(job);
    return { mode: 'inline', reading: result.reading, result };
  }

  try {
    // nodejs20.x 런타임이 SDK v3를 들고 있다. 없으면 아래 catch로 떨어진다.
    const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
    const client = new LambdaClient({ region: process.env.AWS_REGION });
    await client.send(new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify(job)),
    }));
    console.log('[Report Job] Dispatched async:', { promo: !!job.promo });
    return { mode: 'async' };
  } catch (err) {
    // 권한이 없거나 SDK가 없거나 throttle에 걸렸다. 오늘까지의 동작으로 되돌아간다.
    console.error('[Report Job] Async dispatch failed, running inline:', err.message);
    const result = await runReportJob(job);
    return { mode: 'inline', reading: result.reading, result };
  }
}

module.exports = { dispatchReportJob, runReportJob, isReportJobEvent, JOB_MARKER };
