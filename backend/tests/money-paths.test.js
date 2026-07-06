// Money-path unit tests:
//  1. Multi-currency product catalog (C3): resolution + PayPal amount formatting
//  2. Promo double-redemption (C1): 23505 unique violation → PROMO_ALREADY_USED
//  3. Empty AI content (C2): provider fallback on '', throw when all providers empty
//  4. PayPal capture idempotency: completed payment returns early, no second capture

// ── Mutable fake Supabase (jest.mock factories may only reference mock*-prefixed vars) ──
const mockSupabaseState = {
  insertError: null,        // error returned by .insert()
  singleRow: null,          // row returned by .single()
  rpcCalls: [],
  updateCalls: [],
};

jest.mock('../src/config/supabase', () => {
  const state = mockSupabaseState;
  function chain() {
    const c = {
      select: () => c,
      insert: () => (state.insertError
        ? { select: () => ({ single: async () => ({ data: null, error: state.insertError }) }) }
        : { select: () => ({ single: async () => ({ data: { id: 'usage-1' }, error: null }) }) }),
      update: (values) => { state.updateCalls.push(values); return c; },
      eq: () => c,
      order: () => c,
      limit: () => c,
      single: async () => ({ data: state.singleRow, error: state.singleRow ? null : { code: 'PGRST116', message: 'not found' } }),
    };
    return c;
  }
  return {
    supabaseAdmin: {
      from: () => chain(),
      rpc: async (name, args) => { state.rpcCalls.push({ name, args }); return { error: null }; },
    },
    supabase: { from: () => chain() },
    handleSupabaseError: (e) => new Error(e.message || 'db error'),
  };
});

jest.mock('axios', () => ({
  post: jest.fn(async () => { throw new Error('axios.post must not be called in this test'); }),
  get: jest.fn(async () => { throw new Error('axios.get must not be called in this test'); }),
}));

const axios = require('axios');
const {
  resolveProductByPricing,
  formatPayPalAmount,
  getProduct,
} = require('../src/config/products');

beforeEach(() => {
  mockSupabaseState.insertError = null;
  mockSupabaseState.singleRow = null;
  mockSupabaseState.rpcCalls = [];
  mockSupabaseState.updateCalls = [];
  axios.post.mockClear();
});

// ── 1. Multi-currency catalog (C3) ─────────────────────────────────────────
describe('product catalog (multi-currency)', () => {
  test('resolves every frontend pricing pair to a catalog product', () => {
    expect(resolveProductByPricing('USD', 4.99).id).toBe('premium_saju');
    expect(resolveProductByPricing('JPY', 490).id).toBe('premium_saju_jpy');
    expect(resolveProductByPricing('EUR', 3.49).id).toBe('premium_saju_eur_349');
    expect(resolveProductByPricing('EUR', 3.99).id).toBe('premium_saju_eur_399');
    expect(resolveProductByPricing('THB', 89).id).toBe('premium_saju_thb');
  });

  test('rejects client-invented prices', () => {
    expect(resolveProductByPricing('USD', 0.01)).toBeNull();
    expect(resolveProductByPricing('EUR', 4.99)).toBeNull();
    expect(resolveProductByPricing('KRW', 4900)).toBeNull();
    expect(resolveProductByPricing(undefined, 4.99)).toBeNull();
  });

  test('formats zero-decimal currencies without decimals for PayPal', () => {
    expect(formatPayPalAmount(getProduct('premium_saju_jpy'))).toBe('490');
    expect(formatPayPalAmount(getProduct('premium_saju'))).toBe('4.99');
    expect(formatPayPalAmount(getProduct('premium_saju_thb'))).toBe('89.00');
  });
});

