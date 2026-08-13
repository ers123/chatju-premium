#!/usr/bin/env node
// 실사용자 신호 다이제스트 — 별점·환불·전달·형식실패를 한 화면에.
//
// 왜 이것이 다음 신호인가:
//   리포트 품질을 LLM 심판으로 올릴 만큼 올렸다(warmth 2.6→3.1). 그 위는 심판
//   노이즈(동일 텍스트 재채점 ±0.67)에 묻혀서, 더 올려도 올랐는지 알 수 없다.
//   돈을 낸 사람의 별점과 환불은 노이즈가 없다. 대신 표본이 느리게 쌓이므로,
//   **프롬프트 버전별로** 모아야 나중에 비교가 된다.
//
// AI를 한 번도 부르지 않는다. 전부 DB 집계다.
//
// 사용법:
//   node scripts/report-signals.js            # 최근 90일
//   DAYS=30 node scripts/report-signals.js
//   JSON=1 node scripts/report-signals.js     # 기계용 출력

require('dotenv').config();

const { supabaseAdmin } = require('../src/config/supabase');

const DAYS = Number(process.env.DAYS || 90);
const AS_JSON = process.env.JSON === '1';

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
const mean = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : '—');

function groupBy(rows, key) {
  return rows.reduce((acc, r) => { (acc[r[key] || 'unknown'] ||= []).push(r); return acc; }, {});
}

(async () => {
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();

  const [readingsRes, paymentsRes, feedbackRes] = await Promise.all([
    supabaseAdmin.from('readings')
      .select('id, language, product_type, created_at, email_status, ai_interpretation, delivery_email')
      .gte('created_at', since),
    supabaseAdmin.from('payments')
      .select('id, status, amount, currency, created_at, refunded_at, status_checked_at')
      .gte('created_at', since),
    supabaseAdmin.from('report_feedback')
      .select('reading_id, rating, comment, language, prompt_version, created_at')
      .gte('created_at', since),
  ]);

  const readings = readingsRes.data || [];
  const payments = paymentsRes.data || [];
  // 마이그레이션 008 미실행이면 여기서 에러가 난다 — 다이제스트를 죽이지 말고 알린다.
  const feedbackAvailable = !feedbackRes.error;
  const feedback = feedbackRes.data || [];

  // 리포트에서 프롬프트 버전을 꺼내 붙인다(리포트 쪽 집계용).
  const enriched = readings.map((r) => ({
    ...r,
    promptVersion: r.ai_interpretation?.metadata?.promptVersion || 'v1-or-unknown',
    presentationStatus: r.ai_interpretation?.presentationStatus || 'unknown',
  }));

  const digest = {
    window: { days: DAYS, since },
    reports: {
      total: enriched.length,
      byLanguage: Object.fromEntries(Object.entries(groupBy(enriched, 'language')).map(([k, v]) => [k, v.length])),
      byPromptVersion: Object.fromEntries(Object.entries(groupBy(enriched, 'promptVersion')).map(([k, v]) => [k, v.length])),
      // presentation 시스템 도입 전 리포트는 status 자체가 없다. 분모에 넣으면
      // ready율이 영원히 낮게 나온다(실측 18.2% — 그중 6건이 그냥 옛날 리포트였다).
      readyRate: pct(
        enriched.filter((r) => r.presentationStatus === 'ready').length,
        enriched.filter((r) => r.presentationStatus !== 'unknown').length
      ),
      readyMeasured: enriched.filter((r) => r.presentationStatus !== 'unknown').length,
      fallbackReasons: enriched.filter((r) => r.presentationStatus === 'fallback')
        .reduce((acc, r) => { const k = r.ai_interpretation?.presentationStatusReason || 'unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
      emailFailed: enriched.filter((r) => r.email_status === 'failed').length,
      emailPending: enriched.filter((r) => r.delivery_email && !r.email_status).length,
    },
    money: {
      payments: payments.length,
      completed: payments.filter((p) => p.status === 'completed').length,
      refunded: payments.filter((p) => p.status === 'refunded').length,
      failed: payments.filter((p) => p.status === 'failed').length,
      refundRate: pct(payments.filter((p) => p.status === 'refunded').length, payments.filter((p) => ['completed', 'refunded'].includes(p.status)).length),
      // 폴링을 언제 마지막으로 돌렸는가. 오래됐으면 환불률을 믿으면 안 된다.
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
      comments: feedback.filter((f) => f.comment).map((f) => ({ rating: f.rating, language: f.language, comment: f.comment })),
    } : { unavailable: 'report_feedback 테이블 없음 — migrations/008_feedback_and_refunds.sql 실행 필요' },
  };

  if (AS_JSON) { console.log(JSON.stringify(digest, null, 2)); return; }

  console.log(`\n━━━ SoMyung 사용자 신호 (최근 ${DAYS}일) ━━━\n`);
  console.log(`리포트 ${digest.reports.total}건 · ready ${digest.reports.readyRate} (계측 대상 ${digest.reports.readyMeasured}건)`);
  if (Object.keys(digest.reports.fallbackReasons).length) {
    console.log(`  fallback 사유: ${Object.entries(digest.reports.fallbackReasons).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  }
  console.log(`  언어: ${Object.entries(digest.reports.byLanguage).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`);
  console.log(`  프롬프트: ${Object.entries(digest.reports.byPromptVersion).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`);
  if (digest.reports.emailFailed) console.log(`  ⚠ 이메일 실패 ${digest.reports.emailFailed}건`);

  console.log(`\n결제 ${digest.money.payments}건 · 완료 ${digest.money.completed} · 환불 ${digest.money.refunded} · 실패 ${digest.money.failed}`);
  console.log(`  환불률 ${digest.money.refundRate}`);
  console.log(`  마지막 상태 동기화: ${digest.money.lastStatusCheck || '**한 번도 없음 — scripts/sync-payment-status.js 실행 전까지 환불률은 믿을 수 없다**'}`);

  if (digest.feedback.unavailable) {
    console.log(`\n평가: ${digest.feedback.unavailable}`);
  } else {
    const f = digest.feedback;
    console.log(`\n평가 ${f.responses}건 (응답률 ${f.responseRate}) · 평균 ${f.mean}`);
    console.log(`  분포: ${[5, 4, 3, 2, 1].map((n) => `${n}★ ${f.distribution[n]}`).join(' · ')}`);
    if (Object.keys(f.byPromptVersion).length) {
      console.log('  프롬프트 버전별:');
      Object.entries(f.byPromptVersion).forEach(([k, v]) => console.log(`    ${k}: n=${v.n} 평균 ${v.mean}`));
    }
    if (f.comments.length) {
      console.log('\n  코멘트:');
      f.comments.forEach((c) => console.log(`    ${c.rating}★ [${c.language}] ${c.comment.slice(0, 160)}`));
    }
  }

  // 표본이 적을 때 과잉해석을 막는다. 이 서비스의 결제는 현재 한 자릿수다.
  const paid = digest.money.completed + digest.money.refunded;
  if (paid < 30) console.log(`\n※ 결제 표본 ${paid}건 — 환불률은 아직 방향 지표일 뿐이다. 30건 넘기 전에는 단일 환불에 반응하지 말 것.`);
  if (!digest.feedback.unavailable && digest.feedback.responses < 20) console.log(`※ 평가 ${digest.feedback.responses}건 — 프롬프트 버전 비교는 버전당 20건부터.`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
