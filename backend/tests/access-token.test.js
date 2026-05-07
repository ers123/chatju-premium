const { createAccessToken, verifyAccessToken } = require('../src/utils/accessToken');

describe('accessToken utility', () => {
  beforeEach(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  });

  test('verifies a token with matching scope', () => {
    const token = createAccessToken({ purpose: 'report', readingId: 'reading-1' });
    const payload = verifyAccessToken(token, { purpose: 'report', readingId: 'reading-1' });

    expect(payload.purpose).toBe('report');
    expect(payload.readingId).toBe('reading-1');
  });

  test('rejects a token with mismatched scope', () => {
    const token = createAccessToken({ purpose: 'report', readingId: 'reading-1' });

    expect(() => verifyAccessToken(token, { purpose: 'payment' })).toThrow('Access token scope mismatch');
  });

  test('rejects an expired token', () => {
    const token = createAccessToken({ purpose: 'payment', paypalOrderId: 'paypal-1' }, -1);

    expect(() => verifyAccessToken(token, { purpose: 'payment' })).toThrow('Expired access token');
  });
});
