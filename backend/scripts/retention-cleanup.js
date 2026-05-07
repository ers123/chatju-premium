#!/usr/bin/env node

require('dotenv').config();

const { supabaseAdmin } = require('../src/config/supabase');

const DRY_RUN = process.env.DRY_RUN !== 'false';
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

async function main() {
  console.log('[Retention] Starting cleanup', {
    dryRun: DRY_RUN,
    readingRetentionDays: READING_RETENTION_DAYS,
    paymentRetentionDays: PAYMENT_RETENTION_DAYS,
  });

  const readings = await cleanupOldReadings();
  const promoUsage = await cleanupOldPromoUsage();
  const payments = await anonymizeOldPayments();

  console.log('[Retention] Summary', {
    readings,
    promoUsage,
    payments,
    dryRun: DRY_RUN,
  });
}

main().catch(error => {
  console.error('[Retention] Failed:', error.message);
  process.exit(1);
});
