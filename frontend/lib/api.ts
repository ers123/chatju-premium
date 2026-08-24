// ============================================
// ChatJu Premium - API Client
// ============================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  LoginCredentials,
  SignupCredentials,
  BirthInfo,
  SajuPreview,
  SajuReading,
  PayPalPaymentRequest,
  PayPalPaymentResponse,
  Payment,
  ApiResponse,
  ApiError,
  PromoValidateResponse,
  PromoCalculateRequest,
  ReportLookupTokenResponse,
} from '@/types';
import { API_BASE_URL } from '@/lib/api-url';

// ---------------------------------------------
// Configuration
// ---------------------------------------------

// ---------------------------------------------
// Axios Instance
// ---------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (AI generation can take 30-40s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------
// Request Interceptor (Add Auth Token)
// ---------------------------------------------

api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('chatju_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------------------------
// Response Interceptor (Error Handling)
// ---------------------------------------------

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle specific error codes
    if (error.response) {
      const apiError: ApiError = {
        error: error.response.data?.error || 'An error occurred',
        code: error.response.data?.code || 'UNKNOWN_ERROR',
        statusCode: error.response.status,
      };

      // Rate limited: normalize the code and surface Retry-After (seconds) so
      // callers can show a "wait and retry" state instead of a generic failure.
      if (error.response.status === 429) {
        apiError.code = 'RATE_LIMITED';
        const retryAfter = Number(error.response.headers?.['retry-after']);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          (apiError as ApiError & { retryAfterSeconds?: number }).retryAfterSeconds = retryAfter;
        }
      }

      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to signin
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chatju_token');
          localStorage.removeItem('chatju_user');
          // Store current path for redirect after login
          sessionStorage.setItem('redirect_after_login', window.location.pathname);
          window.location.href = '/auth/signin';
        }
      }

      return Promise.reject(apiError);
    }

    // Network error
    return Promise.reject({
      error: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      statusCode: 0,
    } as ApiError);
  }
);

// ---------------------------------------------
// API Client Functions
// ---------------------------------------------

