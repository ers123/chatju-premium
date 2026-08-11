#!/usr/bin/env node
// Retry undelivered premium report emails.
//
// Why: the report email is a paid deliverable, but it is sent at the tail of a
// Lambda invocation that has already spent 40-50s on AI generation. If the
// 60s budget runs out mid-send, the reading is safely persisted (it is written
// before the email is attempted) but email_status never advances past
// 'pending'. A send that raises leaves 'failed'. Either way the customer paid
// and got no email.
//
// This sweeper finds those rows and re-sends. The reading itself is untouched.
//
// Usage:
//   node scripts/retry-report-emails.js              # dry run — lists targets, sends nothing
//   node scripts/retry-report-emails.js --send       # actually send
//   node scripts/retry-report-emails.js --send --max-attempts=5
//
// Dry run is the default on purpose: this sends real mail to real customers.

require('dotenv').config();

const { supabaseAdmin } = require('../src/config/supabase');
const { createAccessToken } = require('../src/utils/accessToken');
const emailService = require('../src/services/email.service');
const logger = require('../src/utils/logger');

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const MAX_ATTEMPTS = Number(
  (args.find((a) => a.startsWith('--max-attempts=')) || '--max-attempts=3').split('=')[1]
);
// Don't race a send that is still in flight in a live Lambda.
const MIN_AGE_MINUTES = 10;
// Don't resurrect ancient rows by default: a months-old report arriving out of
// the blue reads as spam. Override deliberately with --max-age-days= when
// backfilling a known incident.
const MAX_AGE_DAYS = Number(
  (args.find((a) => a.startsWith('--max-age-days=')) || '--max-age-days=30').split('=')[1]
);

async function fetchStuckReadings() {
  const now = Date.now();
  const notBefore = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const notAfter = new Date(now - MIN_AGE_MINUTES * 60 * 1000).toISOString();

  const select = async (columns) => supabaseAdmin
    .from('readings')
    .select(columns)
    .not('delivery_email', 'is', null)
    .neq('email_status', 'sent')
    .gte('created_at', notBefore)
    .lte('created_at', notAfter)
    .order('created_at', { ascending: true });

  const columns = 'id, delivery_email, subject_name, saju_data, ai_interpretation, birth_date, gender, language, email_status, email_attempts, created_at';
  let { data, error } = await select(columns);

  // Graceful degrade if migration 007 has not been applied yet.
  if (error && /email_attempts/i.test(error.message || '')) {
    console.warn('[retry-emails] email_attempts column missing — retry capping disabled. Run migrations/007_email_attempts.sql');
    ({ data, error } = await select(columns.replace(', email_attempts', '')));
  }

  if (error) throw new Error(`Failed to query readings: ${error.message}`);
  return data || [];
}

async function resend(reading) {
  const reportAccessToken = createAccessToken({
    purpose: 'report',
    readingId: reading.id,
    email: reading.delivery_email.toLowerCase().trim(),
  }, 24 * 60 * 60);

  await emailService.sendReportEmail({
    email: reading.delivery_email,
    childName: reading.subject_name,
    readingId: reading.id,
    manseryeok: reading.saju_data,
    aiInterpretation: reading.ai_interpretation,
    birthDate: reading.birth_date,
    gender: reading.gender,
    language: reading.language || 'ko',
    reportAccessToken,
  });
}

async function markResult(reading, ok) {
  const patch = ok
    ? { email_status: 'sent', email_sent_at: new Date().toISOString() }
    : { email_status: 'failed' };
  if (reading.email_attempts !== undefined) {
    patch.email_attempts = (reading.email_attempts || 0) + 1;
  }
  const { error } = await supabaseAdmin.from('readings').update(patch).eq('id', reading.id);
  if (error) console.error(`[retry-emails] could not update status for ${reading.id}: ${error.message}`);
}

(async () => {
  console.log(SEND ? 'MODE: SEND (real emails will go out)' : 'MODE: DRY RUN (no email will be sent)');

  const stuck = await fetchStuckReadings();
  const capped = stuck.filter((r) => (r.email_attempts || 0) < MAX_ATTEMPTS);
  const skipped = stuck.length - capped.length;

  console.log(`Found ${stuck.length} undelivered report email(s) aged ${MIN_AGE_MINUTES}min-${MAX_AGE_DAYS}d.`);
  if (skipped) console.log(`  ${skipped} skipped (already at ${MAX_ATTEMPTS} attempts).`);

  for (const r of capped) {
    const label = `${r.id.slice(0, 8)} ${logger.maskEmail(r.delivery_email)} status=${r.email_status} attempts=${r.email_attempts ?? 'n/a'} created=${r.created_at}`;

    if (!r.ai_interpretation) {
      // Nothing worth sending — the reading itself is empty.
      console.log(`  SKIP  ${label} (no ai_interpretation)`);
      continue;
    }
    if (!SEND) {
      console.log(`  WOULD SEND  ${label}`);
      continue;
    }

    try {
      await resend(r);
      await markResult(r, true);
      console.log(`  SENT  ${label}`);
    } catch (err) {
      await markResult(r, false);
      console.log(`  FAIL  ${label} — ${err.message}`);
    }
  }

  if (!SEND && capped.length) {
    console.log('\nRe-run with --send to deliver these.');
  }
  console.log('Done.');
  process.exit(0);
})().catch((err) => {
  console.error(`[retry-emails] fatal: ${err.message}`);
  process.exit(1);
});
