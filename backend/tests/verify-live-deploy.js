#!/usr/bin/env node
// Post-deploy verification against the REAL deployed API.
//
// Why this exists: on 2026-07-06 two production bugs shipped past a green unit
// suite and two independent code reviews, because both lived at a boundary the
// unit tests mocked away —
//   * the frontend charged currencies the backend catalog did not have
//   * the backend catalog held currencies the payments CHECK constraint rejected
// Only a real HTTP call against the real database surfaced them.
//
// Run after every deploy:
//   node tests/verify-live-deploy.js
//   API_URL=https://staging... node tests/verify-live-deploy.js
//
// Exits non-zero on any failure so it can gate a deploy.
//
// NOTE: creating an order is the only way to prove the currency path end to end,
// so this creates one real PayPal order per catalog currency. They are never
// captured (no charge) and expire on PayPal's side. They are tagged with
// VERIFY_EMAIL below so they are easy to identify in the payments table.

const { PRODUCTS } = require('../src/config/products');

const API_URL = (process.env.API_URL
  || 'https://0eo64hyuv7.execute-api.ap-northeast-2.amazonaws.com').replace(/\/$/, '');
const ORIGIN = process.env.VERIFY_ORIGIN || 'https://somyung.cc';
const VERIFY_EMAIL = 'deploy-verify@somyung.cc';
const TIMEOUT_MS = 20000;

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON body */ }
    return { status: res.status, json, text, headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

async function checkHealth() {
  console.log('\n[1] Service reachable');
  const res = await req('GET', '/');
  record('GET / returns 200', res.status === 200, `status=${res.status}`);
}

async function checkEveryCatalogCurrency() {
  console.log('\n[2] Order creation for every catalog currency');
  console.log('    (proves: product resolution, PayPal amount formatting, and');
  console.log('     that payments.currency CHECK accepts the currency)');

  for (const product of Object.values(PRODUCTS)) {
    const res = await req('POST', '/payment/paypal/create', {
      amount: product.amount,
      currency: product.currency,
      product_type: product.id,
      description: 'Premium Saju Reading',
      email: VERIFY_EMAIL,
    });

    const ok = res.status === 200
      && res.json?.success === true
      && res.json?.currency === product.currency
      && Number(res.json?.amount) === Number(product.amount)
      && typeof res.json?.paypalOrderId === 'string';

    record(
      `${product.id} (${product.amount} ${product.currency})`,
      ok,
      ok ? `order ${res.json.paypalOrderId}` : `status=${res.status} ${res.json?.error || res.text.slice(0, 120)}`
    );
  }
}

async function checkBackCompatNoProductType() {
  console.log('\n[3] Back-compat: old bundles send currency+amount, no product_type');
  // A cached frontend bundle from before the multi-currency deploy must still
  // be able to create an order — backend deploys before Pages propagates.
  const jpy = PRODUCTS.premium_saju_jpy;
  const res = await req('POST', '/payment/paypal/create', {
    amount: jpy.amount,
    currency: jpy.currency,
    description: 'Premium Saju Reading',
    email: VERIFY_EMAIL,
  });
  const ok = res.status === 200 && res.json?.success === true && res.json?.currency === jpy.currency;
  record('order without product_type resolves server-side', ok,
    ok ? `order ${res.json.paypalOrderId}` : `status=${res.status} ${res.json?.error || ''}`);
}

async function checkClientCannotInventPrice() {
  console.log('\n[4] Server owns the price');
  const res = await req('POST', '/payment/paypal/create', {
    amount: 0.01,
    currency: 'USD',
    description: 'Premium Saju Reading',
    email: VERIFY_EMAIL,
  });
  // Must be rejected outright — never create a $0.01 order.
  const ok = res.status >= 400 && res.status < 500;
  record('client-invented $0.01 price is rejected', ok,
    ok ? `status=${res.status}` : `LEAK: status=${res.status} ${res.text.slice(0, 120)}`);

  const unsupported = await req('POST', '/payment/paypal/create', {
    amount: 4900,
    currency: 'KRW',
    description: 'Premium Saju Reading',
    email: VERIFY_EMAIL,
  });
  const ok2 = unsupported.status >= 400 && unsupported.status < 500;
  record('unsupported currency (KRW) is rejected', ok2, `status=${unsupported.status}`);
}

async function checkReadingCheckSemantics() {
  console.log('\n[5] reading-check pending vs error semantics');
  // A well-formed but unknown claim key means "not ready yet", not a fault.
  const unknownClaim = 'a'.repeat(64);
  const res = await req('GET', `/saju/reading-check?claim=${unknownClaim}`);
  const ok = res.status === 200 && res.json?.status === 'pending';
  record('unknown claim key → 200 pending (no info leak, no false error)', ok,
    `status=${res.status} body.status=${res.json?.status}`);

  const noAuth = await req('GET', '/saju/reading-check');
  const ok2 = noAuth.status === 401;
  record('no claim and no token → 401', ok2, `status=${noAuth.status}`);
}

async function checkPromoValidation() {
  console.log('\n[6] Promo validation');
  const res = await req('POST', '/promo/validate', { code: 'DEFINITELY-NOT-A-REAL-CODE' });
  // Either a 200 {valid:false} or a 4xx is acceptable; a 5xx is not.
  const ok = res.status < 500 && res.json?.valid !== true;
  record('bogus promo code is not accepted', ok, `status=${res.status} valid=${res.json?.valid}`);
}

async function checkSecurityHeaders() {
  console.log('\n[7] Transport hardening');
  const res = await req('GET', '/');
  const nosniff = res.headers.get('x-content-type-options');
  record('X-Content-Type-Options: nosniff', nosniff === 'nosniff', `got=${nosniff}`);
  const poweredBy = res.headers.get('x-powered-by');
  record('X-Powered-By is suppressed', !poweredBy, poweredBy ? `LEAK: ${poweredBy}` : 'absent');
}

(async () => {
  console.log(`Live deploy verification against ${API_URL}`);
  console.log(`Verification orders are tagged ${VERIFY_EMAIL} and are never captured.`);

  try {
    await checkHealth();
    await checkEveryCatalogCurrency();
    await checkBackCompatNoProductType();
    await checkClientCannotInventPrice();
    await checkReadingCheckSemantics();
    await checkPromoValidation();
    await checkSecurityHeaders();
  } catch (err) {
    console.error(`\nVerification aborted: ${err.message}`);
    process.exit(2);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('Deploy verified.');
})();
