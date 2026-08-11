// backend/src/services/reportLookupOtp.service.js
// Email-possession OTP for the report lookup flow.
//
// Security model:
// - 6-digit numeric code, stored sha256-HASHED (never plaintext)
// - 10-minute TTL
// - max 5 verification attempts, then the OTP is invalidated
// - single-use: deleted on successful verification
//
// Primary store: Supabase table `report_lookup_otp`
//   (see migrations/003_security_otp_consent.sql — run it in the Supabase SQL Editor)
// Fallback store: in-memory Map. This is NOT durable across Lambda instances —
// it only exists so the flow degrades instead of hard-failing if the table is missing.
// TODO migrate to durable store: run migrations/003_security_otp_consent.sql so the
//      DB table is always used; remove the in-memory fallback afterwards.

const crypto = require('crypto');

// Lazy require — keeps this module loadable without Supabase env config
// (matches the lazy pattern used by the route handlers / tests).
function getSupabaseAdmin() {
  return require('../config/supabase').supabaseAdmin;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// In-memory fallback (per-process). See TODO above.
const memoryStore = new Map();

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function hashOtp(email, code) {
  return crypto
    .createHash('sha256')
    .update(`${normalizeEmail(email)}:${code}`)
    .digest('hex');
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function pruneMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) memoryStore.delete(key);
  }
}

/**
 * Create and persist a new OTP for an email. Replaces any previous OTP for that email.
 *
 * @param {string} email
 * @returns {Promise<string>} the plaintext 6-digit code (caller emails it; never stored)
 */
async function createOtp(email) {
  const normalized = normalizeEmail(email);
  const code = generateOtpCode();
  const otpHash = hashOtp(normalized, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Single active OTP per email: delete then insert.
    await supabaseAdmin.from('report_lookup_otp').delete().eq('email', normalized);
    const { error } = await supabaseAdmin
      .from('report_lookup_otp')
      .insert([{
        email: normalized,
        otp_hash: otpHash,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
      }]);
    if (error) throw error;
  } catch (err) {
    // TODO migrate to durable store — in-memory fallback is per-Lambda-instance only.
    console.warn('[ReportLookupOtp] DB store unavailable, falling back to in-memory store:', err.message);
    pruneMemoryStore();
    memoryStore.set(normalized, {
      otpHash,
      attempts: 0,
      expiresAt: expiresAt.getTime(),
    });
  }

  return code;
}

function timingSafeHexEqual(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Verify an OTP. Single use — deleted on success. Counts failed attempts.
 *
 * @param {string} email
 * @param {string} code
 * @returns {Promise<boolean>} true if valid
 */
async function verifyOtp(email, code) {
  const normalized = normalizeEmail(email);
  if (!/^\d{6}$/.test(String(code || ''))) return false;

  const candidateHash = hashOtp(normalized, String(code));

  // Try DB first
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('report_lookup_otp')
      .select('id, otp_hash, attempts, expires_at')
      .eq('email', normalized)
      .maybeSingle();

    if (error) throw error;

    if (row) {
      if (new Date(row.expires_at).getTime() <= Date.now() || row.attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin.from('report_lookup_otp').delete().eq('id', row.id);
        return false;
      }
      if (timingSafeHexEqual(row.otp_hash, candidateHash)) {
        // Single use — consume on success
        await supabaseAdmin.from('report_lookup_otp').delete().eq('id', row.id);
        return true;
      }
      await supabaseAdmin
        .from('report_lookup_otp')
        .update({ attempts: row.attempts + 1 })
        .eq('id', row.id);
      return false;
    }
    // No DB row — fall through to memory fallback (covers DB-down-at-create case)
  } catch (err) {
    console.warn('[ReportLookupOtp] DB verify unavailable, checking in-memory store:', err.message);
  }

  // In-memory fallback. TODO migrate to durable store.
  const entry = memoryStore.get(normalized);
  if (!entry) return false;
  if (entry.expiresAt <= Date.now() || entry.attempts >= MAX_ATTEMPTS) {
    memoryStore.delete(normalized);
    return false;
  }
  if (timingSafeHexEqual(entry.otpHash, candidateHash)) {
    memoryStore.delete(normalized); // single use
    return true;
  }
  entry.attempts += 1;
  return false;
}

module.exports = {
  createOtp,
  verifyOtp,
  // exported for tests
  _hashOtp: hashOtp,
  _memoryStore: memoryStore,
  OTP_TTL_MS,
  MAX_ATTEMPTS,
};
