// ============================================
// ChatJu Premium - Utility Functions
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ---------------------------------------------
// Tailwind CSS Class Merge Utility
// ---------------------------------------------

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------
// Date & Time Utilities
// ---------------------------------------------

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time to HH:MM (24-hour format)
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate time string (HH:MM)
 */
export function isValidTime(timeString: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
}

// ---------------------------------------------
// Element Color Utilities
// ---------------------------------------------

/**
 * Get color for Five Elements (오행)
 */
export function getElementColor(element: string): string {
  const elementMap: Record<string, string> = {
    wood: '#10b981', // emerald-500
    fire: '#ef4444', // red-500
    earth: '#f59e0b', // amber-500
    metal: '#6b7280', // gray-500
    water: '#3b82f6', // blue-500
    목: '#10b981',
    화: '#ef4444',
    토: '#f59e0b',
    금: '#6b7280',
    수: '#3b82f6',
  };

  const key = element.toLowerCase().trim();
  return elementMap[key] || '#6b7280';
}

/**
 * Get element name in English
 */
export function getElementNameEn(koreanElement: string): string {
  const elementMap: Record<string, string> = {
    목: 'Wood',
    화: 'Fire',
    토: 'Earth',
    금: 'Metal',
    수: 'Water',
  };

  return elementMap[koreanElement] || koreanElement;
}

/**
 * Get element name in Korean
 */
export function getElementNameKo(englishElement: string): string {
  const elementMap: Record<string, string> = {
    wood: '목',
    fire: '화',
    earth: '토',
    metal: '금',
    water: '수',
  };

  return elementMap[englishElement.toLowerCase()] || englishElement;
}

// ---------------------------------------------
// Currency Utilities
// ---------------------------------------------

/**
 * Format currency (KRW or USD)
 */
export function formatCurrency(amount: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString('ko-KR')}`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Convert KRW to USD (approximate)
 */
export function krwToUsd(krw: number): number {
  const exchangeRate = 0.00077; // Approximate rate (1 KRW ≈ 0.00077 USD)
  return Math.round(krw * exchangeRate * 100) / 100;
}

/**
 * Convert USD to KRW (approximate)
 */
export function usdToKrw(usd: number): number {
  const exchangeRate = 1300; // Approximate rate (1 USD ≈ 1300 KRW)
  return Math.round(usd * exchangeRate);
}

// ---------------------------------------------
// Payment Method Utilities
// ---------------------------------------------

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string, language: 'ko' | 'en'): string {
  const names: Record<string, Record<string, string>> = {
    toss: { ko: '토스페이', en: 'Toss Payments' },
    paypal: { ko: '페이팔', en: 'PayPal' },
    stripe: { ko: '신용카드', en: 'Credit Card' },
  };

  return names[method]?.[language] || method;
}

/**
 * Determine payment method priority based on user location
 */
export function getPaymentMethodPriority(userLanguage: 'ko' | 'en'): string[] {
  if (userLanguage === 'ko') {
    return ['toss', 'paypal', 'stripe'];
  } else {
    return ['paypal', 'toss', 'stripe'];
  }
}

// ---------------------------------------------
// Language Utilities
// ---------------------------------------------

/**
 * Get browser language preference
 */
export function getBrowserLanguage(): 'ko' | 'en' {
  if (typeof window === 'undefined') return 'ko';

  const lang = navigator.language || 'ko';
  return lang.startsWith('ko') ? 'ko' : 'en';
}

/**
 * Get localized text
 */
export function t(key: string, language: 'ko' | 'en'): string {
  const translations: Record<string, Record<string, string>> = {
    // Common
    loading: { ko: '로딩 중...', en: 'Loading...' },
    error: { ko: '오류', en: 'Error' },
    success: { ko: '성공', en: 'Success' },
    cancel: { ko: '취소', en: 'Cancel' },
    confirm: { ko: '확인', en: 'Confirm' },
    close: { ko: '닫기', en: 'Close' },

    // Auth
    login: { ko: '로그인', en: 'Login' },
    signup: { ko: '회원가입', en: 'Sign Up' },
    logout: { ko: '로그아웃', en: 'Logout' },
    email: { ko: '이메일', en: 'Email' },
    password: { ko: '비밀번호', en: 'Password' },
    full_name: { ko: '이름', en: 'Full Name' },

    // Saju
    birth_date: { ko: '생년월일', en: 'Birth Date' },
    birth_time: { ko: '출생 시간', en: 'Birth Time' },
    gender: { ko: '성별', en: 'Gender' },
    male: { ko: '남성', en: 'Male' },
    female: { ko: '여성', en: 'Female' },
    get_preview: { ko: '무료 미리보기', en: 'Get Free Preview' },
    upgrade_to_premium: { ko: '프리미엄 구매', en: 'Upgrade to Premium' },

    // Payment
    payment: { ko: '결제', en: 'Payment' },
    payment_method: { ko: '결제 방법', en: 'Payment Method' },
    amount: { ko: '금액', en: 'Amount' },
    pay_now: { ko: '결제하기', en: 'Pay Now' },
  };

  return translations[key]?.[language] || key;
}

// ---------------------------------------------
// Storage Utilities
// ---------------------------------------------

/**
 * Save to localStorage
 */
export function saveToStorage(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Get from localStorage
 */
export function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Remove from localStorage
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// ---------------------------------------------
// Validation Utilities
// ---------------------------------------------

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters
  return password.length >= 8;
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
}
