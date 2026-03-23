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
  password?: string; // Optional for magic link auth
}

export interface SignupCredentials {
  email: string;
  password?: string; // Optional for magic link auth
  name?: string;
  full_name?: string;
}

// ---------------------------------------------
// Saju (사주) Types
// ---------------------------------------------

export interface BirthInfo {
  // Child information
  birthDate: string; // YYYY-MM-DD format or YYYY.MM.DD
  birthTime?: string; // HH:MM format (24-hour)
  gender: 'male' | 'female';
  isLunar?: boolean; // true for lunar calendar
  timezone?: string; // e.g., 'Asia/Seoul'
  language?: 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'id' | 'es' | 'pt';
  // Location for True Solar Time (진태양시) correction
  birthPlace?: string; // City name (e.g., '서울', 'sydney')
  latitude?: number; // Direct latitude (-90 to 90)
  longitude?: number; // Direct longitude (-180 to 180)
  // Parent information (for relationship analysis)
  parentBirthDate?: string; // Parent's birth date
  parentBirthTime?: string; // Parent's birth time
  parentRole?: 'mother' | 'father'; // Which parent
  parentGender?: 'M' | 'F'; // Parent's gender
  // Twin information
  twinOrder?: 1 | 2; // 1 = first born, 2 = second born
  twinSiblingName?: string; // Twin sibling's name
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

export interface SolarTimeCorrection {
  applied: boolean;
  solarTimeCorrection: number; // minutes
  isSouthernHemisphere: boolean;
  adjustedTime: string | null; // e.g., "12:03"
  adjustedDate: string | null; // e.g., "1979-04-05" (if date shifted)
  birthPlace: string | null;
  historicalTzNote: string | null;
  note: string; // Human-readable description
}

export interface ManseryeokResult {
  pillars: FourPillars;
  elements: Elements;
  dayMaster: string; // 일간 (日干)
  solarDate?: string;
  lunarDate?: string;
  corrections?: SolarTimeCorrection; // 진태양시 보정 정보
}

export interface AIInterpretation {
  fullText: string;
  sections: {
    // Legacy fields
    personality?: string;
    career?: string;
    relationships?: string;
    health?: string;
    wealth?: string;
    advice?: string;
    // Premium 8-section structure
    coreProfile?: string;        // 1. 사주 핵심 프로필
    parentChildAnalysis?: string; // 2. 부모-자녀 관계 분석
    developmentGuide?: string;   // 3. 연령별 발달 가이드
    careerAptitude?: string;     // 4. 진로/적성 심층 분석
    fortuneCycles?: string;      // 5. 대운/세운 운세 흐름
    monthlyFortune?: string;     // 6. 월별 운세 리포트
    elementBalance?: string;     // 7. 오행 밸런스 & 개운법
    weeklyActions?: string;      // 8. 이번 주 실천 과제
    preamble?: string;           // Intro text before sections
  };
  metadata: {
    model: string;
    tokens: number;
    generatedAt: string;
    isPreview?: boolean;
    reportType?: string;
    hasParentAnalysis?: boolean;
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
  interpretation?: string;
  premiumSections?: Record<string, string>;
  created_at: string;
}

// ---------------------------------------------
// Payment Types
// ---------------------------------------------

export type PaymentMethod = 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

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

// ---------------------------------------------
// Promo Code Types
// ---------------------------------------------

export interface PromoValidateResponse {
  valid: boolean;
  error?: string;
  promoCode?: {
    id: string;
    code: string;
    partnerName: string;
    discountType: 'free' | 'percent' | 'fixed';
    discountValue: number;
  };
}

export interface PromoCalculateRequest extends BirthInfo {
  promoCode: string;
  email: string;
  subjectName?: string;
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
  language: 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'id' | 'es' | 'pt';
  birthPlace?: string;
  isTwin?: boolean;
  twinOrder?: 1 | 2;
  twinSiblingName?: string;
}

export interface PaymentFormData {
  paymentMethod: PaymentMethod;
  agreeToTerms: boolean;
}
