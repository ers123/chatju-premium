#!/usr/bin/env node

require('dotenv').config();

const { supabaseAdmin } = require('../src/config/supabase');

// CLI 기본은 드라이런 — 손으로 돌릴 때 실수로 지우지 않게. 스케줄 경로는
// runRetentionCleanup({ apply: true }) 로 명시적으로 켠다.
let DRY_RUN = process.env.DRY_RUN !== 'false';
const READING_RETENTION_DAYS = Number(process.env.READING_RETENTION_DAYS || 365);
const PAYMENT_RETENTION_DAYS = Number(process.env.PAYMENT_RETENTION_DAYS || 1825);

function cutoffIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function sanitizePaymentMetadata(metadata) {
  return {
    anonymized: true,
    anonymized_at: new Date().toISOString(),
    retained_for: 'commerce_tax_refund_dispute_audit',
    paypal_order_id: metadata?.paypal_order_id || undefined,
    confirmed_at: metadata?.confirmed_at || undefined,
  };
}

async function selectIds(table, cutoffColumn, cutoff) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .lt(cutoffColumn, cutoff)
    .limit(1000);

  if (error) throw error;
  return data || [];
}

async function cleanupOldReadings() {
  const cutoff = cutoffIso(READING_RETENTION_DAYS);
  const rows = await selectIds('readings', 'created_at', cutoff);

  if (!DRY_RUN && rows.length > 0) {
    const { error } = await supabaseAdmin
      .from('readings')
      .delete()
      .in('id', rows.map(row => row.id));
    if (error) throw error;
  }

  return { cutoff, count: rows.length };
}

async function cleanupOldPromoUsage() {
  const cutoff = cutoffIso(READING_RETENTION_DAYS);
  const rows = await selectIds('promo_usage', 'used_at', cutoff);

  if (!DRY_RUN && rows.length > 0) {
    const { error } = await supabaseAdmin
      .from('promo_usage')
      .delete()
      .in('id', rows.map(row => row.id));
    if (error) throw error;
  }

  return { cutoff, count: rows.length };
}

async function anonymizeOldPayments() {
  const cutoff = cutoffIso(PAYMENT_RETENTION_DAYS);
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, metadata')
    .lt('created_at', cutoff)
    .or('metadata->>anonymized.is.null,metadata->>anonymized.eq.false')
    .limit(1000);

  if (error) throw error;
  const rows = data || [];

  if (!DRY_RUN) {
    for (const row of rows) {
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          user_id: null,
          metadata: sanitizePaymentMetadata(row.metadata || {}),
        })
        .eq('id', row.id);
      if (updateError) throw updateError;
    }
  }

  return { cutoff, count: rows.length };
}

async function main(options = {}) {
  if (typeof options.apply === 'boolean') DRY_RUN = !options.apply;
  console.log('[Retention] Starting cleanup', {
    dryRun: DRY_RUN,
    readingRetentionDays: READING_RETENTION_DAYS,
    paymentRetentionDays: PAYMENT_RETENTION_DAYS,
  });

  const readings = await cleanupOldReadings();
  const promoUsage = await cleanupOldPromoUsage();
  const payments = await anonymizeOldPayments();

  const summary = { readings, promoUsage, payments, dryRun: DRY_RUN };
  console.log('[Retention] Summary', summary);
  return summary;
}

/**
 * 보존기간 초과 데이터 삭제. EventBridge 스케줄과 CLI가 **같은 코드**를 쓴다.
 *
 * 왜 스케줄인가: 보존기간 정책이 문서에만 있고 실행이 사람 기억에 달려 있으면
 * 그건 정책이 아니다. 아동 생년월일이 무기한 쌓이는 쪽으로 조용히 실패한다.
 * (2026-08-13 점검에서 실제로 그 상태였다 — 주간 신호만 스케줄에 있었다.)
 */
async function runRetentionCleanup(options = {}) {
  return main(options);
}

module.exports = { runRetentionCleanup };

// CLI로 직접 실행할 때만 돈다. require 되는 경우(Lambda)에는 돌지 않는다.
if (require.main === module) {
  main().catch(error => {
    console.error('[Retention] Failed:', error.message);
    process.exit(1);
  });
}
