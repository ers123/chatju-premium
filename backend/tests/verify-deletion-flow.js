/**
 * Live verification: items 2 (fail-closed delete) + 3 (payment metadata preserve).
 * Creates a uniquely-named test user in prod Supabase, seeds payment/reading/promo rows,
 * calls deleteUser() directly, then asserts the expected end state.
 *
 * Run: cd backend && set -a && source .env && set +a && node tests/verify-deletion-flow.js
 */

const { supabaseAdmin } = require('../src/config/supabase');
const { deleteUser } = require('../src/services/auth.service');

const TAG = `__verify_${Date.now()}`;
const TEST_EMAIL = `${TAG}@example.invalid`;
const FAKE_CAPTURE_ID = `CAP-${TAG}`;
const FAKE_ORDER_ID = `ORD-${TAG}`;

const results = [];
function assert(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  console.log(`\n=== Verifying deletion flow (tag: ${TAG}) ===\n`);

  // 1) Create test user in Supabase Auth
  const { data: authData, error: authCreateErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
      user_metadata: { verification_tag: TAG },
    });
  if (authCreateErr) throw new Error(`createUser failed: ${authCreateErr.message}`);
  const userId = authData.user.id;
  console.log(`[setup] auth.users row created: ${userId}`);

  // 2) Upsert into public.users (mirrors signUp flow)
  const { error: userInsertErr } = await supabaseAdmin
    .from('users')
    .upsert([{ id: userId, email: TEST_EMAIL, language_preference: 'ko' }], { onConflict: 'id' });
  if (userInsertErr) throw new Error(`users insert: ${userInsertErr.message}`);

  // 3) Seed a payment with rich metadata (simulates a captured PayPal payment)
  const paypalCapture = {
    capture_id: FAKE_CAPTURE_ID,
    payer: { email_address: TEST_EMAIL },
    amount: { currency_code: 'KRW', value: '4900' },
    captured_at: new Date().toISOString(),
  };
  const { data: paymentRow, error: paymentErr } = await supabaseAdmin
    .from('payments')
    .insert([{
      user_id: userId,
      order_id: FAKE_ORDER_ID,
      amount: 4900,
      currency: 'KRW',
      status: 'completed',
      payment_key: FAKE_ORDER_ID,
      metadata: {
        paypal_order_id: FAKE_ORDER_ID,
        email: TEST_EMAIL,
        created_at: new Date().toISOString(),
        paypal_capture: paypalCapture,
        confirmed_at: new Date().toISOString(),
      },
    }])
    .select()
    .single();
  if (paymentErr) throw new Error(`payment insert: ${paymentErr.message}`);
  console.log(`[setup] payment seeded: ${paymentRow.id} (capture=${FAKE_CAPTURE_ID})`);

  // 4) Seed a reading owned by user
  const { data: readingRow, error: readingErr } = await supabaseAdmin
    .from('readings')
    .insert([{
      user_id: userId,
      birth_date: '2020-01-15',
      birth_time: '14:00',
      gender: 'female',
      subject_name: `child_${TAG}`,
      saju_data: { pillars: {} },
      ai_interpretation: { overview: 'verification stub' },
      language: 'ko',
      product_type: 'premium_saju',
      delivery_email: TEST_EMAIL,
    }])
    .select().single();
  if (readingErr) throw new Error(`reading insert: ${readingErr.message}`);
  console.log(`[setup] reading seeded: ${readingRow.id}`);

  // 5) Seed an orphan reading (user_id NULL, matches delivery_email)
  const { data: orphanRow, error: orphanErr } = await supabaseAdmin
    .from('readings')
    .insert([{
      user_id: null,
      birth_date: '2021-03-10',
      birth_time: '09:00',
      gender: 'male',
      subject_name: `orphan_${TAG}`,
      saju_data: { pillars: {} },
      ai_interpretation: { overview: 'orphan stub' },
      language: 'ko',
      product_type: 'premium_saju',
      delivery_email: TEST_EMAIL,
    }])
    .select().single();
  if (orphanErr) throw new Error(`orphan reading: ${orphanErr.message}`);
  console.log(`[setup] orphan reading seeded: ${orphanRow.id}`);

  // 6) Seed a promo_usage row
  const { error: promoErr } = await supabaseAdmin
    .from('promo_usage')
    .insert([{
      promo_code_id: '00000000-0000-0000-0000-000000000000',
      user_email: TEST_EMAIL,
      child_name: `child_${TAG}`,
      child_birth_date: '2020-01-15',
    }]);
  if (promoErr) {
    console.warn(`[setup] promo_usage insert skipped (FK or column mismatch): ${promoErr.message}`);
  } else {
    console.log(`[setup] promo_usage seeded for ${TEST_EMAIL}`);
  }

  console.log(`\n=== Running deleteUser(${userId}) ===\n`);
  await deleteUser(userId);
  console.log(`\n=== Verifying post-delete state ===\n`);

  // A) auth.users gone (item 2 — fail-closed worked)
  const { data: authAfter } = await supabaseAdmin.auth.admin.getUserById(userId);
  assert('auth.users row removed', !authAfter?.user, authAfter?.user ? `still exists: ${authAfter.user.email}` : 'gone');

  // B) public.users gone
  const { data: usersRow } = await supabaseAdmin.from('users').select('id').eq('id', userId).maybeSingle();
  assert('public.users row removed', !usersRow);

  // C) readings owned by user gone
  const { data: readingsAfter } = await supabaseAdmin.from('readings').select('id').eq('user_id', userId);
  assert('readings (user-owned) removed', (readingsAfter || []).length === 0, `${(readingsAfter||[]).length} left`);

  // D) orphan reading gone
  const { data: orphanAfter } = await supabaseAdmin.from('readings').select('id').eq('id', orphanRow.id).maybeSingle();
  assert('readings (orphan) removed', !orphanAfter);

  // E) promo_usage gone
  const { data: promoAfter } = await supabaseAdmin.from('promo_usage').select('id').eq('user_email', TEST_EMAIL);
  assert('promo_usage rows removed', (promoAfter || []).length === 0, `${(promoAfter||[]).length} left`);

  // F) payment preserved, anonymized, metadata.paypal_capture intact (item 3)
  const { data: paymentAfter } = await supabaseAdmin.from('payments').select('*').eq('id', paymentRow.id).maybeSingle();
  assert('payment row preserved', !!paymentAfter);
  if (paymentAfter) {
    assert('payment user_id set to NULL', paymentAfter.user_id === null, `got: ${paymentAfter.user_id}`);
    assert('metadata.anonymized = true', paymentAfter.metadata?.anonymized === true);
    assert('metadata.anonymized_at present', !!paymentAfter.metadata?.anonymized_at);
    const cap = paymentAfter.metadata?.paypal_capture;
    assert(
      'metadata.paypal_capture.capture_id preserved',
      cap?.capture_id === FAKE_CAPTURE_ID,
      `got: ${cap?.capture_id || 'MISSING'}`
    );
    assert('metadata.paypal_order_id preserved', paymentAfter.metadata?.paypal_order_id === FAKE_ORDER_ID);
  }

  // Cleanup: remove the test payment row (keep data clean — this preserves audit
  // but we don't want test stubs in prod)
  await supabaseAdmin.from('payments').delete().eq('id', paymentRow.id);
  console.log(`\n[cleanup] deleted verification payment row ${paymentRow.id}`);

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== ${passed}/${results.length} checks passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(2);
});
