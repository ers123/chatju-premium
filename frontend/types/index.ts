// ============================================
// ChatJu Premium - TypeScript Type Definitions
// ============================================

// ---------------------------------------------
// User & Authentication Types
// ---------------------------------------------

export interface User {
  id: string;
  email: string;
  full_name?: string;
  language_preference?: 'ko' | 'en';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  full_name?: string;
}

// ---------------------------------------------
// Saju (사주) Types
// ---------------------------------------------

export interface BirthInfo {
  birthDate: string; // YYYY-MM-DD format
  birthTime?: string; // HH:MM format (24-hour)
  gender: 'male' | 'female';
  timezone?: string; // e.g., 'Asia/Seoul'
  language?: 'ko' | 'en';
}

export interface Pillar {
  korean: string; // e.g., "甲子"
  element: string; // e.g., "Wood(甲) + Water(子)"
  heavenlyStem: string; // 천간 (e.g., "甲")
  earthlyBranch: string; // 지지 (e.g., "子")
}

export interface FourPillars {
  year: Pillar; // 년주
  month: Pillar; // 월주
  day: Pillar; // 일주
  hour: Pillar; // 시주
}

export interface Elements {
  wood: number; // 목(木)
  fire: number; // 화(火)
  earth: number; // 토(土)
  metal: number; // 금(金)
  water: number; // 수(水)
}

export interface ManseryeokResult {
  pillars: FourPillars;
  elements: Elements;
  dayMaster: string; // 일간 (日干)
  solarDate: string;
  lunarDate: string;
}

export interface AIInterpretation {
  fullText: string;
  sections: {
    personality?: string;
    career?: string;
    relationships?: string;
    health?: string;
    wealth?: string;
    advice?: string;
  };
  metadata: {
    model: string;
    tokens: number;
    generatedAt: string;
    isPreview?: boolean;
  };
}

export interface SajuPreview {
  manseryeok: ManseryeokResult;
  aiPreview: {
    shortText: string;
    sections: {
      overview: string;
      personality: string;
      advice: string;
    };
    metadata: {
      model: string;
      tokens: number;
      generatedAt: string;
      isPreview: boolean;
    };
  };
  metadata: {
    birthDate: string;
    birthTime?: string;
    gender: string;
    language: string;
    timezone: string;
  };
  isPaid: boolean;
  message: string;
  upgradeUrl: string;
}

export interface SajuReading {
  id: string;
  user_id: string;
  order_id: string;
  birth_date: string;
  birth_time?: string;
  gender: 'male' | 'female';
  timezone: string;
  language: 'ko' | 'en';
  manseryeok_result: ManseryeokResult;
  ai_interpretation: AIInterpretation;
  created_at: string;
}

// ---------------------------------------------
// Payment Types
// ---------------------------------------------

export type PaymentMethod = 'toss' | 'paypal' | 'stripe' | 'paddle';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaddleProductType = 'basic' | 'deluxe';

export interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  currency: 'KRW' | 'USD';
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_key?: string;
  product_type: 'premium_saju';
  created_at: string;
  updated_at: string;
}

export interface TossPaymentRequest {
  amount: number;
  orderName: string; // e.g., "사주팔자 프리미엄 해석"
}

export interface TossPaymentResponse {
  success: boolean;
  orderId: string;
  amount: number;
  orderName: string;
  successUrl: string;
  failUrl: string;
}

export interface PayPalPaymentRequest {
  amount: number;
  description: string; // e.g., "Premium Fortune Reading"
}

export interface PayPalPaymentResponse {
  success: boolean;
  orderId: string;
  paypalOrderId: string;
  approvalUrl: string;
  amount: number;
  currency: string;
}

export interface StripePaymentRequest {
  amount: number; // in cents (e.g., 1000 = $10)
  description: string;
}

export interface StripePaymentResponse {
  success: boolean;
  orderId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface PaddlePaymentRequest {
  productType: PaddleProductType;
  email: string;
}

export interface PaddlePaymentResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  priceId: string;
  customData: {
    orderId: string;
    userId: string;
  };
  customerEmail: string;
  clientToken: string;
}

// ---------------------------------------------
// API Response Types
// ---------------------------------------------

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}

// ---------------------------------------------
// UI Component Types
// ---------------------------------------------

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface InputProps {
  id?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'date' | 'time';
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ---------------------------------------------
// Store Types (Zustand)
// ---------------------------------------------

export interface AppStore {
  // Auth state
  auth: AuthState;
  setAuth: (auth: Partial<AuthState>) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;

  // Saju state
  currentPreview: SajuPreview | null;
  currentReading: SajuReading | null;
  readings: SajuReading[];
  setCurrentPreview: (preview: SajuPreview | null) => void;
  setCurrentReading: (reading: SajuReading | null) => void;
  setReadings: (readings: SajuReading[]) => void;
  fetchReadings: () => Promise<void>;

  // Payment state
  currentPayment: Payment | null;
  setCurrentPayment: (payment: Payment | null) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

// ---------------------------------------------
// Form Types
// ---------------------------------------------

export interface BirthInfoFormData {
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  gender: 'male' | 'female';
  timezone: string;
  language: 'ko' | 'en';
}

export interface PaymentFormData {
  paymentMethod: PaymentMethod;
  agreeToTerms: boolean;
}
