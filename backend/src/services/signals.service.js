// 실사용자 신호 — 수집·집계·요약.
//
// CLI(`npm run signals`)와 주간 스케줄(Lambda EventBridge)이 **같은 코드**를 쓴다.
// 스크립트에 로직을 두고 Lambda에 복사하면 둘이 서서히 갈라지고, 그러면 사람이
// 보는 숫자와 메일로 오는 숫자가 달라진다.
//
// AI를 한 번도 부르지 않는다. 전부 DB 집계 + PayPal 조회다.

const axios = require('axios');
const { supabaseAdmin } = require('../config/supabase');
const { getFunnelSummary, renderFunnelText } = require('./funnel.service');

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
const mean = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : '—');

function groupBy(rows, key) {
  return rows.reduce((acc, r) => { (acc[r[key] || 'unknown'] ||= []).push(r); return acc; }, {});
}

// ── PayPal 상태 동기화 ─────────────────────────────────────────────────────
// 환불 처리 코드는 웹훅 경로에 있는데, PAYPAL_WEBHOOK_ID가 없으면 프로덕션 웹훅은
// fail-closed로 거부된다. 웹훅을 켜더라도 누락은 생길 수 있으므로, 진실은 주기적으로
// PayPal에 직접 물어서 맞춘다.

const REFUND_STATES = new Set(['REFUNDED', 'PARTIALLY_REFUNDED']);
const FAILED_STATES = new Set(['DECLINED', 'FAILED', 'VOIDED']);

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    `${process.env.PAYPAL_API_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

async function fetchCaptureStatus(token, paypalOrderId) {
  try {
    const res = await axios.get(
      `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const capture = res.data?.purchase_units?.[0]?.payments?.captures?.[0];
    return capture?.status || res.data?.status || null;
  } catch (err) {
    return { error: err.response?.status || err.message };
  }
}

/**
 * DB 결제 상태를 PayPal의 실제 상태에 맞춘다.
 * completed로 **되돌리지는 않는다** — 이 함수는 환불·실패를 발견하는 쪽으로만 움직인다.
 *
 * @param {{ apply?: boolean, days?: number }} opts
 * @returns {Promise<{checked:number, changes:Array, errors:Array, applied:boolean}>}
 */
async function syncPaymentStatuses({ apply = false, days = 180 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('id, order_id, payment_key, status, amount, currency, created_at')
    .gte('created_at', since);
  if (error) throw new Error(error.message);

  const result = { checked: 0, changes: [], errors: [], applied: apply };
  if (!payments.length) return result;

  // PayPal 자격증명이 없으면 조용히 건너뛴다 — 다이제스트 전체를 실패시키지 않는다.
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_API_BASE_URL) {
    result.errors.push('PayPal credentials not configured — skipped');
    return result;
  }

  const token = await getPayPalAccessToken();

  for (const p of payments) {
    if (!p.payment_key) continue;
    const remote = await fetchCaptureStatus(token, p.payment_key);
    if (remote && remote.error) { result.errors.push(`${p.order_id}: ${remote.error}`); continue; }
    if (!remote) continue;
    result.checked++;

    const shouldBe = REFUND_STATES.has(remote) ? 'refunded'
      : FAILED_STATES.has(remote) ? 'failed'
        : null;
    if (!shouldBe || shouldBe === p.status) continue;

    result.changes.push({ orderId: p.order_id, from: p.status, to: shouldBe, remote, amount: p.amount, currency: p.currency });
    if (!apply) continue;

    // metadata에는 구매자 이메일과 product_type이 들어 있다. 병합만 한다.
    const { data: existing } = await supabaseAdmin.from('payments').select('metadata').eq('id', p.id).maybeSingle();
    await supabaseAdmin
      .from('payments')
      .update({
        status: shouldBe,
        refunded_at: shouldBe === 'refunded' ? new Date().toISOString() : null,
        status_source: 'poll',
        status_checked_at: new Date().toISOString(),
        metadata: { ...(existing?.metadata || {}), paypal_capture_status: remote },
      })
      .eq('id', p.id);
  }

  // "언제까지 확인했는가"를 남긴다 — 폴링 공백을 계산할 수 있어야 환불률을 믿는다.
  if (apply) {
    await supabaseAdmin
      .from('payments')
      .update({ status_checked_at: new Date().toISOString() })
      .gte('created_at', since)
      .eq('status', 'completed');
  }

  return result;
}

// ── 다이제스트 ─────────────────────────────────────────────────────────────