export const apiClient = {
  // ===========================================
  // Authentication
  // ===========================================

  /**
   * Sign up a new user
   */
  signup: async (credentials: SignupCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post<{ user: User; token: string }>('/auth/signup', credentials);
    return response.data;
  },

  /**
   * Log in an existing user
   */
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post<{ user: User; token: string }>('/auth/signin', credentials);
    return response.data;
  },

  /**
   * Get current user profile (requires authentication)
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Delete current user account and all associated data (requires authentication)
   */
  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/auth/me');
    return response.data;
  },

  // ===========================================
  // Saju (사주) - FREE Preview
  // ===========================================

  /**
   * Get FREE Saju preview (no authentication required)
   * Returns: Basic Four Pillars + truncated AI interpretation
   */
  getPreview: async (birthInfo: BirthInfo): Promise<SajuPreview> => {
    const response = await api.post<SajuPreview>('/saju/preview', birthInfo);
    return response.data;
  },

  // ===========================================
  // Saju (사주) - PAID Full Reading
  // ===========================================

  /**
   * Get FULL Saju reading (requires completed payment; guest flow uses paymentAccessToken)
   * Returns: Complete Four Pillars + full AI interpretation
   * @param claimKey - Raw claim key generated client-side; backend stores sha256(claimKey).
   *   Allows in-flow polling via reading-check?claim= without OTP.
   */
  getFullReading: async (orderId: string, birthInfo: BirthInfo, paymentAccessToken?: string, claimKey?: string): Promise<SajuReading> => {
    const response = await api.post<SajuReading>('/saju/calculate', {
      orderId,
      paymentAccessToken,
      ...birthInfo,
      ...(claimKey ? { claimKey } : {}),
      // 202 + 폴링을 감당할 수 있다고 서버에 밝힌다. 이 플래그가 없으면 서버는
      // 예전처럼 다 만들 때까지 응답을 붙들고, 30초에서 게이트웨이가 끊는다.
      ...(claimKey ? { async: true } : {}),
    });
    return awaitPendingReading(response, claimKey) as Promise<SajuReading>;
  },

  /**
   * Create (or re-fetch) the public share link for a reading.
   * Ownership is proven with the same report token / claim key the feedback
   * endpoint uses — no new login, no new personal data. The resulting page
   * carries the element result only: no child name, no birth date.
   */
  createShareLink: async (proof: { token?: string; claimKey?: string }): Promise<{ shareToken: string }> => {
    const response = await api.post<{ success: boolean; shareToken: string }>('/saju/share', proof);
    return { shareToken: response.data.shareToken };
  },

  /** Turn an existing share link off. The URL 404s immediately afterwards. */
  revokeShareLink: async (proof: { token?: string; claimKey?: string }): Promise<void> => {
    await api.post('/saju/share/revoke', proof);
  },

  /**
   * PII-free funnel signal. Fire-and-forget: a lost beacon must never
   * surface as a user-visible error. Currently only 'purchase_intent'
   * (ko has no checkout; this click is the demand counter for reopening
   * the Korean payment rail).
   */
  trackPurchaseIntent: (language: string): void => {
    api.post('/saju/track', { event: 'purchase_intent', language }).catch(() => {});
  },

  /**
   * Get a specific Saju reading by ID (requires authentication)
   */
  getReadingById: async (readingId: string): Promise<SajuReading> => {
    const response = await api.get<SajuReading>(`/saju/reading/${readingId}`);
    return response.data;
  },

  /**
   * Get all Saju readings for current user (requires authentication)
   */
  getUserReadings: async (): Promise<SajuReading[]> => {
    const response = await api.get<SajuReading[]>('/saju/readings');
    return response.data;
  },

  // ===========================================
  // Payment - PayPal
  // ===========================================

  /**
   * Create PayPal order (International users)
   */
  createPayPalPayment: async (data: PayPalPaymentRequest): Promise<PayPalPaymentResponse> => {
    const response = await api.post<PayPalPaymentResponse>('/payment/paypal/create', data);
    return response.data;
  },

  /**
   * Capture PayPal payment (after user approval)
   */
  capturePayPalPayment: async (paypalOrderId: string, paymentAccessToken: string): Promise<Payment> => {
    const response = await api.post<Payment>('/payment/paypal/capture', {
      paypalOrderId,
      paymentAccessToken,
    });
    return response.data;
  },

  /**
   * PortOne(국내 PG) 결제 검증 — 결제창 성공 후 서버 대조.
   */
  verifyPortonePayment: async (portonePaymentId: string, email: string, language: string): Promise<{ success: boolean; payment: Record<string, unknown>; paymentAccessToken: string }> => {
    const response = await api.post('/payment/portone/verify', { portonePaymentId, email, language });
    return response.data;
  },

  // ===========================================
  // Payment - Common
  // ===========================================

  /**
   * Get payment by order ID
   */
  // Backend route is GET /payment/:orderId (payment.routes.js) — not /payment/order/:id.
  getPaymentByOrderId: async (orderId: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payment/${orderId}`);
    return response.data;
  },

  /**
   * Get all payments for current user (requires authentication)
   */
  // Backend route is GET /payment/history/me. Calling /payment/history would fall
  // through to GET /payment/:orderId with orderId="history" and be rejected.
  getUserPayments: async (): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/payment/history/me');
    return response.data;
  },

  // ===========================================
  // Promo Code
  // ===========================================

  /**
   * Validate a promo code (no authentication required)
   */
  validatePromoCode: async (code: string): Promise<PromoValidateResponse> => {
    const response = await api.post<PromoValidateResponse>('/promo/validate', { code });
    return response.data;
  },

  /**
   * Generate reading with promo code (no authentication required)
   * Accepts an optional claimKey (raw secret) so the backend tags the reading with
   * sha256(claimKey), enabling in-flow polling via reading-check?claim= without OTP.
   */
  calculateWithPromo: async (data: PromoCalculateRequest & { claimKey?: string }): Promise<SajuReading> => {
    const response = await api.post<SajuReading>('/saju/calculate-promo', {
      ...data,
      ...(data.claimKey ? { async: true } : {}),
    });
    return awaitPendingReading(response, data.claimKey) as Promise<SajuReading>;
  },

  createReportLookupToken: async (data: { email: string; orderId?: string; promoCode?: string }): Promise<ReportLookupTokenResponse> => {
    const response = await api.post<ReportLookupTokenResponse>('/saju/report-lookup-token', data);
    return response.data;
  },

  // ===========================================
  // Admin - AI Provider Management
  // ===========================================

  /**
   * Get current AI provider information (requires authentication)
   */
  getAIProviderInfo: async (): Promise<any> => {
    const response = await api.get('/admin/ai-provider');
    return response.data;
  },

  /**
   * Switch AI provider (requires authentication)
   */
  switchAIProvider: async (provider: 'openai' | 'gemini' | 'claude'): Promise<any> => {
    const response = await api.post('/admin/ai-provider', { provider });
    return response.data;
  },

  /**
   * Get admin statistics (requires authentication)
   */
  getAdminStats: async (): Promise<any> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// ---------------------------------------------
// Claim Key Utilities (in-flow polling without OTP)
// ---------------------------------------------

/**
 * Generate a cryptographically random 64-char hex claim key.
 * The raw key is given to the server at calculation time and stored as sha256(key).
 * Possession of the raw key later authorises reading-check polling (no OTP needed).
 */
export function generateClaimKey(): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buf = new Uint8Array(32);
    window.crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // SSR / Node fallback: concatenate two UUIDs (128 bits → still fine for a secret)
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

/**
 * 서버가 202(생성 중)를 주면 claim key로 결과를 받아 온다.
 *
 * 리포트 한 건에 40~50초가 걸리는데 API Gateway는 30초에서 끊는다. 그래서 서버는
 * 검증만 끝내고 생성을 잡으로 넘긴 뒤 202를 준다. 호출자 입장에서는 예전과 똑같이
 * "완성된 리포트가 담긴 프로미스"로 보이게 여기서 기다려 준다.
 *
 * 시간 안에 못 받으면 `REPORT_PENDING`으로 던진다 — 호출자가 다시 폴링하지 않고
 * 바로 "생성 중" 화면으로 갈 수 있게 하는 신호다.
 */
async function awaitPendingReading(
  response: { status: number; data: unknown },
  claimKey?: string
): Promise<unknown> {
  if (response.status !== 202) return response.data;
  if (!claimKey) throw { code: 'REPORT_PENDING', statusCode: 202 };

  // 생성 자체가 40~50초다. 폴링 예산을 그보다 넉넉하게 잡는다(5초 × 18 = 90초).
  const reading = await pollForReadingByClaim(claimKey, { maxAttempts: 18 });
  if (!reading) throw { code: 'REPORT_PENDING', statusCode: 202 };
  return reading;
}

/**
 * Poll GET /saju/reading-check?claim=<rawClaimKey> until the reading is ready.
 * Returns the reading object on success, or null after maxAttempts.
 */
export async function pollForReadingByClaim(
  claimKey: string,
  { maxAttempts = 12, intervalMs = 5000 }: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<Record<string, unknown> | null> {
  const { buildApiUrl } = await import('@/lib/api-url');
  let consecutiveErrors = 0;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    try {
      const res = await fetch(buildApiUrl(`/saju/reading-check?claim=${encodeURIComponent(claimKey)}`));
      const data = await res.json();
      if (data.status === 'complete' && data.reading) return data.reading;
      // Backend signals a real fault (503 READING_CHECK_FAILED) as status
      // 'error' — distinct from 'pending'. Give up early after a streak so
      // the user sees the failure path instead of a 60-90s dead wait.
      consecutiveErrors = data.status === 'error' ? consecutiveErrors + 1 : 0;
      if (consecutiveErrors >= 3) return null;
    } catch {
      // transient network error — keep polling
    }
  }
  return null;
}

// ---------------------------------------------
// Utility Functions
// ---------------------------------------------

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return apiError.response?.data?.error || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiError>;
    return apiError.response?.status === 401;
  }
  return false;
};

export default api;