// ── 2. Promo double-redemption (C1) ────────────────────────────────────────
describe('usePromoCode unique-violation handling', () => {
  const promoService = require('../src/services/promo.service');

  test('maps 23505 to PROMO_ALREADY_USED and does not increment used_count', async () => {
    mockSupabaseState.insertError = { code: '23505', message: 'duplicate key value violates unique constraint "uq_promo_usage_code_email"' };

    await expect(promoService.usePromoCode({
      promoCodeId: 'promo-1',
      email: 'dup@example.com',
      childBirthDate: '2020-01-01',
      readingId: 'reading-1',
    })).rejects.toMatchObject({ code: 'PROMO_ALREADY_USED' });

    expect(mockSupabaseState.rpcCalls).toHaveLength(0);
  });

  test('successful insert increments used_count via RPC', async () => {
    await promoService.usePromoCode({
      promoCodeId: 'promo-1',
      email: 'ok@example.com',
      childBirthDate: '2020-01-01',
      readingId: 'reading-2',
    });
    expect(mockSupabaseState.rpcCalls).toEqual([
      { name: 'increment_promo_used_count', args: { promo_id: 'promo-1' } },
    ]);
  });
});

// ── 3. Empty AI content (C2) ───────────────────────────────────────────────
describe('AIService empty-content handling', () => {
  const { AIService } = require('../src/services/ai.service');

  function bareService() {
    const svc = Object.create(AIService.prototype);
    svc.provider = 'openai';
    svc.models = { openai: 'm1', openaiFallback: 'm1', gemini: 'g', claude: 'c' };
    svc.clients = {};
    return svc;
  }

  test('falls back to the next provider when a provider returns empty content', async () => {
    const svc = bareService();
    svc.clients = { openai: {}, claude: {} };
    svc.generateWithOpenAI = async () => ({ content: '   ', usage: { total_tokens: 3 }, model: 'm1' });
    svc.generateWithClaude = async () => ({ content: 'real reading', tokensUsed: 10, model: 'c' });

    const result = await svc.generateFortune([{ role: 'user', content: 'hi' }]);
    expect(result.provider).toBe('claude');
    expect(result.content).toBe('real reading');
  });

  test('throws when every provider returns empty content', async () => {
    const svc = bareService();
    svc.clients = { openai: {}, claude: {} };
    svc.generateWithOpenAI = async () => ({ content: '', usage: { total_tokens: 0 }, model: 'm1' });
    svc.generateWithClaude = async () => ({ content: '', tokensUsed: 0, model: 'c' });

    await expect(svc.generateFortune([{ role: 'user', content: 'hi' }]))
      .rejects.toThrow(/empty content/);
  });

  test('generateWithOpenAIModel throws (not returns) on empty completion', async () => {
    const svc = bareService();
    svc.clients.openai = {
      chat: { completions: { create: async () => ({
        choices: [{ message: { content: '' }, finish_reason: 'length' }],
        usage: { total_tokens: 5000 },
      }) } },
    };
    await expect(svc.generateWithOpenAIModel('m1', [], 100, 0.7))
      .rejects.toThrow(/empty content/);
  });
});

// ── 4. PayPal capture idempotency ──────────────────────────────────────────
describe('capturePayPalPayment idempotency', () => {
  const { createAccessToken } = require('../src/utils/accessToken');
  const paymentService = require('../src/services/payment.service');

  test('already-completed payment returns existing record without calling PayPal', async () => {
    const paypalOrderId = 'PAYPAL-ORDER-123';
    const token = createAccessToken({
      purpose: 'payment',
      paypalOrderId,
      productType: 'premium_saju',
      amount: 4.99,
      currency: 'USD',
    });

    mockSupabaseState.singleRow = {
      id: 'pay-1',
      order_id: 'ord_1',
      status: 'completed',
      amount: 4.99,
      currency: 'USD',
      payment_method: 'paypal',
      confirmed_at: '2026-07-01T00:00:00Z',
      created_at: '2026-07-01T00:00:00Z',
      metadata: { product_type: 'premium_saju' },
    };

    const result = await paymentService.capturePayPalPayment(paypalOrderId, token);
    expect(result.success).toBe(true);
    expect(result.alreadyCaptured).toBe(true);
    expect(result.payment.order_id).toBe('ord_1');
    // The critical assertion: no second PayPal capture request is ever made
    expect(axios.post).not.toHaveBeenCalled();
  });
});