async function buildDigest({ days = 90 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [readingsRes, paymentsRes, feedbackRes, funnel] = await Promise.all([
    supabaseAdmin.from('readings')
      .select('id, language, product_type, created_at, email_status, ai_interpretation, delivery_email')
      .gte('created_at', since),
    supabaseAdmin.from('payments')
      .select('id, status, amount, currency, created_at, refunded_at, status_checked_at')
      .gte('created_at', since),
    supabaseAdmin.from('report_feedback')
      .select('reading_id, rating, comment, language, prompt_version, created_at')
      .gte('created_at', since),
    // 퍼널은 자체적으로 실패를 삼킨다(테이블 없으면 unavailable) — 다이제스트 전체를
    // 넘어뜨리지 않는다.
    getFunnelSummary({ days }).catch((e) => ({ unavailable: `퍼널 집계 실패: ${e.message}` })),
  ]);

  const readings = readingsRes.data || [];
  const payments = paymentsRes.data || [];
  const feedbackAvailable = !feedbackRes.error;
  const feedback = feedbackRes.data || [];

  const enriched = readings.map((r) => ({
    ...r,
    promptVersion: r.ai_interpretation?.metadata?.promptVersion || 'v1-or-unknown',
    presentationStatus: r.ai_interpretation?.presentationStatus || 'unknown',
  }));
  // presentation 시스템 도입 전 리포트는 status 자체가 없다. 분모에 넣으면 ready율이
  // 영원히 낮게 나온다(첫 실행에서 18.2%로 보였는데, 그중 6건이 그냥 옛날 리포트였다).
  const measurable = enriched.filter((r) => r.presentationStatus !== 'unknown');

  return {
    window: { days, since },
    funnel,
    reports: {
      total: enriched.length,
      byLanguage: Object.fromEntries(Object.entries(groupBy(enriched, 'language')).map(([k, v]) => [k, v.length])),
      byPromptVersion: Object.fromEntries(Object.entries(groupBy(enriched, 'promptVersion')).map(([k, v]) => [k, v.length])),
      readyRate: pct(measurable.filter((r) => r.presentationStatus === 'ready').length, measurable.length),
      readyMeasured: measurable.length,
      fallbackReasons: enriched.filter((r) => r.presentationStatus === 'fallback')
        .reduce((acc, r) => { const k = r.ai_interpretation?.presentationStatusReason || 'unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
      emailFailed: enriched.filter((r) => r.email_status === 'failed').length,
    },
    money: {
      payments: payments.length,
      completed: payments.filter((p) => p.status === 'completed').length,
      refunded: payments.filter((p) => p.status === 'refunded').length,
      failed: payments.filter((p) => p.status === 'failed').length,
      refundRate: pct(
        payments.filter((p) => p.status === 'refunded').length,
        payments.filter((p) => ['completed', 'refunded'].includes(p.status)).length
      ),
      lastStatusCheck: payments.map((p) => p.status_checked_at).filter(Boolean).sort().pop() || null,
    },
    feedback: feedbackAvailable ? {
      responses: feedback.length,
      responseRate: pct(feedback.length, enriched.length),
      mean: mean(feedback.map((f) => f.rating)),
      distribution: [1, 2, 3, 4, 5].reduce((acc, n) => { acc[n] = feedback.filter((f) => f.rating === n).length; return acc; }, {}),
      byPromptVersion: Object.fromEntries(Object.entries(groupBy(feedback, 'prompt_version'))
        .map(([k, v]) => [k, { n: v.length, mean: mean(v.map((f) => f.rating)) }])),
      byLanguage: Object.fromEntries(Object.entries(groupBy(feedback, 'language'))
        .map(([k, v]) => [k, { n: v.length, mean: mean(v.map((f) => f.rating)) }])),
      comments: feedback.filter((f) => f.comment)
        .sort((a, b) => a.rating - b.rating) // 낮은 별점부터 — 고칠 것이 거기 있다
        .map((f) => ({ rating: f.rating, language: f.language, comment: f.comment })),
      lowRatings: feedback.filter((f) => f.rating <= 2).length,
    } : { unavailable: 'report_feedback 테이블 없음 — migrations/008 실행 필요' },
  };
}

/** 사람이 읽는 형태. 콘솔과 메일이 같은 문자열을 쓴다. */
function renderDigestText(digest, sync = null) {
  const L = [];
  const d = digest;
  L.push(`SoMyung 사용자 신호 (최근 ${d.window.days}일)`);
  L.push('');
  // 퍼널이 먼저다. 리포트·결제 숫자만 보면 "적다"까지만 알고 어디서 끊겼는지는 모른다.
  L.push(renderFunnelText(d.funnel));
  L.push('');
  L.push(`리포트 ${d.reports.total}건 · ready ${d.reports.readyRate} (계측 대상 ${d.reports.readyMeasured}건)`);
  if (Object.keys(d.reports.fallbackReasons).length) {
    L.push(`  fallback: ${Object.entries(d.reports.fallbackReasons).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  }
  L.push(`  언어: ${Object.entries(d.reports.byLanguage).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`);
  L.push(`  프롬프트: ${Object.entries(d.reports.byPromptVersion).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`);
  if (d.reports.emailFailed) L.push(`  ⚠ 이메일 실패 ${d.reports.emailFailed}건`);

  L.push('');
  L.push(`결제 ${d.money.payments}건 · 완료 ${d.money.completed} · 환불 ${d.money.refunded} · 실패 ${d.money.failed}`);
  L.push(`  환불률 ${d.money.refundRate}`);
  L.push(`  마지막 상태 동기화: ${d.money.lastStatusCheck || '없음'}`);
  if (sync) {
    L.push(`  이번 동기화: ${sync.checked}건 확인${sync.applied ? '' : ' (드라이런)'}${sync.changes.length ? ` · 변경 ${sync.changes.length}건` : ' · 변경 없음'}`);
    sync.changes.forEach((c) => L.push(`    ! ${c.orderId} ${c.amount} ${c.currency}: ${c.from} → ${c.to} (PayPal ${c.remote})`));
    sync.errors.forEach((e) => L.push(`    ? ${e}`));
  }

  L.push('');
  if (d.feedback.unavailable) {
    L.push(`평가: ${d.feedback.unavailable}`);
  } else {
    const f = d.feedback;
    L.push(`평가 ${f.responses}건 (응답률 ${f.responseRate}) · 평균 ${f.mean}`);
    L.push(`  분포: ${[5, 4, 3, 2, 1].map((n) => `${n}★ ${f.distribution[n]}`).join(' · ')}`);
    Object.entries(f.byPromptVersion).forEach(([k, v]) => L.push(`  ${k}: n=${v.n} 평균 ${v.mean}`));
    if (f.comments.length) {
      L.push('');
      L.push('  코멘트 (낮은 별점부터):');
      f.comments.forEach((c) => L.push(`    ${c.rating}★ [${c.language}] ${c.comment.slice(0, 200)}`));
    }
  }

  // 표본이 적을 때 과잉해석을 막는다.
  const paid = d.money.completed + d.money.refunded;
  L.push('');
  if (paid < 30) L.push(`※ 결제 표본 ${paid}건 — 환불률은 방향 지표일 뿐. 30건 전에는 단일 환불에 반응하지 말 것.`);
  if (!d.feedback.unavailable && d.feedback.responses < 20) L.push(`※ 평가 ${d.feedback.responses}건 — 프롬프트 버전 비교는 버전당 20건부터.`);
  return L.join('\n');
}

/**
 * 주간 자동 실행 — 동기화 + 집계 + 메일.
 * 사람이 매주 두 명령을 치는 대신 Lambda 스케줄이 부른다.
 */
async function runWeeklySignals({ days = 90, apply = true, notify = true } = {}) {
  const sync = await syncPaymentStatuses({ apply, days: 180 }).catch((e) => ({
    checked: 0, changes: [], errors: [`sync failed: ${e.message}`], applied: apply,
  }));
  const digest = await buildDigest({ days });
  const text = renderDigestText(digest, sync);

  let notified = false;
  if (notify) {
    try {
      const { sendOpsDigest } = require('./email.service');
      // 제목에 결정적인 숫자를 넣는다 — 메일을 열지 않고도 이번 주를 안다.
      const flags = [];
      if (sync.changes.length) flags.push(`환불/실패 ${sync.changes.length}`);
      if (!digest.feedback.unavailable && digest.feedback.lowRatings) flags.push(`저평가 ${digest.feedback.lowRatings}`);
      if (digest.reports.emailFailed) flags.push(`메일실패 ${digest.reports.emailFailed}`);
      const funnelPart = digest.funnel && !digest.funnel.unavailable
        ? ` · 프리뷰 ${digest.funnel.totals.preview}→구매 ${digest.funnel.totals.purchase}`
        : '';
      const subject = `SoMyung 주간 신호 — 리포트 ${digest.reports.total} · 평가 ${digest.feedback.responses ?? 0}${funnelPart}${flags.length ? ` · ⚠ ${flags.join(', ')}` : ''}`;
      await sendOpsDigest({ subject, text });
      notified = true;
    } catch (err) {
      console.error('[Signals] digest email failed:', err.message);
    }
  }

  return { digest, sync, text, notified };
}

module.exports = { syncPaymentStatuses, buildDigest, renderDigestText, runWeeklySignals };
