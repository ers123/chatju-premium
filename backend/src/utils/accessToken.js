const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 30 * 60;

// Clearly-marked development-only fallback. NEVER used in production.
const DEV_FALLBACK_SECRET = 'dev-only-insecure-access-token-secret';

// Fail closed at startup: a dedicated signing secret is mandatory in production.
// (Reusing SUPABASE_SERVICE_KEY / PAYPAL_CLIENT_SECRET as signing keys is forbidden —
// leaking either would let attackers forge report/payment access tokens.)
if (!process.env.ACCESS_TOKEN_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('ACCESS_TOKEN_SECRET must be set in production (dedicated secret, do not reuse other credentials)');
}

let warnedDevFallback = false;

function getSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ACCESS_TOKEN_SECRET is not configured');
  }

  if (!warnedDevFallback) {
    console.warn('[accessToken] WARNING: ACCESS_TOKEN_SECRET not set — using insecure dev fallback secret (non-production only)');
    warnedDevFallback = true;
  }
  return DEV_FALLBACK_SECRET;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createAccessToken(claims, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const payload = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyAccessToken(token, expected = {}) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Missing access token');
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new Error('Invalid access token');
  }
  const expectedSignature = signPayload(encodedPayload);
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error('Invalid access token');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid access token payload');
  }

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Expired access token');
  }

  for (const [key, value] of Object.entries(expected)) {
    if (value !== undefined && payload[key] !== value) {
      throw new Error('Access token scope mismatch');
    }
  }

  return payload;
}

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
