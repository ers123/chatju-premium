#!/usr/bin/env node
// PayPal에 실제 결제 상태를 물어 DB와 맞춘다 — 환불을 잡기 위한 것이다.
//
// 왜 폴링인가:
//   환불 처리 코드는 웹훅 경로에 있는데, `PAYPAL_WEBHOOK_ID`가 없으면 프로덕션
//   웹훅은 fail-closed로 **거부된다**(middleware/webhookVerify.js). 그리고 그 값은
//   지금 .env에 없다. 즉 오늘 환불이 일어나도 우리 DB는 'completed'로 남는다.
//   웹훅을 켜려면 PayPal 대시보드에서 사람이 등록해야 하므로, 그때까지(그리고
//   그 뒤에도 누락 대비로) 이 스크립트가 진실을 가져온다.
//
// 안전:
//   기본은 DRY RUN. `APPLY=1`일 때만 DB를 고친다. 상태를 completed로 되돌리는
//   일은 하지 않는다 — 이 스크립트는 환불/취소를 **발견**하는 쪽으로만 움직인다.
//
// 사용법:
//   node scripts/sync-payment-status.js              # 드라이런
//   APPLY=1 node scripts/sync-payment-status.js      # 반영
//   DAYS=90 APPLY=1 node scripts/sync-payment-status.js

require('dotenv').config();

const axios = require('axios');
const { supabaseAdmin } = require('../src/config/supabase');

const APPLY = process.env.APPLY === '1';
const DAYS = Number(process.env.DAYS || 180);

async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    `${process.env.PAYPAL_API_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.access_token;
}

/**
 * PayPal 주문의 캡처 상태. COMPLETED / REFUNDED / PARTIALLY_REFUNDED / DECLINED …
 * 주문이 사라졌거나 접근할 수 없으면 null — 그런 경우는 건드리지 않는다.
 */
async function fetchCaptureStatus(token, paypalOrderId) {
  try {
    const res = await axios.get(
      `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const capture = res.data?.purchase_units?.[0]?.payments?.captures?.[0];
    return capture?.status || res.data?.status || null;
  } catch (err) {
    const code = err.response?.status;
    console.warn(`  ! ${paypalOrderId} 조회 실패 (${code || err.message})`);
    return null;
  }
}

const REFUND_STATES = new Set(['REFUNDED', 'PARTIALLY_REFUNDED']);
const FAILED_STATES = new Set(['DECLINED', 'FAILED', 'VOIDED']);

(async () => {
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();
  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select('id, order_id, payment_key, status, amount, currency, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  console.log(`대상 결제 ${payments.length}건 (최근 ${DAYS}일)`);
  if (!payments.length) return;

  const token = await getAccessToken();
  let changed = 0;

  for (const p of payments) {
    if (!p.payment_key) { console.log(`  - ${p.order_id} paypal 주문 ID 없음 — 건너뜀`); continue; }
    const remote = await fetchCaptureStatus(token, p.payment_key);
    if (!remote) continue;

    const shouldBe = REFUND_STATES.has(remote) ? 'refunded'
      : FAILED_STATES.has(remote) ? 'failed'
        : null; // COMPLETED 등 — 되돌리지 않는다

    const line = `  ${p.order_id} ${p.amount} ${p.currency} | DB ${p.status} / PayPal ${remote}`;
    if (!shouldBe || shouldBe === p.status) { console.log(`${line} — 일치`); continue; }

    console.log(`${line} → ${shouldBe} ${APPLY ? '(반영)' : '(드라이런)'}`);
    changed++;
    if (!APPLY) continue;

    const { data: existing } = await supabaseAdmin.from('payments').select('metadata').eq('id', p.id).maybeSingle();
    const { error: upErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: shouldBe,
        refunded_at: shouldBe === 'refunded' ? new Date().toISOString() : null,
        status_source: 'poll',
        status_checked_at: new Date().toISOString(),
        // 구매자 이메일·product_type이 여기 들어 있다. 병합만 한다.
        metadata: { ...(existing?.metadata || {}), paypal_capture_status: remote },
      })
      .eq('id', p.id);
    if (upErr) console.error(`    ! 업데이트 실패: ${upErr.message}`);
  }

  // 확인만 하고 지나간 건들도 검사 시각을 남긴다 — "언제까지 봤는가"를 알아야
  // 폴링 공백을 계산할 수 있다.
  if (APPLY) {
    await supabaseAdmin
      .from('payments')
      .update({ status_checked_at: new Date().toISOString() })
      .gte('created_at', since)
      .eq('status', 'completed');
  }

  console.log(`\n${changed ? `${changed}건 불일치` : '불일치 없음'}${APPLY ? '' : ' — APPLY=1로 반영'}`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
