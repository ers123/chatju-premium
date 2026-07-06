// ============================================
// ChatJu Premium - TypeScript Type Definitions
// ============================================

// ---------------------------------------------
// User & Authentication Types
// ---------------------------------------------

export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'id' | 'es' | 'pt' | 'fr' | 'th';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  language_preference?: SupportedLanguage;
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
  isLeapMonth?: boolean; // true for lunar leap month
  timezone?: string; // e.g., 'Asia/Seoul'
  language?: SupportedLanguage;
  // Location for True Solar Time (진태양시) correction
  birthPlace?: string; // City name (e.g., '서울', 'sydney')
  latitude?: number; // Direct latitude (-90 to 90)
  longitude?: number; // Direct longitude (-180 to 180)
  // Parent information (for relationship analysis)
  parentBirthDate?: string; // Parent's birth date
  parentBirthTime?: string; // Parent's birth time
  parentRole?: 'mother' | 'father'; // Which parent
  parentGender?: 'M' | 'F'; // Parent's gender
  parentIsLunar?: boolean; // true if parent's birth date is lunar
  parentIsLeapMonth?: boolean; // true if parent's lunar month is leap month
  // Twin information
  twinOrder?: 1 | 2; // 1 = first born, 2 = second born
  twinSiblingName?: string; // Twin sibling's name
  // Email for PDF delivery
  deliveryEmail?: string;
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
  dstWarning?: boolean; // 한국 서머타임 기간 출생 경고
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
    // Premium 9-section structure (v2)
    executiveSummary?: string;    // 1. 한눈에 보기
    whatChildIsNot?: string;      // 2. 이 아이는 ~이 아닙니다
    behavioralSignature?: string; // 3. 행동 시그니처
    situationPlaybook?: string;   // 4. 상황별 대응 플레이북
    hiddenStrengths?: string;     // 5. 숨겨진 강점
    timelineFocus?: string;       // 6. 이 시기의 흐름
    sevenDayExperiment?: string;  // 7. 7일 양육 실험
    coParentSummary?: string;     // 8. 함께 읽는 양육 카드
    lifestyleHarmony?: string;    // 9. 생활 속 밸런스
    // Legacy keys (backward compat)
    coreProfile?: string;
    fortuneCycles?: string;
    monthlyFortune?: string;
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
  readingId?: string;
  reportAccessToken?: string;
  user_id: string | null;
  order_id: string;
  birth_date: string;
  birth_time?: string;
  gender: 'male' | 'female';
  timezone: string;
  language: SupportedLanguage;
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
  user_id: string | null;
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
  amount?: number;
  currency?: string; // Display-consistency check; server price is authoritative
  description: string; // e.g., "Premium Fortune Reading"
  email?: string; // For receipt and PDF delivery
  /** Server catalog id (backend products.js); selects a fixed-price product */
  product_type?: string;
}

export interface PayPalPaymentResponse {
  success: boolean;
  orderId: string;
  paymentId?: string;
  paypalOrderId: string;
  paymentAccessToken: string;
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

export interface ReportLookupTokenResponse {
  success: boolean;
  reportLookupToken: string;
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
  language: SupportedLanguage;
  birthPlace?: string;
  isTwin?: boolean;
  twinOrder?: 1 | 2;
  twinSiblingName?: string;
}

export interface PaymentFormData {
  paymentMethod: PaymentMethod;
  agreeToTerms: boolean;
}
