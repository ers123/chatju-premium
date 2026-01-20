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
  TossPaymentRequest,
  TossPaymentResponse,
  PayPalPaymentRequest,
  PayPalPaymentResponse,
  StripePaymentRequest,
  StripePaymentResponse,
  PaddlePaymentRequest,
  PaddlePaymentResponse,
  Payment,
  ApiResponse,
  ApiError,
} from '@/types';

// ---------------------------------------------
// Configuration
// ---------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ---------------------------------------------
// Axios Instance
// ---------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
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

      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('chatju_token');
          localStorage.removeItem('chatju_user');
          window.location.href = '/auth/login';
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
    const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current user profile (requires authentication)
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
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
   * Get FULL Saju reading (requires authentication + payment)
   * Returns: Complete Four Pillars + full AI interpretation
   */
  getFullReading: async (orderId: string, birthInfo: BirthInfo): Promise<SajuReading> => {
    const response = await api.post<SajuReading>('/saju/calculate', {
      orderId,
      ...birthInfo,
    });
    return response.data;
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
  // Payment - Toss Payments (PRIMARY - Korea)
  // ===========================================

  /**
   * Create Toss Payments order (Korean users)
   */
  createTossPayment: async (data: TossPaymentRequest): Promise<TossPaymentResponse> => {
    const response = await api.post<TossPaymentResponse>('/payment/toss/create', data);
    return response.data;
  },

  /**
   * Confirm Toss Payments (after user approval)
   */
  confirmTossPayment: async (paymentKey: string, orderId: string, amount: number): Promise<Payment> => {
    const response = await api.post<Payment>('/payment/toss/confirm', {
      paymentKey,
      orderId,
      amount,
    });
    return response.data;
  },

  // ===========================================
  // Payment - PayPal (PRIMARY - International)
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
  capturePayPalPayment: async (paypalOrderId: string): Promise<Payment> => {
    const response = await api.post<Payment>('/payment/paypal/capture', {
      paypalOrderId,
    });
    return response.data;
  },

  // ===========================================
  // Payment - Stripe (OPTIONAL - International)
  // ===========================================

  /**
   * Create Stripe payment intent (International users - optional)
   */
  createStripePayment: async (data: StripePaymentRequest): Promise<StripePaymentResponse> => {
    const response = await api.post<StripePaymentResponse>('/payment/stripe/create', data);
    return response.data;
  },

  // ===========================================
  // Payment - Paddle (RECOMMENDED - International MoR)
  // ===========================================

  /**
   * Create Paddle checkout session (International users - Merchant of Record)
   * Paddle handles VAT/GST automatically
   */
  createPaddlePayment: async (data: PaddlePaymentRequest): Promise<PaddlePaymentResponse> => {
    const response = await api.post<PaddlePaymentResponse>('/payment/paddle/create', data);
    return response.data;
  },

  // ===========================================
  // Payment - Common
  // ===========================================

  /**
   * Get payment by order ID
   */
  getPaymentByOrderId: async (orderId: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payment/order/${orderId}`);
    return response.data;
  },

  /**
   * Get all payments for current user (requires authentication)
   */
  getUserPayments: async (): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/payment/history');
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
